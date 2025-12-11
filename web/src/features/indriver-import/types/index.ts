/**
 * InDriver Import Feature Types
 */

export type DurationUnit = 'min' | 'hr';
export type DistanceUnit = 'km' | 'metro';
export type RideStatus = 'completed' | 'cancelled_by_passenger' | 'cancelled_by_driver';
export type PaymentMethod = 'cash' | 'nequi' | 'other';
export type ExportFormat = 'csv' | 'json' | 'xlsx';

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
  // Identification
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
  raw_ocr_text: string | null;
  field_confidences: FieldConfidences;
}

export interface ExtractionError {
  file_name: string;
  error: string;
}

export interface ExtractionSummary {
  total_files: number;
  successful_extractions: number;
  failed_extractions: number;
  average_confidence: number;
}

export interface ExtractResponse {
  success: boolean;
  results: ExtractedInDriverRide[];
  errors: ExtractionError[];
  summary: ExtractionSummary;
}

export interface ImportedRide {
  ride_id: string;
  external_id: string;
}

export interface SkippedRide {
  index: number;
  reason: string;
}

export interface ImportRequest {
  rides: ExtractedInDriverRide[];
  driver_id: string;
}

export interface ImportResponse {
  success: boolean;
  imported: ImportedRide[];
  skipped: SkippedRide[];
}

export interface ExportRequest {
  rides: ExtractedInDriverRide[];
  format: ExportFormat;
}

export interface ValidationResult {
  is_valid: boolean;
  errors: string[];
}

export interface ExtractionStats {
  total_extractions: number;
  successful_extractions: number;
  failed_extractions: number;
  average_confidence: number;
  tesseract_available: boolean;
}

// UI State Types
export interface UploadedFile {
  file: File;
  preview: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  result?: ExtractedInDriverRide;
  error?: string;
}

export interface ImportState {
  files: UploadedFile[];
  extractedRides: ExtractedInDriverRide[];
  isExtracting: boolean;
  isImporting: boolean;
  extractionError: string | null;
  importError: string | null;
  summary: ExtractionSummary | null;
}
