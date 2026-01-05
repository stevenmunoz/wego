/**
 * InDriver Import API Service (Serverless)
 *
 * Uploads documents to Firebase Storage which triggers Cloud Functions
 * for OCR extraction. Results are stored in Firestore and can be
 * subscribed to in real-time.
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { storage, db } from '@/core/firebase';
import type { ExtractedInDriverRide, ExportFormat } from '../types';

/**
 * Extraction job status from Cloud Functions
 */
export type ExtractionStatus = 'pending' | 'extracting_text' | 'analyzing' | 'completed' | 'failed';

/**
 * Extraction job document stored in Firestore
 */
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
  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * Upload progress callback
 */
export type UploadProgressCallback = (progress: number, fileName: string) => void;

/**
 * Extraction update callback
 */
export type ExtractionUpdateCallback = (jobs: InDriverExtractionJob[]) => void;

export const indriverApi = {
  /**
   * Upload files for extraction (triggers Cloud Function)
   *
   * @param userId - The authenticated user's ID
   * @param files - Files to upload (images or PDFs)
   * @param onProgress - Optional callback for upload progress
   * @returns Array of storage paths for uploaded files
   */
  uploadForExtraction: async (
    userId: string,
    files: File[],
    onProgress?: UploadProgressCallback
  ): Promise<string[]> => {
    const uploadedPaths: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `indriver-documents/${userId}/${timestamp}_${safeName}`;

      const storageRef = ref(storage, storagePath);

      // Report progress
      if (onProgress) {
        onProgress(((i + 1) / files.length) * 100, file.name);
      }

      // Upload file
      await uploadBytes(storageRef, file, {
        contentType: file.type,
      });

      uploadedPaths.push(storagePath);
    }

    return uploadedPaths;
  },

  /**
   * Subscribe to extraction jobs for real-time updates
   *
   * @param userId - The authenticated user's ID
   * @param onUpdate - Callback called when jobs change
   * @returns Unsubscribe function
   */
  subscribeToExtractions: (userId: string, onUpdate: ExtractionUpdateCallback): Unsubscribe => {
    const extractionsRef = collection(db, 'users', userId, 'indriver_extractions');
    const q = query(extractionsRef, orderBy('created_at', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const jobs: InDriverExtractionJob[] = [];

      snapshot.forEach((doc) => {
        jobs.push({
          id: doc.id,
          ...doc.data(),
        } as InDriverExtractionJob);
      });

      onUpdate(jobs);
    });
  },

  /**
   * Get download URL for a storage path
   *
   * @param storagePath - Path in Firebase Storage
   * @returns Download URL
   */
  getDownloadUrl: async (storagePath: string): Promise<string> => {
    const storageRef = ref(storage, storagePath);
    return getDownloadURL(storageRef);
  },

  /**
   * Export rides to CSV format (client-side)
   *
   * @param rides - Array of extracted rides
   * @returns CSV string
   */
  exportToCSV: (rides: ExtractedInDriverRide[]): string => {
    const headers = [
      'Fecha',
      'Hora',
      'Pasajero',
      'Destino',
      'Tarifa',
      'Total Recibido',
      'Comisión',
      'IVA',
      'Mis Ingresos',
      'Método de Pago',
      'Estado',
      'Calificación',
    ];

    const rows = rides.map((ride) => [
      ride.date || '',
      ride.time || '',
      ride.passenger_name || '',
      ride.destination_address || '',
      ride.tarifa?.toString() || '0',
      ride.total_recibido?.toString() || '0',
      ride.comision_servicio?.toString() || '0',
      ride.iva_pago_servicio?.toString() || '0',
      ride.mis_ingresos?.toString() || '0',
      ride.payment_method_label || ride.payment_method || '',
      ride.status || '',
      ride.rating_given?.toString() || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    return csvContent;
  },

  /**
   * Export rides to JSON format (client-side)
   *
   * @param rides - Array of extracted rides
   * @returns JSON string
   */
  exportToJSON: (rides: ExtractedInDriverRide[]): string => {
    return JSON.stringify(rides, null, 2);
  },
};

/**
 * Download exported data as file
 */
export const downloadExport = (rides: ExtractedInDriverRide[], format: ExportFormat): void => {
  let content: string;
  let mimeType: string;
  let extension: string;

  if (format === 'json') {
    content = indriverApi.exportToJSON(rides);
    mimeType = 'application/json';
    extension = 'json';
  } else {
    // CSV for both 'csv' and 'xlsx' (xlsx not supported client-side)
    content = indriverApi.exportToCSV(rides);
    mimeType = 'text/csv';
    extension = 'csv';
  }

  const filename = `indriver_rides_${new Date().toISOString().split('T')[0]}.${extension}`;
  const blob = new Blob([content], { type: mimeType });

  // Create download link
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Check if all jobs are complete (for determining when to show results)
 */
export const areAllJobsComplete = (jobs: InDriverExtractionJob[]): boolean => {
  if (jobs.length === 0) return false;
  return jobs.every((job) => job.status === 'completed' || job.status === 'failed');
};

/**
 * Get successful extractions from jobs
 */
export const getSuccessfulExtractions = (
  jobs: InDriverExtractionJob[]
): ExtractedInDriverRide[] => {
  return jobs.filter((job) => job.status === 'completed' && job.result).map((job) => job.result!);
};

/**
 * Get extraction statistics from jobs
 */
export const getExtractionStats = (jobs: InDriverExtractionJob[]) => {
  const total = jobs.length;
  const completed = jobs.filter((j) => j.status === 'completed').length;
  const failed = jobs.filter((j) => j.status === 'failed').length;
  const processing = jobs.filter(
    (j) => j.status === 'pending' || j.status === 'extracting_text' || j.status === 'analyzing'
  ).length;

  return { total, completed, failed, processing };
};
