/**
 * Notification state management using Zustand with Firebase
 */

import { create } from 'zustand';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  arrayUnion,
  Unsubscribe,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Notification } from '../types/notification.types';
import {
  playNotificationSound,
  showBrowserNotification,
  requestNotificationPermission,
} from '@/utils/notifications';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  currentUserId: string | null;
  hasRequestedPermission: boolean;

  // Actions
  setCurrentUserId: (userId: string | null) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAsUnread: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAllRead: () => Promise<void>;
  initNotificationListener: () => Unsubscribe | null;
  requestPermission: () => Promise<void>;

  // Internal
  _unsubscribe: Unsubscribe | null;
  _previousNotificationIds: Set<string>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: true,
  error: null,
  currentUserId: null,
  hasRequestedPermission: false,
  _unsubscribe: null,
  _previousNotificationIds: new Set(),

  setCurrentUserId: (userId) => {
    set({ currentUserId: userId });
  },

  requestPermission: async () => {
    const granted = await requestNotificationPermission();
    set({ hasRequestedPermission: true });
    if (granted) {
      console.log('[NotificationStore] Browser notification permission granted');
    }
  },

  markAsRead: async (notificationId) => {
    const { currentUserId, notifications } = get();
    if (!currentUserId) return;

    // Find the notification
    const notification = notifications.find((n) => n.id === notificationId);
    if (!notification || notification.read_by.includes(currentUserId)) {
      return; // Already read
    }

    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read_by: arrayUnion(currentUserId),
      });

      // Optimistic update
      set({
        notifications: notifications.map((n) =>
          n.id === notificationId ? { ...n, read_by: [...n.read_by, currentUserId] } : n
        ),
        unreadCount: Math.max(0, get().unreadCount - 1),
      });
    } catch (error) {
      console.error('[NotificationStore] Error marking as read:', error);
    }
  },

  markAsUnread: async (notificationId) => {
    const { currentUserId, notifications } = get();
    if (!currentUserId) return;

    // Find the notification
    const notification = notifications.find((n) => n.id === notificationId);
    if (!notification || !notification.read_by.includes(currentUserId)) {
      return; // Already unread
    }

    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      // Remove user from read_by array
      const newReadBy = notification.read_by.filter((id) => id !== currentUserId);
      await updateDoc(notificationRef, {
        read_by: newReadBy,
      });

      // Optimistic update
      set({
        notifications: notifications.map((n) =>
          n.id === notificationId ? { ...n, read_by: newReadBy } : n
        ),
        unreadCount: get().unreadCount + 1,
      });
    } catch (error) {
      console.error('[NotificationStore] Error marking as unread:', error);
    }
  },

  markAllAsRead: async () => {
    const { currentUserId, notifications } = get();
    if (!currentUserId) return;

    try {
      const unreadNotifications = notifications.filter((n) => !n.read_by.includes(currentUserId));

      if (unreadNotifications.length === 0) return;

      await Promise.all(
        unreadNotifications.map((n) =>
          updateDoc(doc(db, 'notifications', n.id), {
            read_by: arrayUnion(currentUserId),
          })
        )
      );

      // Optimistic update
      set({
        notifications: notifications.map((n) => ({
          ...n,
          read_by: n.read_by.includes(currentUserId) ? n.read_by : [...n.read_by, currentUserId],
        })),
        unreadCount: 0,
      });
    } catch (error) {
      console.error('[NotificationStore] Error marking all as read:', error);
    }
  },

  clearAllRead: async () => {
    const { currentUserId, notifications } = get();
    if (!currentUserId) return;

    try {
      // Find all read notifications for this user
      const readNotifications = notifications.filter((n) => n.read_by.includes(currentUserId));

      if (readNotifications.length === 0) return;

      // Delete all read notifications from Firestore
      await Promise.all(readNotifications.map((n) => deleteDoc(doc(db, 'notifications', n.id))));

      // Optimistic update - remove read notifications from local state
      set({
        notifications: notifications.filter((n) => !n.read_by.includes(currentUserId)),
      });

      console.log(`[NotificationStore] Cleared ${readNotifications.length} read notifications`);
    } catch (error) {
      console.error('[NotificationStore] Error clearing read notifications:', error);
    }
  },

  initNotificationListener: () => {
    const { currentUserId, _unsubscribe } = get();

    // Clean up existing listener
    if (_unsubscribe) {
      _unsubscribe();
    }

    if (!currentUserId) {
      set({
        notifications: [],
        unreadCount: 0,
        isLoading: false,
        _unsubscribe: null,
      });
      return null;
    }

    set({ isLoading: true });

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('target_role', '==', 'admin'),
      orderBy('created_at', 'desc'),
      limit(50) // Limit to last 50 notifications
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifications: Notification[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Notification[];

        const unreadCount = notifications.filter((n) => !n.read_by.includes(currentUserId)).length;

        // Check for new notifications (for sound/browser notification)
        const currentIds = new Set(notifications.map((n) => n.id));
        const prevIds = get()._previousNotificationIds;
        const isInitialLoad = prevIds.size === 0;

        // Find truly new notifications (not in previous set)
        const newNotifications = notifications.filter(
          (n) => !prevIds.has(n.id) && !n.read_by.includes(currentUserId)
        );

        // Play sound and show browser notification for new notifications
        // But not on initial load
        if (!isInitialLoad && newNotifications.length > 0) {
          // Play notification sound
          playNotificationSound();

          // Show browser notification for the first new notification
          const firstNew = newNotifications[0];
          showBrowserNotification(firstNew.title, {
            body: firstNew.message,
            tag: firstNew.id,
          });
        }

        set({
          notifications,
          unreadCount,
          isLoading: false,
          error: null,
          _previousNotificationIds: currentIds,
        });
      },
      (error) => {
        console.error('[NotificationStore] Listener error:', error);
        set({
          error: 'Error al cargar notificaciones',
          isLoading: false,
        });
      }
    );

    set({ _unsubscribe: unsubscribe });
    return unsubscribe;
  },
}));

/**
 * Helper to check if a notification is read by the current user
 */
export function isNotificationRead(notification: Notification, userId: string | null): boolean {
  if (!userId) return false;
  return notification.read_by.includes(userId);
}

/**
 * Helper to convert Firestore Timestamp to Date
 */
export function getNotificationDate(notification: Notification): Date {
  if (notification.created_at instanceof Timestamp) {
    return notification.created_at.toDate();
  }
  return new Date();
}
