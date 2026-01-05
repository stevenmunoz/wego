/**
 * InDriver extraction types for Cloud Functions
 */

export type ExtractionStatus = 'pending' | 'extracting_text' | 'analyzing' | 'completed' | 'failed';

export type RideStatus = 'completed' | 'cancelled_by_passenger' | 'cancelled_by_driver';

export type PaymentMethod = 'cash' | 'nequi' | 'other';

export type DurationUnit = 'min' | 'hr';

export type DistanceUnit = 'km' | 'metro';

export interface Duration {
  value: number;
  unit: DurationUnit;
}

export interface Distance {
  value: number;
  unit: DistanceUnit;
}

export interface FieldConfidences {
  date: number;
  time: number;
  destination_address: number;
  duration: number;
  distance: number;
  passenger_name: number;
  payment_method: number;
  tarifa: number;
  total_recibido: number;
  comision_servicio: number;
  iva_pago_servicio: number;
  total_pagado: number;
  mis_ingresos: number;
}

export interface ExtractedInDriverRide {
  id: string;
  source_image_path: string;
  extraction_confidence: number;

  // Ride Details
  date: string | null;
  time: string;
  destination_address: string;
  duration: Duration | null;
  distance: Distance | null;

  // Passenger Info
  passenger_name: string;
  rating_given: number | null;

  // Status
  status: RideStatus;
  cancellation_reason: string | null;

  // Payment
  payment_method: PaymentMethod;
  payment_method_label: string;

  // Financial - Income
  tarifa: number;
  total_recibido: number;

  // Financial - Deductions
  comision_servicio: number;
  comision_porcentaje: number;
  iva_pago_servicio: number;
  total_pagado: number;

  // Financial - Net
  mis_ingresos: number;

  // Metadata
  extracted_at: string;
  raw_ocr_text: string;
  field_confidences: FieldConfidences;
}

export interface InDriverExtractionJob {
  id: string;
  user_id: string;
  storage_path: string;
  file_name: string;
  file_type: string;
  status: ExtractionStatus;
  progress_message: string;
  result: ExtractedInDriverRide | null;
  error: string | null;
  created_at: FirebaseFirestore.FieldValue;
  updated_at: FirebaseFirestore.FieldValue;
}

export interface GPTExtractionResult {
  date: string | null;
  time: string | null;
  destination_address: string | null;
  duration_value: number | null;
  duration_unit: DurationUnit | null;
  distance_value: number | null;
  distance_unit: DistanceUnit | null;
  passenger_name: string | null;
  rating_given: number | null;
  is_cancelled: boolean;
  cancelled_by_passenger: boolean;
  cancellation_reason: string | null;
  payment_method: PaymentMethod;
  tarifa: number | null;
  total_recibido: number | null;
  comision_servicio: number | null;
  comision_porcentaje: number | null;
  iva_pago_servicio: number | null;
  total_pagado: number | null;
  mis_ingresos: number | null;
  extraction_confidence: number;
}
