/**
 * Notification types for Cloud Functions
 */

import { Timestamp } from 'firebase-admin/firestore';

// Extensible notification types for future use
export type NotificationType = 'external_driver_ride' | 'weekly_insights';

// Target roles for notifications
export type TargetRole = 'admin';

/**
 * Notification document interface for Firestore
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;

  // Source reference
  source_collection: string;
  source_document_id: string;
  source_driver_id: string;

  // Targeting
  target_role: TargetRole;

  // Read state (per-user tracking)
  read_by: string[];

  // Timestamps
  created_at: Timestamp;

  // Additional metadata for display
  metadata: NotificationMetadata;
}

/**
 * Metadata for notification display
 */
export interface NotificationMetadata {
  // External ride metadata
  driver_name?: string;
  ride_destination?: string;
  ride_amount?: number;
  ride_category?: string;

  // Weekly insights metadata
  week_id?: string;
  week_range?: string;
  total_rides?: number;
  total_revenue?: number;
  action_url?: string;
}

/**
 * Input for creating a notification
 */
export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  source_collection: string;
  source_document_id: string;
  source_driver_id: string;
  target_role: TargetRole;
  metadata: NotificationMetadata;
}
