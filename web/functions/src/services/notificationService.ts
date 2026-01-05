/**
 * Notification service for creating notifications in Firestore
 */

import * as admin from 'firebase-admin';
import { CreateNotificationInput, Notification } from '../types/notification.types';

const db = admin.firestore();

/**
 * Creates a new notification document in Firestore
 * @param input - The notification data to create
 * @returns The ID of the created notification
 */
export async function createNotification(input: CreateNotificationInput): Promise<string> {
  const notificationRef = db.collection('notifications').doc();

  const notification: Omit<Notification, 'id'> = {
    ...input,
    read_by: [],
    created_at: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
  };

  await notificationRef.set(notification);

  console.log(`[NotificationService] Created notification ${notificationRef.id} of type ${input.type}`);

  return notificationRef.id;
}
