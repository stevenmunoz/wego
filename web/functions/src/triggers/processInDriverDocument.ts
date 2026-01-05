/**
 * Cloud Function trigger for InDriver document processing
 *
 * Triggers when a file is uploaded to indriver-documents/{userId}/
 * Extracts text using Google Cloud Vision API and analyzes with GPT-4o.
 */

import { onObjectFinalized } from 'firebase-functions/v2/storage';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { FieldValue } from 'firebase-admin/firestore';
import type { ExtractionStatus, InDriverExtractionJob } from '../types/indriver.types';
import {
  extractTextFromImage,
  extractTextFromPdf,
  isSupportedImageType,
  isPdfType,
} from '../services/visionService';
import { extractRideData, extractMultipleRides, openaiApiKey } from '../services/aiAnalysisService';

const db = admin.firestore();

/**
 * Update extraction job status in Firestore
 */
async function updateJobStatus(
  userId: string,
  jobId: string,
  status: ExtractionStatus,
  progressMessage: string,
  additionalData?: Partial<InDriverExtractionJob>
): Promise<void> {
  const docRef = db.collection('users').doc(userId).collection('indriver_extractions').doc(jobId);

  await docRef.update({
    status,
    progress_message: progressMessage,
    updated_at: FieldValue.serverTimestamp(),
    ...additionalData,
  });

  functions.logger.info(`[ProcessInDriver] Job ${jobId} status: ${status} - ${progressMessage}`);
}

/**
 * Create initial extraction job document
 */
async function createJobDocument(
  userId: string,
  storagePath: string,
  fileName: string,
  fileType: string
): Promise<string> {
  const docRef = db.collection('users').doc(userId).collection('indriver_extractions').doc();

  const job: Omit<InDriverExtractionJob, 'created_at' | 'updated_at'> & {
    created_at: FirebaseFirestore.FieldValue;
    updated_at: FirebaseFirestore.FieldValue;
  } = {
    id: docRef.id,
    user_id: userId,
    storage_path: storagePath,
    file_name: fileName,
    file_type: fileType,
    status: 'pending',
    progress_message: 'Documento recibido, iniciando procesamiento...',
    result: null,
    error: null,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  };

  await docRef.set(job);
  functions.logger.info(`[ProcessInDriver] Created job ${docRef.id} for ${storagePath}`);

  return docRef.id;
}

/**
 * Storage-triggered Cloud Function for InDriver document processing
 *
 * Triggers on uploads to: indriver-documents/{userId}/**
 *
 * Processing flow:
 * 1. Validate file type
 * 2. Create Firestore job document for tracking
 * 3. Extract text using Cloud Vision API
 * 4. Analyze with GPT-4o for structured data
 * 5. Save results to Firestore
 */
export const processInDriverDocument = onObjectFinalized(
  {
    bucket: undefined, // Uses default bucket
    region: 'us-central1',
    memory: '1GiB',
    timeoutSeconds: 540, // 9 minutes for large files
    secrets: [openaiApiKey],
  },
  async (event) => {
    const filePath = event.data.name;
    const contentType = event.data.contentType;
    const bucket = event.data.bucket;

    // Only process files in indriver-documents path
    if (!filePath || !filePath.startsWith('indriver-documents/')) {
      functions.logger.debug(`[ProcessInDriver] Ignoring non-indriver file: ${filePath}`);
      return;
    }

    // Extract userId from path: indriver-documents/{userId}/{filename}
    const pathParts = filePath.split('/');
    if (pathParts.length < 3) {
      functions.logger.warn(`[ProcessInDriver] Invalid path structure: ${filePath}`);
      return;
    }

    const userId = pathParts[1];
    const fileName = pathParts[pathParts.length - 1];

    functions.logger.info(`[ProcessInDriver] Processing file: ${filePath}`);
    functions.logger.info(
      `[ProcessInDriver] User: ${userId}, File: ${fileName}, Type: ${contentType}`
    );

    // Validate file type
    const isImage = isSupportedImageType(contentType);
    const isPdf = isPdfType(contentType);

    if (!isImage && !isPdf) {
      functions.logger.warn(`[ProcessInDriver] Unsupported file type: ${contentType}`);
      return;
    }

    let jobId: string | undefined;

    try {
      // Create job document for tracking
      jobId = await createJobDocument(userId, filePath, fileName, contentType || 'unknown');

      // Update status: extracting text
      await updateJobStatus(userId, jobId, 'extracting_text', 'Extrayendo texto del documento...');

      // Extract text based on file type
      let ocrText: string;
      if (isPdf) {
        ocrText = await extractTextFromPdf(bucket, filePath);
      } else {
        ocrText = await extractTextFromImage(bucket, filePath);
      }

      if (!ocrText || ocrText.trim().length < 50) {
        throw new Error('No se pudo extraer texto suficiente del documento');
      }

      functions.logger.info(`[ProcessInDriver] Extracted ${ocrText.length} characters`);

      // Update status: analyzing with AI
      await updateJobStatus(userId, jobId, 'analyzing', 'Analizando datos del viaje con IA...');

      // Check if this is a multi-page PDF
      const hasPageBreaks = ocrText.includes('---PAGE_BREAK---');

      if (isPdf && hasPageBreaks) {
        // Multi-page PDF: Extract multiple rides
        const extractedRides = await extractMultipleRides(ocrText, filePath);

        if (extractedRides.length === 0) {
          throw new Error('No se pudieron extraer viajes del documento PDF');
        }

        // For multi-page PDFs, store the first ride in the main job
        // and create additional jobs for the rest
        const [firstRide, ...additionalRides] = extractedRides;

        // Update main job with first ride
        await updateJobStatus(
          userId,
          jobId,
          'completed',
          `Extracción completada: ${extractedRides.length} viaje(s)`,
          {
            result: firstRide,
          }
        );

        // Create additional job documents for remaining rides
        for (let i = 0; i < additionalRides.length; i++) {
          const ride = additionalRides[i];
          const additionalJobId = await createJobDocument(
            userId,
            `${filePath} (page ${i + 2})`,
            `${fileName} (page ${i + 2})`,
            contentType || 'unknown'
          );

          await updateJobStatus(userId, additionalJobId, 'completed', 'Extracción completada', {
            result: ride,
          });
        }

        functions.logger.info(
          `[ProcessInDriver] Successfully processed ${filePath}: ${extractedRides.length} rides extracted`
        );
      } else {
        // Single image or single-page PDF: Extract one ride
        const extractedRide = await extractRideData(ocrText, filePath);

        // Update status: completed with results
        await updateJobStatus(userId, jobId, 'completed', 'Extracción completada exitosamente', {
          result: extractedRide,
        });

        functions.logger.info(
          `[ProcessInDriver] Successfully processed ${filePath} with confidence ${extractedRide.extraction_confidence}`
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      functions.logger.error(`[ProcessInDriver] Error processing ${filePath}:`, error);

      // Update job with error status if we have a jobId
      if (jobId) {
        await updateJobStatus(userId, jobId, 'failed', `Error: ${errorMessage}`, {
          error: errorMessage,
        });
      }
    }
  }
);
