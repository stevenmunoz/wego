/**
 * InDriver Import API Service
 */

import { apiClient } from '@/core/api/client';
import type {
  ExtractResponse,
  ImportRequest,
  ImportResponse,
  ExportRequest,
  ExportFormat,
  ExtractedInDriverRide,
  ValidationResult,
  ExtractionStats,
} from '../types';

export const indriverApi = {
  /**
   * Extract ride data from uploaded files
   */
  extractFromFiles: async (files: File[]): Promise<ExtractResponse> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await apiClient.post<ExtractResponse>('/indriver/extract', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 seconds for OCR processing
    });
    return response.data;
  },

  /**
   * Import extracted rides to database
   */
  importRides: async (request: ImportRequest): Promise<ImportResponse> => {
    const response = await apiClient.post<ImportResponse>('/indriver/import', request);
    return response.data;
  },

  /**
   * Export rides to specified format
   */
  exportRides: async (rides: ExtractedInDriverRide[], format: ExportFormat): Promise<Blob> => {
    const request: ExportRequest = { rides, format };
    const response = await apiClient.post<Blob>('/indriver/export', request, {
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  /**
   * Validate a single ride's financial data
   */
  validateRide: async (ride: ExtractedInDriverRide): Promise<ValidationResult> => {
    const response = await apiClient.post<ValidationResult>('/indriver/validate', ride);
    return response.data;
  },

  /**
   * Get extraction statistics
   */
  getStats: async (): Promise<ExtractionStats> => {
    const response = await apiClient.get<ExtractionStats>('/indriver/stats');
    return response.data;
  },
};

/**
 * Download exported data as file
 */
export const downloadExport = async (
  rides: ExtractedInDriverRide[],
  format: ExportFormat
): Promise<void> => {
  const blob = await indriverApi.exportRides(rides, format);

  const extension = format === 'xlsx' ? 'csv' : format; // XLSX falls back to CSV
  const filename = `indriver_rides_${new Date().toISOString().split('T')[0]}.${extension}`;

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
