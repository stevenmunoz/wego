/**
 * Hook for managing InDriver extraction state and operations (Serverless)
 *
 * Uses Firebase Storage for uploads and Firestore for real-time status updates.
 * Cloud Functions handle the OCR extraction asynchronously.
 *
 * Session Tracking: Only shows extraction jobs from the current upload session,
 * not accumulated results from previous sessions.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '@/core/store/auth-store';
import {
  indriverApi,
  downloadExport,
  getSuccessfulExtractions,
  getExtractionStats,
  type InDriverExtractionJob,
} from '../services/indriver-api';
import type { Unsubscribe } from 'firebase/firestore';
import { saveInDriverRides } from '@/core/firebase';
import {
  trackImportStarted,
  trackExtractionCompleted,
  trackImportCompleted,
} from '@/core/analytics';
import type {
  ExtractedInDriverRide,
  UploadedFile,
  ExtractionSummary,
  ExportFormat,
} from '../types';

interface UseInDriverExtractReturn {
  // State
  files: UploadedFile[];
  extractedRides: ExtractedInDriverRide[];
  extractionJobs: InDriverExtractionJob[];
  isUploading: boolean;
  isExtracting: boolean;
  isImporting: boolean;
  isExporting: boolean;
  error: string | null;
  summary: ExtractionSummary | null;
  uploadProgress: number;

  // Actions
  addFiles: (newFiles: File[]) => void;
  removeFile: (index: number) => void;
  clearFiles: () => void;
  extractAll: () => Promise<void>;
  updateRide: (id: string, updates: Partial<ExtractedInDriverRide>) => void;
  removeRide: (id: string) => void;
  importRides: (driverId: string, vehicleId?: string) => Promise<boolean>;
  exportRides: (format: ExportFormat) => Promise<void>;
  clearExtracted: () => void;
}

export const useInDriverExtract = (): UseInDriverExtractReturn => {
  const user = useAuthStore((state) => state.user);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [extractedRides, setExtractedRides] = useState<ExtractedInDriverRide[]>([]);
  const [extractionJobs, setExtractionJobs] = useState<InDriverExtractionJob[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ExtractionSummary | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Track subscription cleanup
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const extractionStartTimeRef = useRef<number>(0);

  // Track uploaded paths for current session (to filter jobs)
  const sessionUploadPathsRef = useRef<Set<string>>(new Set());

  /**
   * Subscribe to extraction jobs when user is authenticated
   * Only shows jobs that match files uploaded in the current session
   */
  useEffect(() => {
    if (!user?.id) {
      setExtractionJobs([]);
      return;
    }

    // Subscribe to real-time extraction updates
    unsubscribeRef.current = indriverApi.subscribeToExtractions(user.id, (allJobs) => {
      // Filter jobs to only show ones from current session
      const sessionPaths = sessionUploadPathsRef.current;

      // If no session paths yet (before any upload), show nothing
      // If session paths exist, filter to only matching jobs
      let sessionJobs: InDriverExtractionJob[];

      if (sessionPaths.size === 0) {
        // No uploads in this session yet - show nothing
        sessionJobs = [];
      } else {
        // Filter to jobs matching current session uploads
        // Match direct uploads and multi-page PDF pages
        // Direct: indriver-documents/{userId}/{timestamp}_{filename}
        // Pages: indriver-documents/{userId}/{timestamp}_{filename} (page N)
        sessionJobs = allJobs.filter((job) => {
          return Array.from(sessionPaths).some((path) => {
            // Exact match for direct uploads
            if (job.storage_path === path) return true;
            // startsWith match for multi-page PDFs (path + " (page N)")
            if (job.storage_path.startsWith(path + ' ')) return true;
            // Also check if job storage_path starts with exact path (for backward compat)
            if (job.storage_path.startsWith(path)) return true;
            return false;
          });
        });
      }

      setExtractionJobs(sessionJobs);

      // Extract successful rides from session jobs only
      const rides = getSuccessfulExtractions(sessionJobs);
      setExtractedRides(rides);

      // Update extraction status
      const stats = getExtractionStats(sessionJobs);
      const hasProcessing = stats.processing > 0;
      setIsExtracting(hasProcessing);

      // Update summary when extraction is complete
      if (sessionJobs.length > 0 && !hasProcessing) {
        const avgConfidence =
          rides.length > 0
            ? rides.reduce((sum, r) => sum + (r.extraction_confidence || 0), 0) / rides.length
            : 0;
        setSummary({
          total_files: stats.total,
          successful_extractions: stats.completed,
          failed_extractions: stats.failed,
          average_confidence: avgConfidence,
        });

        // Track extraction completed (only once when all jobs finish)
        if (extractionStartTimeRef.current > 0) {
          trackExtractionCompleted(stats.completed, Date.now() - extractionStartTimeRef.current);
          extractionStartTimeRef.current = 0;
        }
      }

      // Update file statuses based on jobs
      if (sessionJobs.length > 0) {
        setFiles((prev) =>
          prev.map((f) => {
            const job = sessionJobs.find((j) =>
              j.file_name.includes(f.file.name.replace(/[^a-zA-Z0-9.-]/g, '_'))
            );
            if (!job) return f;

            const status =
              job.status === 'completed'
                ? 'success'
                : job.status === 'failed'
                  ? 'error'
                  : 'processing';

            return {
              ...f,
              status,
              result: job.result || undefined,
              error: job.error || undefined,
            };
          })
        );
      }
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user?.id]);

  /**
   * Add new files to the upload queue
   */
  const addFiles = useCallback((newFiles: File[]) => {
    const uploadedFiles: UploadedFile[] = newFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'pending' as const,
    }));
    setFiles((prev) => [...prev, ...uploadedFiles]);
    setError(null);
  }, []);

  /**
   * Remove a file from the queue
   */
  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      // Revoke preview URL to prevent memory leaks
      if (newFiles[index]?.preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  }, []);

  /**
   * Clear all files
   */
  const clearFiles = useCallback(() => {
    files.forEach((f) => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setFiles([]);
  }, [files]);

  /**
   * Upload files for extraction (triggers Cloud Function)
   */
  const extractAll = useCallback(async () => {
    if (files.length === 0) {
      setError('No hay archivos para procesar');
      return;
    }

    if (!user?.id) {
      setError('Usuario no autenticado');
      return;
    }

    // Clear previous session state for new extraction
    sessionUploadPathsRef.current = new Set();
    setExtractedRides([]);
    setExtractionJobs([]);
    setSummary(null);

    setIsUploading(true);
    setIsExtracting(true);
    setError(null);
    setUploadProgress(0);

    // Track import started
    const fileTypes = [...new Set(files.map((f) => f.file.type.split('/')[1] || 'unknown'))];
    trackImportStarted(files.length, fileTypes);
    extractionStartTimeRef.current = Date.now();

    // Track import started
    const fileTypes = [...new Set(files.map((f) => f.file.type.split('/')[1] || 'unknown'))];
    trackImportStarted(files.length, fileTypes);
    const startTime = Date.now();

    // Mark all files as processing
    setFiles((prev) => prev.map((f) => ({ ...f, status: 'processing' as const })));

    try {
      const rawFiles = files.map((f) => f.file);

      // Upload files to Storage (triggers Cloud Function)
      const uploadedPaths = await indriverApi.uploadForExtraction(user.id, rawFiles, (progress) => {
        setUploadProgress(progress);
      });

      // Track uploaded paths for session filtering
      uploadedPaths.forEach((path) => sessionUploadPathsRef.current.add(path));

      // Upload complete, now waiting for Cloud Function to process
      setIsUploading(false);
      setUploadProgress(100);

      // The extraction status will be updated via the Firestore subscription
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al subir los archivos';
      setError(message);
      setFiles((prev) => prev.map((f) => ({ ...f, status: 'error' as const, error: message })));
      setIsUploading(false);
      setIsExtracting(false);
    }
  }, [files, user?.id]);

  /**
   * Update a specific extracted ride
   */
  const updateRide = useCallback((id: string, updates: Partial<ExtractedInDriverRide>) => {
    setExtractedRides((prev) =>
      prev.map((ride) => (ride.id === id ? { ...ride, ...updates } : ride))
    );
  }, []);

  /**
   * Remove a ride from the extracted list
   */
  const removeRide = useCallback((id: string) => {
    setExtractedRides((prev) => prev.filter((ride) => ride.id !== id));
  }, []);

  /**
   * Import extracted rides to Firebase
   */
  const importRides = useCallback(
    async (driverId: string, vehicleId?: string): Promise<boolean> => {
      if (extractedRides.length === 0) {
        setError('No hay viajes para importar');
        return false;
      }

      if (!driverId) {
        setError('Usuario no autenticado');
        return false;
      }

      setIsImporting(true);
      setError(null);

      try {
        // Save to Firebase Firestore with vehicle tracking
        const result = await saveInDriverRides(driverId, extractedRides, vehicleId);

        if (result.success) {
          // Track import completed
          trackImportCompleted(result.savedCount || extractedRides.length);

          // Clear rides after successful import
          setExtractedRides([]);

          if (result.errors.length > 0) {
            setError(`${result.errors.length} viaje(s) tuvieron errores: ${result.errors[0]}`);
          }

          return true;
        } else {
          setError(
            result.errors.length > 0 ? result.errors[0] : 'No se pudo importar ningún viaje'
          );
          return false;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al importar los viajes';
        setError(message);
        return false;
      } finally {
        setIsImporting(false);
      }
    },
    [extractedRides]
  );

  /**
   * Export rides to specified format (client-side)
   */
  const exportRides = useCallback(
    async (format: ExportFormat) => {
      if (extractedRides.length === 0) {
        setError('No hay viajes para exportar');
        return;
      }

      setIsExporting(true);
      setError(null);

      try {
        downloadExport(extractedRides, format);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al exportar los viajes';
        setError(message);
      } finally {
        setIsExporting(false);
      }
    },
    [extractedRides]
  );

  /**
   * Clear extracted rides and session state
   */
  const clearExtracted = useCallback(() => {
    sessionUploadPathsRef.current = new Set();
    setExtractedRides([]);
    setExtractionJobs([]);
    setSummary(null);
    setError(null);
  }, []);

  return {
    files,
    extractedRides,
    extractionJobs,
    isUploading,
    isExtracting,
    isImporting,
    isExporting,
    error,
    summary,
    uploadProgress,
    addFiles,
    removeFile,
    clearFiles,
    extractAll,
    updateRide,
    removeRide,
    importRides,
    exportRides,
    clearExtracted,
  };
};
