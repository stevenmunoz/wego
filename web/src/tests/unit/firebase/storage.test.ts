/**
 * Tests for Firebase Storage service
 *
 * Tests the file upload functions including receipt uploads.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Firebase Storage functions
const mockUploadBytes = vi.fn();
const mockGetDownloadURL = vi.fn();
const mockRef = vi.fn();
const mockDeleteObject = vi.fn();

vi.mock('firebase/storage', () => ({
  ref: (...args: unknown[]) => mockRef(...args),
  uploadBytes: (...args: unknown[]) => mockUploadBytes(...args),
  getDownloadURL: (...args: unknown[]) => mockGetDownloadURL(...args),
  deleteObject: (...args: unknown[]) => mockDeleteObject(...args),
}));

vi.mock('@/core/firebase/config', () => ({
  firebaseStorage: { name: 'mock-storage' },
}));

// Import after mocking
import {
  uploadExpenseReceipt,
  uploadIncomeReceipt,
  uploadVehicleImage,
  deleteStorageFile,
} from '@/core/firebase/storage';

// Helper to create a mock File
function createMockFile(
  name: string,
  type: string,
  size: number = 1024
): File {
  const content = new Array(size).fill('a').join('');
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
}

describe('Firebase Storage Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRef.mockReturnValue({ fullPath: 'mock-path' });
    mockUploadBytes.mockResolvedValue({ ref: { fullPath: 'mock-path' } });
    mockGetDownloadURL.mockResolvedValue('https://storage.example.com/file.jpg');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadIncomeReceipt', () => {
    it('should upload a valid image file successfully', async () => {
      const file = createMockFile('receipt.jpg', 'image/jpeg');
      const vehicleId = 'vehicle-123';

      const result = await uploadIncomeReceipt(vehicleId, file);

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://storage.example.com/file.jpg');
      expect(mockRef).toHaveBeenCalledWith(
        { name: 'mock-storage' },
        expect.stringMatching(/^vehicles\/vehicle-123\/receipts\/income_\d+\.jpg$/)
      );
      expect(mockUploadBytes).toHaveBeenCalledWith(
        expect.anything(),
        file,
        expect.objectContaining({
          contentType: 'image/jpeg',
          customMetadata: {
            vehicleId: 'vehicle-123',
            type: 'income_receipt',
          },
        })
      );
    });

    it('should upload a valid PDF file successfully', async () => {
      const file = createMockFile('receipt.pdf', 'application/pdf');
      const vehicleId = 'vehicle-456';

      const result = await uploadIncomeReceipt(vehicleId, file);

      expect(result.success).toBe(true);
      expect(mockRef).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringMatching(/^vehicles\/vehicle-456\/receipts\/income_\d+\.pdf$/)
      );
    });

    it('should reject invalid file types', async () => {
      const file = createMockFile('receipt.txt', 'text/plain');
      const vehicleId = 'vehicle-123';

      const result = await uploadIncomeReceipt(vehicleId, file);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Tipo de archivo no permitido');
      expect(mockUploadBytes).not.toHaveBeenCalled();
    });

    it('should reject files that are too large', async () => {
      // Create a file larger than 10MB
      const file = createMockFile('receipt.jpg', 'image/jpeg', 11 * 1024 * 1024);
      const vehicleId = 'vehicle-123';

      const result = await uploadIncomeReceipt(vehicleId, file);

      expect(result.success).toBe(false);
      expect(result.error).toContain('muy grande');
      expect(mockUploadBytes).not.toHaveBeenCalled();
    });

    it('should handle upload errors gracefully', async () => {
      const file = createMockFile('receipt.jpg', 'image/jpeg');
      const vehicleId = 'vehicle-123';
      mockUploadBytes.mockRejectedValue(new Error('Network error'));

      const result = await uploadIncomeReceipt(vehicleId, file);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('uploadExpenseReceipt', () => {
    it('should upload a valid image file successfully', async () => {
      const file = createMockFile('expense.jpg', 'image/jpeg');
      const vehicleId = 'vehicle-123';

      const result = await uploadExpenseReceipt(vehicleId, file);

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://storage.example.com/file.jpg');
      expect(mockRef).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringMatching(/^vehicles\/vehicle-123\/receipts\/receipt_\d+\.jpg$/)
      );
      expect(mockUploadBytes).toHaveBeenCalledWith(
        expect.anything(),
        file,
        expect.objectContaining({
          customMetadata: {
            vehicleId: 'vehicle-123',
            type: 'expense_receipt',
          },
        })
      );
    });

    it('should upload PNG files', async () => {
      const file = createMockFile('expense.png', 'image/png');
      const vehicleId = 'vehicle-789';

      const result = await uploadExpenseReceipt(vehicleId, file);

      expect(result.success).toBe(true);
    });

    it('should upload WebP files', async () => {
      const file = createMockFile('expense.webp', 'image/webp');
      const vehicleId = 'vehicle-789';

      const result = await uploadExpenseReceipt(vehicleId, file);

      expect(result.success).toBe(true);
    });

    it('should reject invalid file types', async () => {
      const file = createMockFile('expense.doc', 'application/msword');
      const vehicleId = 'vehicle-123';

      const result = await uploadExpenseReceipt(vehicleId, file);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Tipo de archivo no permitido');
    });
  });

  describe('uploadVehicleImage', () => {
    it('should upload a valid image file successfully', async () => {
      const file = createMockFile('photo.jpg', 'image/jpeg');
      const vehicleId = 'vehicle-123';

      const result = await uploadVehicleImage(vehicleId, file);

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://storage.example.com/file.jpg');
      expect(mockRef).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringMatching(/^vehicles\/vehicle-123\/photo_\d+\.jpg$/)
      );
    });

    it('should reject files larger than 5MB for images', async () => {
      // Vehicle images have a 5MB limit (not 10MB like documents)
      const file = createMockFile('photo.jpg', 'image/jpeg', 6 * 1024 * 1024);
      const vehicleId = 'vehicle-123';

      const result = await uploadVehicleImage(vehicleId, file);

      expect(result.success).toBe(false);
      expect(result.error).toContain('muy grande');
    });
  });

  describe('deleteStorageFile', () => {
    it('should delete a file successfully', async () => {
      mockDeleteObject.mockResolvedValue(undefined);
      const fileUrl =
        'https://firebasestorage.googleapis.com/v0/b/bucket/o/vehicles%2Fvehicle-123%2Freceipts%2Freceipt.jpg?token=abc';

      const result = await deleteStorageFile(fileUrl);

      expect(result.success).toBe(true);
      expect(mockRef).toHaveBeenCalled();
      expect(mockDeleteObject).toHaveBeenCalled();
    });

    it('should handle invalid URLs gracefully', async () => {
      const invalidUrl = 'https://example.com/invalid-url';

      const result = await deleteStorageFile(invalidUrl);

      expect(result.success).toBe(false);
      expect(result.error).toContain('URL de archivo inválida');
    });

    it('should consider object-not-found as success', async () => {
      mockDeleteObject.mockRejectedValue(new Error('object-not-found'));
      const fileUrl =
        'https://firebasestorage.googleapis.com/v0/b/bucket/o/vehicles%2Fvehicle-123%2Ffile.jpg?token=abc';

      const result = await deleteStorageFile(fileUrl);

      expect(result.success).toBe(true);
    });
  });
});
