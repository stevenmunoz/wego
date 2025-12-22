/**
 * External Ride Validation Schema
 *
 * Zod schemas for validating external ride form data
 */

import { z } from 'zod';

// ============================================================================
// FIELD SCHEMAS
// ============================================================================

export const requestSourceSchema = z.enum(['whatsapp', 'phone', 'referral', 'other']);
export const tripReasonSchema = z.enum(['personal', 'work', 'emergency', 'other']);
export const timeOfDaySchema = z.enum(['morning', 'afternoon', 'evening', 'night']);
export const paymentMethodSchema = z.enum(['cash', 'nequi', 'daviplata', 'bancolombia', 'other']);

// ============================================================================
// FORM INPUT SCHEMA
// ============================================================================

export const externalRideInputSchema = z.object({
  // Date and time
  date: z
    .string()
    .min(1, 'La fecha es requerida')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha invalido'),
  time: z
    .string()
    .min(1, 'La hora es requerida')
    .regex(/^\d{2}:\d{2}$/, 'Formato de hora invalido'),

  // Addresses
  origin_address: z
    .string()
    .min(3, 'El origen debe tener al menos 3 caracteres')
    .max(500, 'El origen no puede exceder 500 caracteres'),
  destination_address: z
    .string()
    .min(3, 'El destino debe tener al menos 3 caracteres')
    .max(500, 'El destino no puede exceder 500 caracteres'),

  // Financial
  total_received: z
    .number()
    .min(1000, 'El valor minimo es $1.000 COP')
    .max(10000000, 'El valor maximo es $10.000.000 COP'),

  // Payment and request info
  payment_method: paymentMethodSchema,
  request_source: requestSourceSchema,
  trip_reason: tripReasonSchema,
  time_of_day: timeOfDaySchema,

  // Flags
  is_recurring: z.boolean(),
  tip_received: z.boolean(),

  // Optional fields
  tip_amount: z
    .number()
    .min(0, 'La propina no puede ser negativa')
    .max(1000000, 'La propina maxima es $1.000.000 COP')
    .optional(),
  comments: z.string().max(1000, 'Los comentarios no pueden exceder 1000 caracteres').optional(),
});

// ============================================================================
// PARTIAL SCHEMA FOR STEP-BY-STEP VALIDATION
// ============================================================================

export const stepSchemas = {
  datetime: z.object({
    date: externalRideInputSchema.shape.date,
    time: externalRideInputSchema.shape.time,
  }),
  origin: z.object({
    origin_address: externalRideInputSchema.shape.origin_address,
  }),
  destination: z.object({
    destination_address: externalRideInputSchema.shape.destination_address,
  }),
  fare: z.object({
    total_received: externalRideInputSchema.shape.total_received,
  }),
  request_source: z.object({
    request_source: externalRideInputSchema.shape.request_source,
  }),
  trip_reason: z.object({
    trip_reason: externalRideInputSchema.shape.trip_reason,
  }),
  time_of_day: z.object({
    time_of_day: externalRideInputSchema.shape.time_of_day,
  }),
  is_recurring: z.object({
    is_recurring: externalRideInputSchema.shape.is_recurring,
  }),
  payment_method: z.object({
    payment_method: externalRideInputSchema.shape.payment_method,
  }),
  tip: z
    .object({
      tip_received: externalRideInputSchema.shape.tip_received,
      tip_amount: externalRideInputSchema.shape.tip_amount,
    })
    .refine(
      (data) => {
        // If tip received, tip amount should be provided and > 0
        if (data.tip_received && (!data.tip_amount || data.tip_amount <= 0)) {
          return false;
        }
        return true;
      },
      {
        message: 'Si recibiste propina, ingresa el monto',
        path: ['tip_amount'],
      }
    ),
  comments: z.object({
    comments: externalRideInputSchema.shape.comments,
  }),
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ExternalRideInputSchema = z.infer<typeof externalRideInputSchema>;
export type RequestSource = z.infer<typeof requestSourceSchema>;
export type TripReason = z.infer<typeof tripReasonSchema>;
export type TimeOfDay = z.infer<typeof timeOfDaySchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
