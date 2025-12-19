/**
 * Firebase Storage service for vehicle files
 *
 * All vehicle-related files are stored under:
 * - vehicles/{vehicleId}/photo_{timestamp}.{ext}
 * - vehicles/{vehicleId}/documents/{type}_{timestamp}.{ext}
 * - vehicles/{vehicleId}/receipts/{timestamp}.{ext}
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { firebaseStorage } from './config';

// Max file size: 5MB for images, 10MB for documents
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Allowed document types (PDF and images)
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

/**
 * Validate image file before upload
 */
function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de archivo no permitido. Use JPG, PNG o WebP.',
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'El archivo es muy grande. Máximo 5MB.',
    };
  }

  return { valid: true };
}

/**
 * Upload a vehicle image to Firebase Storage
 * Path: vehicles/{vehicleId}/photo_{timestamp}.{ext}
 */
export async function uploadVehicleImage(
  vehicleId: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `photo_${timestamp}.${extension}`;

    // Create storage reference
    const storageRef = ref(firebaseStorage, `vehicles/${vehicleId}/${filename}`);

    // Upload file
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        vehicleId: vehicleId,
      },
    });

    // Get download URL
    const url = await getDownloadURL(snapshot.ref);

    return { success: true, url };
  } catch (error) {
    console.error('[Storage] Error uploading vehicle image:', error);
    const errorMsg = error instanceof Error ? error.message : 'Error al subir imagen';
    return { success: false, error: errorMsg };
  }
}

/**
 * Delete a file from Firebase Storage by URL
 */
export async function deleteStorageFile(
  fileUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Extract path from URL
    // URL format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encoded-path}?token=...
    const urlObj = new URL(fileUrl);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)$/);

    if (!pathMatch) {
      return { success: false, error: 'URL de archivo inválida' };
    }

    const encodedPath = pathMatch[1];
    const path = decodeURIComponent(encodedPath);

    // Create reference and delete
    const storageRef = ref(firebaseStorage, path);
    await deleteObject(storageRef);

    return { success: true };
  } catch (error) {
    console.error('[Storage] Error deleting file:', error);
    // If file doesn't exist, consider it a success
    if (error instanceof Error && error.message.includes('object-not-found')) {
      return { success: true };
    }
    const errorMsg = error instanceof Error ? error.message : 'Error al eliminar archivo';
    return { success: false, error: errorMsg };
  }
}

/**
 * Delete a vehicle image from Firebase Storage
 * @deprecated Use deleteStorageFile instead
 */
export async function deleteVehicleImage(
  imageUrl: string
): Promise<{ success: boolean; error?: string }> {
  return deleteStorageFile(imageUrl);
}

/**
 * Compress image before upload (optional utility)
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Validate document file before upload (PDF or image)
 */
function validateDocumentFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de archivo no permitido. Use PDF, JPG, PNG o WebP.',
    };
  }

  if (file.size > MAX_DOCUMENT_SIZE) {
    return {
      valid: false,
      error: 'El archivo es muy grande. Máximo 10MB.',
    };
  }

  return { valid: true };
}

export type DocumentType = 'soat' | 'tecnomecanica';

/**
 * Upload a vehicle document (SOAT or Tecnomecánica) to Firebase Storage
 * Path: vehicles/{vehicleId}/documents/{documentType}_{timestamp}.{ext}
 */
export async function uploadVehicleDocument(
  vehicleId: string,
  documentType: DocumentType,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Validate file
    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'pdf';
    const filename = `${documentType}_${timestamp}.${extension}`;

    // Create storage reference
    const storageRef = ref(
      firebaseStorage,
      `vehicles/${vehicleId}/documents/${filename}`
    );

    // Upload file
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        vehicleId: vehicleId,
        documentType: documentType,
      },
    });

    // Get download URL
    const url = await getDownloadURL(snapshot.ref);

    return { success: true, url };
  } catch (error) {
    console.error('[Storage] Error uploading vehicle document:', error);
    const errorMsg = error instanceof Error ? error.message : 'Error al subir documento';
    return { success: false, error: errorMsg };
  }
}

/**
 * Delete a vehicle document from Firebase Storage
 * @deprecated Use deleteStorageFile instead
 */
export async function deleteVehicleDocument(
  documentUrl: string
): Promise<{ success: boolean; error?: string }> {
  return deleteStorageFile(documentUrl);
}

/**
 * Upload an expense receipt to Firebase Storage
 * Path: vehicles/{vehicleId}/receipts/{timestamp}.{ext}
 */
export async function uploadExpenseReceipt(
  vehicleId: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Validate file
    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'pdf';
    const filename = `receipt_${timestamp}.${extension}`;

    // Create storage reference
    const storageRef = ref(
      firebaseStorage,
      `vehicles/${vehicleId}/receipts/${filename}`
    );

    // Upload file
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        vehicleId: vehicleId,
        type: 'expense_receipt',
      },
    });

    // Get download URL
    const url = await getDownloadURL(snapshot.ref);

    return { success: true, url };
  } catch (error) {
    console.error('[Storage] Error uploading expense receipt:', error);
    const errorMsg = error instanceof Error ? error.message : 'Error al subir recibo';
    return { success: false, error: errorMsg };
  }
}
