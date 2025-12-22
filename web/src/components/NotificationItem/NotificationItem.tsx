/**
 * NotificationItem component
 * Displays a single notification with read/unread state
 */

import { type FC } from 'react';
import {
  useNotificationStore,
  getNotificationDate,
  isNotificationRead,
} from '@/core/store/notification-store';
import type { Notification } from '@/core/types/notification.types';
import { formatTimeAgo } from '@/utils/notifications';
import './NotificationItem.css';

interface NotificationItemProps {
  notification: Notification;
  onClose?: () => void;
}

export const NotificationItem: FC<NotificationItemProps> = ({ notification, onClose }) => {
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const currentUserId = useNotificationStore((state) => state.currentUserId);

  const isRead = isNotificationRead(notification, currentUserId);
  const createdAt = getNotificationDate(notification);
  const timeAgo = formatTimeAgo(createdAt);

  const handleClick = () => {
    if (!isRead) {
      markAsRead(notification.id);
    }
    // For now, just close the dropdown (no navigation)
    onClose?.();
  };

  return (
    <li
      className={`notification-item ${!isRead ? 'notification-item-unread' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      <div className="notification-item-indicator">
        {!isRead && <span className="unread-dot" aria-label="Sin leer" />}
      </div>
      <div className="notification-item-content">
        <p className="notification-item-title">{notification.title}</p>
        <p className="notification-item-message">{notification.message}</p>
        <span className="notification-item-time">{timeAgo}</span>
      </div>
    </li>
  );
};
