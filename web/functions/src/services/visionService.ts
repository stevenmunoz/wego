/**
 * Google Cloud Vision API Service
 *
 * Provides OCR text extraction from images and PDFs stored in Firebase Storage.
 * Uses DOCUMENT_TEXT_DETECTION for better accuracy on screenshots.
 * For PDFs, uses async batch annotation which properly handles multi-page documents.
 */

import vision from '@google-cloud/vision';
import { Storage } from '@google-cloud/storage';
import * as functions from 'firebase-functions';

// Initialize Vision client (uses default service account credentials)
const visionClient = new vision.ImageAnnotatorClient();
const storage = new Storage();

/**
 * Extract text from an image stored in Firebase Storage
 *
 * @param bucketName - Firebase Storage bucket name
 * @param filePath - Path to the file within the bucket
 * @returns Extracted text from the image
 */
export async function extractTextFromImage(bucketName: string, filePath: string): Promise<string> {
  const gcsUri = `gs://${bucketName}/${filePath}`;
  functions.logger.info(`[VisionService] Starting OCR for: ${gcsUri}`);

  try {
    // Use DOCUMENT_TEXT_DETECTION for better text extraction from documents/screenshots
    const [result] = await visionClient.documentTextDetection({
      image: {
        source: {
          imageUri: gcsUri,
        },
      },
      imageContext: {
        languageHints: ['es'], // Spanish language hint for better accuracy
      },
    });

    const fullTextAnnotation = result.fullTextAnnotation;

    if (!fullTextAnnotation || !fullTextAnnotation.text) {
      functions.logger.warn(`[VisionService] No text found in image: ${gcsUri}`);
      return '';
    }

    const extractedText = fullTextAnnotation.text;
    functions.logger.info(
      `[VisionService] Successfully extracted ${extractedText.length} characters from ${gcsUri}`
    );

    return extractedText;
  } catch (error) {
    functions.logger.error(`[VisionService] OCR failed for ${gcsUri}:`, error);
    throw new Error(`Vision API failed: ${(error as Error).message}`);
  }
}

/**
 * Check if a file type is supported for OCR
 *
 * @param contentType - MIME type of the file
 * @returns true if the file type is supported
 */
export function isSupportedImageType(contentType: string | undefined): boolean {
  if (!contentType) return false;

  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/tiff',
    'image/gif',
    'image/bmp',
    'image/webp',
  ];

  return supportedTypes.includes(contentType.toLowerCase());
}

/**
 * Check if a file is a PDF
 *
 * @param contentType - MIME type of the file
 * @returns true if the file is a PDF
 */
export function isPdfType(contentType: string | undefined): boolean {
  return contentType?.toLowerCase() === 'application/pdf';
}

/**
 * Extract text from a PDF stored in Firebase Storage
 * Uses Vision API's async batch annotation for proper PDF handling.
 *
 * The async API works by:
 * 1. Sending the PDF for processing
 * 2. Vision API writes JSON results to a GCS output bucket
 * 3. We read the JSON results and extract the text
 *
 * @param bucketName - Firebase Storage bucket name
 * @param filePath - Path to the PDF file within the bucket
 * @returns Extracted text from all pages of the PDF
 */
export async function extractTextFromPdf(bucketName: string, filePath: string): Promise<string> {
  const gcsSourceUri = `gs://${bucketName}/${filePath}`;

  // Create a unique output prefix for this extraction
  const timestamp = Date.now();
  const outputPrefix = `vision-output/${timestamp}_${filePath.replace(/\//g, '_').replace('.pdf', '')}`;
  const gcsDestinationUri = `gs://${bucketName}/${outputPrefix}/`;

  functions.logger.info(`[VisionService] Starting async PDF OCR for: ${gcsSourceUri}`);
  functions.logger.info(`[VisionService] Output destination: ${gcsDestinationUri}`);

  try {
    // Configure the async request for PDF processing
    const inputConfig = {
      mimeType: 'application/pdf',
      gcsSource: {
        uri: gcsSourceUri,
      },
    };

    const outputConfig = {
      gcsDestination: {
        uri: gcsDestinationUri,
      },
      batchSize: 100, // Process all pages in one batch
    };

    const features = [{ type: 'DOCUMENT_TEXT_DETECTION' as const }];

    const imageContext = {
      languageHints: ['es'], // Spanish language hint
    };

    const request = {
      requests: [
        {
          inputConfig,
          features,
          outputConfig,
          imageContext,
        },
      ],
    };

    // Start async operation
    functions.logger.info(`[VisionService] Starting async batch annotation...`);
    const [operation] = await visionClient.asyncBatchAnnotateFiles(request);

    // Wait for the operation to complete
    functions.logger.info(`[VisionService] Waiting for operation to complete...`);
    await operation.promise();
    functions.logger.info(`[VisionService] Async operation completed`);

    // Read the output JSON files from GCS
    const bucket = storage.bucket(bucketName);
    const [files] = await bucket.getFiles({ prefix: outputPrefix });

    if (files.length === 0) {
      functions.logger.warn(`[VisionService] No output files found at ${gcsDestinationUri}`);
      return '';
    }

    // Collect text from all output JSON files
    let allText = '';

    for (const file of files) {
      if (!file.name.endsWith('.json')) continue;

      functions.logger.info(`[VisionService] Reading output file: ${file.name}`);
      const [content] = await file.download();
      const jsonResponse = JSON.parse(content.toString('utf-8'));

      // Extract text from each page's annotation
      if (jsonResponse.responses) {
        for (const response of jsonResponse.responses) {
          if (response.fullTextAnnotation && response.fullTextAnnotation.text) {
            allText += response.fullTextAnnotation.text + '\n---PAGE_BREAK---\n';
          }
        }
      }
    }

    // Clean up output files
    functions.logger.info(`[VisionService] Cleaning up ${files.length} output files...`);
    for (const file of files) {
      await file.delete().catch((err) => {
        functions.logger.warn(`[VisionService] Failed to delete ${file.name}:`, err);
      });
    }

    if (!allText.trim()) {
      functions.logger.warn(`[VisionService] No text extracted from PDF: ${gcsSourceUri}`);
      return '';
    }

    functions.logger.info(
      `[VisionService] Successfully extracted ${allText.length} characters from PDF ${gcsSourceUri}`
    );

    return allText.trim();
  } catch (error) {
    functions.logger.error(`[VisionService] PDF OCR failed for ${gcsSourceUri}:`, error);
    throw new Error(`Vision API PDF processing failed: ${(error as Error).message}`);
  }
}
