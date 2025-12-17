/**
 * External Rides Feature Types
 *
 * TypeScript interfaces for the public ride registration form
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// ENUMS AND LITERAL TYPES
// ============================================================================

export type RequestSource = 'whatsapp' | 'phone' | 'referral' | 'other';
export type TripReason = 'personal' | 'work' | 'emergency' | 'other';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export type ExternalPaymentMethod = 'cash' | 'nequi' | 'daviplata' | 'bancolombia' | 'other';
export type RideCategory = 'indriver' | 'independent' | 'external' | 'other';
export type SourceType = 'ocr_import' | 'public_form' | 'manual';

// ============================================================================
// DRIVER TYPES
// ============================================================================

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  unique_slug: string;
  photo_url?: string;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface FirestoreDriver extends Omit<Driver, 'id'> {
  // Firestore document structure (id comes from doc.id)
}

// ============================================================================
// EXTERNAL RIDE FORM INPUT
// ============================================================================

export interface ExternalRideInput {
  // Required fields
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (24h)
  origin_address: string;
  destination_address: string;
  total_received: number; // Fare in COP
  payment_method: ExternalPaymentMethod;
  request_source: RequestSource;
  trip_reason: TripReason;
  time_of_day: TimeOfDay;
  is_recurring: boolean;
  tip_received: boolean;

  // Optional fields
  tip_amount?: number;
  comments?: string;
}

// ============================================================================
// FIRESTORE EXTERNAL RIDE (extends base ride structure)
// ============================================================================

export interface FirestoreExternalRide {
  // Identification
  id: string;
  driver_id: string;
  vehicle_id?: string; // Optional for backward compatibility

  // Ride Details
  date: Timestamp;
  time: string;
  origin_address: string;
  destination_address: string;

  // Request context (external ride specific)
  request_source: RequestSource;
  trip_reason: TripReason;
  time_of_day: TimeOfDay;
  is_recurring: boolean;

  // Financial
  total_received: number;
  payment_method: string;
  payment_method_label: string;
  tip_received: boolean;
  tip_amount: number | null;

  // Calculated fields (for compatibility with existing rides)
  base_fare: number;
  service_commission: number;
  commission_percentage: number;
  service_tax: number;
  total_paid: number;
  net_earnings: number;

  // Status (always 'completed' for external rides)
  status: 'completed';

  // Categorization
  category: 'external';

  // Optional
  comments: string | null;

  // Metadata
  created_at: Timestamp;
  source_type: 'public_form';

  // Compatibility fields (nullable for external rides)
  source_image_path: string | null;
  extraction_confidence: number | null;
  duration_value: number | null;
  duration_unit: string | null;
  distance_value: number | null;
  distance_unit: string | null;
  passenger_name: string | null;
  rating_given: number | null;
  cancellation_reason: string | null;
  extracted_at: Timestamp | null;
  imported_at: Timestamp | null;
  raw_ocr_text: string | null;
}

// ============================================================================
// WIZARD STATE TYPES
// ============================================================================

export type WizardStep =
  | 'datetime'
  | 'origin'
  | 'destination'
  | 'fare'
  | 'request_source'
  | 'trip_reason'
  | 'time_of_day'
  | 'is_recurring'
  | 'payment_method'
  | 'tip'
  | 'comments'
  | 'confirmation'
  | 'success';

export interface WizardState {
  currentStep: WizardStep;
  stepHistory: WizardStep[];
  formData: Partial<ExternalRideInput>;
  isSubmitting: boolean;
  error: string | null;
}

export interface StepConfig {
  id: WizardStep;
  question: string; // Spanish question
  required: boolean;
  canSkip: boolean;
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

export interface StepProps {
  formData: Partial<ExternalRideInput>;
  onUpdate: (data: Partial<ExternalRideInput>) => void;
  onNext: () => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export interface RadioOption {
  value: string;
  label: string;
  icon?: string;
  description?: string;
}
