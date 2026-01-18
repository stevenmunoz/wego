/**
 * Notification types for the frontend
 */

import { Timestamp } from 'firebase/firestore';

// Extensible notification types for future use
export type NotificationType = 'external_driver_ride' | 'weekly_insights';

// Target roles for notifications
export type NotificationTargetRole = 'admin';

/**
 * Notification metadata for display
 */
export interface NotificationMetadata {
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
 * Notification document interface from Firestore
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
  target_role: NotificationTargetRole;

  // Read state (per-user tracking)
  read_by: string[];

  // Timestamps
  created_at: Timestamp;

  // Additional metadata for display
  metadata: NotificationMetadata;
}

/**
 * Notification with computed properties for display
 */
export interface NotificationDisplay extends Omit<Notification, 'created_at'> {
  created_at: Date;
  isRead: boolean;
  timeAgo: string;
}
