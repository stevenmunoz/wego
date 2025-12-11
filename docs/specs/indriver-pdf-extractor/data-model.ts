/**
 * InDriver PDF/OCR Extractor - Data Model
 *
 * TypeScript interfaces for extracted ride data from InDriver app
 * screenshots and PDF exports.
 */

import { z } from 'zod';

// ============================================================================
// Core Types
// ============================================================================

/**
 * Duration extracted from ride details
 */
export interface Duration {
  value: number;
  unit: 'min' | 'hr';
}

/**
 * Distance extracted from ride details
 */
export interface Distance {
  value: number;
  unit: 'km' | 'metro';
}

/**
 * Ride completion status
 */
export type RideStatus =
  | 'completed'
  | 'cancelled_by_passenger'
  | 'cancelled_by_driver';

/**
 * Payment method types supported by InDriver
 */
export type PaymentMethod = 'cash' | 'nequi' | 'other';

/**
 * Confidence scores for each extracted field
 */
export interface FieldConfidences {
  date: number;
  time: number;
  destinationAddress: number;
  duration: number;
  distance: number;
  passengerName: number;
  paymentMethod: number;
  tarifa: number;
  totalRecibido: number;
  comisionServicio: number;
  ivaPagoServicio: number;
  totalPagado: number;
  misIngresos: number;
  [key: string]: number;
}

// ============================================================================
// Main Extracted Ride Interface
// ============================================================================

/**
 * Complete extracted ride data from InDriver screenshot/PDF
 */
export interface ExtractedInDriverRide {
  // Identification
  id: string;
  sourceImagePath: string;
  extractionConfidence: number;

  // Ride Details
  date: Date;
  time: string;
  destinationAddress: string;
  duration: Duration;
  distance: Distance;

  // Passenger Info
  passengerName: string;
  ratingGiven?: number;

  // Status
  status: RideStatus;
  cancellationReason?: string;

  // Payment
  paymentMethod: PaymentMethod;
  paymentMethodLabel: string;

  // Financial - Income (Recibí)
  tarifa: number;
  totalRecibido: number;

  // Financial - Deductions (Pagué)
  comisionServicio: number;
  comisionPorcentaje: number;
  ivaPagoServicio: number;
  totalPagado: number;

  // Financial - Net
  misIngresos: number;

  // Metadata
  extractedAt: Date;
  rawOcrText?: string;
  fieldConfidences: FieldConfidences;
}

// ============================================================================
// Zod Validation Schemas
// ============================================================================

export const DurationSchema = z.object({
  value: z.number().positive(),
  unit: z.enum(['min', 'hr']),
});

export const DistanceSchema = z.object({
  value: z.number().positive(),
  unit: z.enum(['km', 'metro']),
});

export const FieldConfidencesSchema = z.record(z.string(), z.number().min(0).max(1));

export const ExtractedInDriverRideSchema = z.object({
  // Identification
  id: z.string().uuid(),
  sourceImagePath: z.string(),
  extractionConfidence: z.number().min(0).max(1),

  // Ride Details
  date: z.date(),
  time: z.string().regex(/^\d{1,2}:\d{2}$/),
  destinationAddress: z.string().min(1),
  duration: DurationSchema,
  distance: DistanceSchema,

  // Passenger Info
  passengerName: z.string().min(1),
  ratingGiven: z.number().int().min(1).max(5).optional(),

  // Status
  status: z.enum(['completed', 'cancelled_by_passenger', 'cancelled_by_driver']),
  cancellationReason: z.string().optional(),

  // Payment
  paymentMethod: z.enum(['cash', 'nequi', 'other']),
  paymentMethodLabel: z.string(),

  // Financial - Income
  tarifa: z.number().nonnegative(),
  totalRecibido: z.number().nonnegative(),

  // Financial - Deductions
  comisionServicio: z.number().nonnegative(),
  comisionPorcentaje: z.number().min(0).max(100),
  ivaPagoServicio: z.number().nonnegative(),
  totalPagado: z.number().nonnegative(),

  // Financial - Net
  misIngresos: z.number(),

  // Metadata
  extractedAt: z.date(),
  rawOcrText: z.string().optional(),
  fieldConfidences: FieldConfidencesSchema,
});

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Response from OCR extraction endpoint
 */
export interface ExtractResponse {
  success: boolean;
  results: ExtractedInDriverRide[];
  errors: Array<{
    fileName: string;
    error: string;
  }>;
  summary: {
    totalFiles: number;
    successfulExtractions: number;
    failedExtractions: number;
    averageConfidence: number;
  };
}

/**
 * Request to import extracted rides into database
 */
export interface ImportRequest {
  rides: ExtractedInDriverRide[];
  driverId: string;
}

/**
 * Response from import endpoint
 */
export interface ImportResponse {
  success: boolean;
  imported: Array<{
    rideId: string;
    externalId: string;
  }>;
  skipped: Array<{
    index: number;
    reason: string;
  }>;
}

/**
 * Request to export extracted rides
 */
export interface ExportRequest {
  rides: ExtractedInDriverRide[];
  format: 'csv' | 'json' | 'xlsx';
}

// ============================================================================
// Parsing Constants
// ============================================================================

/**
 * Spanish day abbreviations to English day names
 */
export const SPANISH_DAYS: Record<string, string> = {
  lun: 'Monday',
  mar: 'Tuesday',
  mié: 'Wednesday',
  jue: 'Thursday',
  vie: 'Friday',
  sáb: 'Saturday',
  dom: 'Sunday',
};

/**
 * Spanish month abbreviations to month numbers (0-indexed)
 */
export const SPANISH_MONTHS: Record<string, number> = {
  ene: 0,
  feb: 1,
  mar: 2,
  abr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dic: 11,
};

/**
 * Regex patterns for extracting data from OCR text
 */
export const OCR_PATTERNS = {
  // Date: "mar, 2 dic 2025"
  date: /^(lun|mar|mié|jue|vie|sáb|dom),?\s*(\d{1,2})\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\s+(\d{4})$/i,

  // Time: "07:52 a.m." or "04:01 p.m."
  time: /(\d{1,2}):(\d{2})\s*(a\.?m\.?|p\.?m\.?)/i,

  // Duration: "20 min." or "1 hr."
  duration: /Duración\s*(\d+)\s*(min|hr)\.?/i,

  // Distance: "6,4 km" or "715 metro"
  distance: /Distancia\s*([\d,\.]+)\s*(km|metro)/i,

  // Currency: "COP 15,000.00" or "COP 1,425.00"
  currency: /COP\s*([\d,\.]+)/g,

  // Percentage: "9.5%" or "9,5%"
  percentage: /([\d,\.]+)\s*%/,

  // Status: "El pasajero canceló"
  cancelledByPassenger: /pasajero\s+canceló/i,

  // Payment methods
  paymentCash: /pago\s+en\s+efectivo/i,
  paymentNequi: /nequi/i,

  // Key labels for parsing financial section
  tarifa: /tarifa/i,
  totalRecibido: /total\s+recibido/i,
  misIngresos: /mis\s+ingresos/i,
  comision: /pagos\s+por\s+el\s+servicio/i,
  iva: /iva\s+del\s+pago/i,
  totalPagado: /total\s+pagado/i,
} as const;

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates financial consistency of extracted ride data
 */
export function validateFinancialConsistency(ride: ExtractedInDriverRide): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const tolerance = 1; // Allow 1 COP rounding difference

  // Check net income calculation
  const expectedNetIncome = ride.totalRecibido - ride.totalPagado;
  if (Math.abs(ride.misIngresos - expectedNetIncome) > tolerance) {
    errors.push(
      `Net income mismatch: expected ${expectedNetIncome}, got ${ride.misIngresos}`
    );
  }

  // Check commission calculation
  const expectedCommission = ride.tarifa * (ride.comisionPorcentaje / 100);
  if (Math.abs(ride.comisionServicio - expectedCommission) > tolerance) {
    errors.push(
      `Commission mismatch: expected ${expectedCommission}, got ${ride.comisionServicio}`
    );
  }

  // Check IVA calculation (19% of commission)
  const expectedIva = ride.comisionServicio * 0.19;
  if (Math.abs(ride.ivaPagoServicio - expectedIva) > tolerance) {
    errors.push(
      `IVA mismatch: expected ${expectedIva}, got ${ride.ivaPagoServicio}`
    );
  }

  // Check total paid consistency
  const expectedTotalPaid = ride.comisionServicio + ride.ivaPagoServicio;
  if (Math.abs(ride.totalPagado - expectedTotalPaid) > tolerance) {
    errors.push(
      `Total paid mismatch: expected ${expectedTotalPaid}, got ${ride.totalPagado}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculates overall extraction confidence from field confidences
 */
export function calculateOverallConfidence(
  fieldConfidences: FieldConfidences
): number {
  const values = Object.values(fieldConfidences);
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}
