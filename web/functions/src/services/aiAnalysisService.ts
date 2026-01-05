/**
 * AI Analysis Service using OpenAI GPT-4o
 *
 * Extracts structured ride data from OCR text using GPT-4o's
 * JSON structured output capability.
 */

import OpenAI from 'openai';
import * as functions from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';
import type {
  ExtractedInDriverRide,
  GPTExtractionResult,
  FieldConfidences,
  RideStatus,
  PaymentMethod,
} from '../types/indriver.types';

// Define the secret for OpenAI API key
export const openaiApiKey = defineSecret('OPENAI_API_KEY');

/**
 * System prompt for GPT-4o to extract InDriver ride data
 */
const EXTRACTION_SYSTEM_PROMPT = `You are a data extraction assistant specialized in parsing InDriver ride receipts from Colombia.

Your task is to extract structured data from OCR text of InDriver screenshots. The text is in Spanish.

IMPORTANT CONTEXT:
- Currency format: Colombian Pesos (COP) use dots as thousands separators and commas as decimal separators
  Example: "18.000,00 COP" = 18000.00 COP
- Date format: Spanish abbreviations like "lun, 2 dic 2025" or "mar, 3 dic 2025"
- Time format: 12-hour with "a.m." or "p.m."
- Commission rate is typically 9.5%

FIELDS TO EXTRACT:
1. date: Format as "YYYY-MM-DD" if found
2. time: Format as "HH:MM" in 24-hour format if found
3. destination_address: The destination shown (usually near top of receipt)
4. duration_value/duration_unit: Ride duration (e.g., "20 min" -> value=20, unit="min")
5. distance_value/distance_unit: Ride distance (e.g., "6,4 km" -> value=6.4, unit="km")
6. passenger_name: The passenger's name (usually a capitalized name)
7. rating_given: Number of stars given (1-5) if visible
8. is_cancelled: true if the ride was cancelled
9. cancelled_by_passenger: true if cancelled by passenger
10. payment_method: "cash" for "Pago en efectivo", "nequi" for Nequi, "other" otherwise
11. Financial fields (all as numbers without thousands separators):
    - tarifa: Base fare
    - total_recibido: Total received from passenger
    - comision_servicio: Service commission
    - comision_porcentaje: Commission percentage (usually 9.5)
    - iva_pago_servicio: IVA (tax) on service payment
    - total_pagado: Total paid (commission + IVA)
    - mis_ingresos: Net earnings (what driver keeps)

12. extraction_confidence: Your confidence in the extraction accuracy (0.0-1.0)

IMPORTANT:
- Return null for any field you cannot reliably extract
- For financial values, convert from Colombian format (18.000,00) to plain numbers (18000.00)
- If text is unclear or OCR has errors, make reasonable inferences but lower the confidence
- Look for key Spanish labels like "Tarifa", "Total recibido", "Mis ingresos", "Pagos por el servicio"`;

/**
 * JSON schema for structured output
 * Note: With strict: true, ALL properties must be in the required array
 */
const EXTRACTION_SCHEMA = {
  type: 'object' as const,
  properties: {
    date: { type: ['string', 'null'], description: 'Date in YYYY-MM-DD format' },
    time: { type: ['string', 'null'], description: 'Time in HH:MM 24-hour format' },
    destination_address: { type: ['string', 'null'] },
    duration_value: { type: ['number', 'null'] },
    duration_unit: { type: ['string', 'null'], enum: ['min', 'hr', null] },
    distance_value: { type: ['number', 'null'] },
    distance_unit: { type: ['string', 'null'], enum: ['km', 'metro', null] },
    passenger_name: { type: ['string', 'null'] },
    rating_given: { type: ['number', 'null'] },
    is_cancelled: { type: 'boolean' },
    cancelled_by_passenger: { type: 'boolean' },
    cancellation_reason: { type: ['string', 'null'] },
    payment_method: { type: 'string', enum: ['cash', 'nequi', 'other'] },
    tarifa: { type: ['number', 'null'] },
    total_recibido: { type: ['number', 'null'] },
    comision_servicio: { type: ['number', 'null'] },
    comision_porcentaje: { type: ['number', 'null'] },
    iva_pago_servicio: { type: ['number', 'null'] },
    total_pagado: { type: ['number', 'null'] },
    mis_ingresos: { type: ['number', 'null'] },
    extraction_confidence: { type: 'number' },
  },
  required: [
    'date',
    'time',
    'destination_address',
    'duration_value',
    'duration_unit',
    'distance_value',
    'distance_unit',
    'passenger_name',
    'rating_given',
    'is_cancelled',
    'cancelled_by_passenger',
    'cancellation_reason',
    'payment_method',
    'tarifa',
    'total_recibido',
    'comision_servicio',
    'comision_porcentaje',
    'iva_pago_servicio',
    'total_pagado',
    'mis_ingresos',
    'extraction_confidence',
  ],
  additionalProperties: false,
};

/**
 * Extract structured ride data from OCR text using GPT-4o
 *
 * @param ocrText - Raw text from OCR
 * @param sourceImagePath - Path to the source image for reference
 * @returns Structured ride data
 */
export async function extractRideData(
  ocrText: string,
  sourceImagePath: string
): Promise<ExtractedInDriverRide> {
  const apiKey = openaiApiKey.value();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY secret is not configured');
  }

  const openai = new OpenAI({ apiKey });

  functions.logger.info(`[AIAnalysis] Starting extraction for ${sourceImagePath}`);
  functions.logger.debug(`[AIAnalysis] OCR text length: ${ocrText.length} chars`);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Extract the ride data from this InDriver receipt OCR text:\n\n${ocrText}`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'indriver_extraction',
          strict: true,
          schema: EXTRACTION_SCHEMA,
        },
      },
      temperature: 0.1, // Low temperature for consistent extraction
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from GPT-4o');
    }

    const gptResult: GPTExtractionResult = JSON.parse(content);
    functions.logger.info(
      `[AIAnalysis] Extraction complete with confidence: ${gptResult.extraction_confidence}`
    );

    // Transform GPT response to ExtractedInDriverRide format
    return transformToExtractedRide(gptResult, ocrText, sourceImagePath);
  } catch (error) {
    functions.logger.error(`[AIAnalysis] Extraction failed:`, error);
    throw new Error(`AI extraction failed: ${(error as Error).message}`);
  }
}

/**
 * Transform GPT response to ExtractedInDriverRide format
 */
function transformToExtractedRide(
  gpt: GPTExtractionResult,
  ocrText: string,
  sourceImagePath: string
): ExtractedInDriverRide {
  const now = new Date().toISOString();
  const id = `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Build field confidences based on what was extracted
  const confidences: FieldConfidences = {
    date: gpt.date ? 0.9 : 0,
    time: gpt.time ? 0.9 : 0,
    destination_address: gpt.destination_address ? 0.8 : 0,
    duration: gpt.duration_value ? 0.9 : 0,
    distance: gpt.distance_value ? 0.9 : 0,
    passenger_name: gpt.passenger_name ? 0.8 : 0,
    payment_method: 0.95,
    tarifa: gpt.tarifa ? 0.9 : 0,
    total_recibido: gpt.total_recibido ? 0.9 : 0,
    comision_servicio: gpt.comision_servicio ? 0.9 : 0,
    iva_pago_servicio: gpt.iva_pago_servicio ? 0.9 : 0,
    total_pagado: gpt.total_pagado ? 0.9 : 0,
    mis_ingresos: gpt.mis_ingresos ? 0.9 : 0,
  };

  // Determine ride status
  let status: RideStatus = 'completed';
  if (gpt.is_cancelled) {
    status = gpt.cancelled_by_passenger ? 'cancelled_by_passenger' : 'cancelled_by_driver';
  }

  // Build payment method label
  const paymentLabels: Record<PaymentMethod, string> = {
    cash: 'Pago en efectivo',
    nequi: 'Nequi',
    other: 'Otro',
  };

  return {
    id,
    source_image_path: sourceImagePath,
    extraction_confidence: gpt.extraction_confidence,

    // Ride Details
    date: gpt.date,
    time: gpt.time || '00:00',
    destination_address: gpt.destination_address || '',
    duration:
      gpt.duration_value && gpt.duration_unit
        ? { value: gpt.duration_value, unit: gpt.duration_unit }
        : null,
    distance:
      gpt.distance_value && gpt.distance_unit
        ? { value: gpt.distance_value, unit: gpt.distance_unit }
        : null,

    // Passenger Info
    passenger_name: gpt.passenger_name || '',
    rating_given: gpt.rating_given,

    // Status
    status,
    cancellation_reason: gpt.cancellation_reason,

    // Payment
    payment_method: gpt.payment_method,
    payment_method_label: paymentLabels[gpt.payment_method],

    // Financial - Income
    tarifa: gpt.tarifa || 0,
    total_recibido: gpt.total_recibido || 0,

    // Financial - Deductions
    comision_servicio: gpt.comision_servicio || 0,
    comision_porcentaje: gpt.comision_porcentaje || 9.5,
    iva_pago_servicio: gpt.iva_pago_servicio || 0,
    total_pagado: gpt.total_pagado || 0,

    // Financial - Net
    mis_ingresos: gpt.mis_ingresos || 0,

    // Metadata
    extracted_at: now,
    raw_ocr_text: ocrText,
    field_confidences: confidences,
  };
}

/**
 * Extract multiple rides from multi-page PDF OCR text
 * Splits text by PAGE_BREAK markers and processes each page
 *
 * @param ocrText - OCR text with PAGE_BREAK markers between pages
 * @param sourceImagePath - Base path of the source document
 * @returns Array of extracted rides
 */
export async function extractMultipleRides(
  ocrText: string,
  sourceImagePath: string
): Promise<ExtractedInDriverRide[]> {
  // Split by page break markers
  const pages = ocrText.split(/---PAGE_BREAK---/).filter((page) => page.trim().length > 50);

  functions.logger.info(`[AIAnalysis] Processing ${pages.length} pages from ${sourceImagePath}`);

  const rides: ExtractedInDriverRide[] = [];

  for (let i = 0; i < pages.length; i++) {
    const pageText = pages[i].trim();
    const pageSource = `${sourceImagePath} (page ${i + 1})`;

    try {
      functions.logger.info(`[AIAnalysis] Processing page ${i + 1}/${pages.length}`);
      const ride = await extractRideData(pageText, pageSource);

      // Validate that we got meaningful data
      const hasFinancial = ride.mis_ingresos > 0 || ride.tarifa > 0 || ride.total_recibido > 0;
      const hasIdentity = !!ride.passenger_name || !!ride.date;
      const isCancelled = ride.status !== 'completed';

      if (hasFinancial || hasIdentity || isCancelled) {
        rides.push(ride);
        functions.logger.info(
          `[AIAnalysis] Page ${i + 1}: Extracted ride with ${ride.mis_ingresos} COP earnings`
        );
      } else {
        functions.logger.warn(`[AIAnalysis] Page ${i + 1}: No meaningful data extracted, skipping`);
      }
    } catch (error) {
      functions.logger.error(`[AIAnalysis] Page ${i + 1} extraction failed:`, error);
      // Continue with other pages
    }
  }

  functions.logger.info(
    `[AIAnalysis] Total rides extracted: ${rides.length} from ${pages.length} pages`
  );
  return rides;
}
