/**
 * Firebase Storage service for vehicle images
 */

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { firebaseStorage } from './config';

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

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
 * Path: vehicles/{driverId}/{vehicleId}/{filename}
 */
export async function uploadVehicleImage(
  driverId: string,
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
    const filename = `vehicle_${timestamp}.${extension}`;

    // Create storage reference
    const storageRef = ref(
      firebaseStorage,
      `vehicles/${driverId}/${vehicleId}/${filename}`
    );

    // Upload file
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        uploadedBy: driverId,
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
 * Delete a vehicle image from Firebase Storage
 */
export async function deleteVehicleImage(
  imageUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Extract path from URL
    // URL format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encoded-path}?token=...
    const urlObj = new URL(imageUrl);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)$/);

    if (!pathMatch) {
      return { success: false, error: 'URL de imagen inválida' };
    }

    const encodedPath = pathMatch[1];
    const path = decodeURIComponent(encodedPath);

    // Create reference and delete
    const storageRef = ref(firebaseStorage, path);
    await deleteObject(storageRef);

    return { success: true };
  } catch (error) {
    console.error('[Storage] Error deleting vehicle image:', error);
    // If file doesn't exist, consider it a success
    if (error instanceof Error && error.message.includes('object-not-found')) {
      return { success: true };
    }
    const errorMsg = error instanceof Error ? error.message : 'Error al eliminar imagen';
    return { success: false, error: errorMsg };
  }
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
