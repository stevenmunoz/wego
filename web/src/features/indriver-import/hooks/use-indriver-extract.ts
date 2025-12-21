/**
 * Hook for managing InDriver extraction state and operations
 */

import { useState, useCallback } from 'react';
import { indriverApi, downloadExport } from '../services/indriver-api';
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
  isExtracting: boolean;
  isImporting: boolean;
  isExporting: boolean;
  error: string | null;
  summary: ExtractionSummary | null;

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
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [extractedRides, setExtractedRides] = useState<ExtractedInDriverRide[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ExtractionSummary | null>(null);

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
   * Extract data from all uploaded files
   */
  const extractAll = useCallback(async () => {
    if (files.length === 0) {
      setError('No hay archivos para procesar');
      return;
    }

    setIsExtracting(true);
    setError(null);

    // Track import started
    const fileTypes = [...new Set(files.map((f) => f.file.type.split('/')[1] || 'unknown'))];
    trackImportStarted(files.length, fileTypes);
    const startTime = Date.now();

    // Mark all files as processing
    setFiles((prev) => prev.map((f) => ({ ...f, status: 'processing' as const })));

    try {
      const rawFiles = files.map((f) => f.file);
      const response = await indriverApi.extractFromFiles(rawFiles);

      // Update file statuses based on results
      setFiles((prev) =>
        prev.map((f) => {
          const result = response.results.find((r) => r.source_image_path === f.file.name);
          const extractionError = response.errors.find((e) => e.file_name === f.file.name);

          return {
            ...f,
            status: result ? 'success' : extractionError ? 'error' : 'pending',
            result,
            error: extractionError?.error,
          };
        })
      );

      setExtractedRides(response.results);
      setSummary(response.summary);

      // Track extraction completed
      trackExtractionCompleted(response.results.length, Date.now() - startTime);

      if (!response.success && response.errors.length > 0) {
        setError(`${response.errors.length} archivo(s) no pudieron ser procesados`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al procesar los archivos';
      setError(message);
      setFiles((prev) => prev.map((f) => ({ ...f, status: 'error' as const, error: message })));
    } finally {
      setIsExtracting(false);
    }
  }, [files]);

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
   * Export rides to specified format
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
        await downloadExport(extractedRides, format);
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
   * Clear extracted rides
   */
  const clearExtracted = useCallback(() => {
    setExtractedRides([]);
    setSummary(null);
    setError(null);
  }, []);

  return {
    files,
    extractedRides,
    isExtracting,
    isImporting,
    isExporting,
    error,
    summary,
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
