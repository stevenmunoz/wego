/**
 * Firestore database service for WeGo
 */

import {
  getFirestore,
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { firebaseApp } from './config';

// Initialize Firestore
export const db = getFirestore(firebaseApp);

/**
 * InDriver ride data structure for Firestore
 */
export interface FirestoreInDriverRide {
  // Identification
  id: string;
  driver_id: string;
  source_image_path: string;
  extraction_confidence: number;

  // Ride Details
  date: Timestamp | null;
  time: string;
  destination_address: string;
  duration_value: number | null;
  duration_unit: string | null;
  distance_value: number | null;
  distance_unit: string | null;

  // Passenger Info
  passenger_name: string;
  rating_given: number | null;

  // Status
  status: string;
  cancellation_reason: string | null;

  // Payment
  payment_method: string;
  payment_method_label: string;

  // Financial (stored in COP)
  base_fare: number;
  total_received: number;
  service_commission: number;
  commission_percentage: number;
  service_tax: number;
  total_paid: number;
  net_earnings: number;

  // Metadata
  extracted_at: Timestamp;
  imported_at: Timestamp;
  raw_ocr_text: string | null;

  // Categorization (for filtering/reporting)
  category: 'indriver' | 'independent' | 'other';
}

/**
 * Save multiple InDriver rides to Firestore
 */
export async function saveInDriverRides(
  driverId: string,
  rides: Array<{
    id: string;
    source_image_path: string;
    extraction_confidence: number;
    date: string | null;
    time: string;
    destination_address: string;
    duration: { value: number; unit: string } | null;
    distance: { value: number; unit: string } | null;
    passenger_name: string;
    rating_given: number | null;
    status: string;
    cancellation_reason: string | null;
    payment_method: string;
    payment_method_label: string;
    tarifa: number;
    total_recibido: number;
    comision_servicio: number;
    comision_porcentaje: number;
    iva_pago_servicio: number;
    total_pagado: number;
    mis_ingresos: number;
    extracted_at: string;
    raw_ocr_text: string | null;
  }>
): Promise<{ success: boolean; savedCount: number; errors: string[] }> {
  const errors: string[] = [];
  let savedCount = 0;

  console.log('[Firestore] Starting save for driver:', driverId, 'rides count:', rides.length);

  try {
    const batch = writeBatch(db);
    const ridesCollection = collection(db, 'drivers', driverId, 'driver_rides');
    console.log('[Firestore] Collection path:', `drivers/${driverId}/driver_rides`);

    for (const ride of rides) {
      try {
        // Convert date string to Timestamp
        let dateTimestamp: Timestamp | null = null;
        if (ride.date) {
          const parsedDate = new Date(ride.date);
          if (!isNaN(parsedDate.getTime())) {
            dateTimestamp = Timestamp.fromDate(parsedDate);
          }
        }

        // Create Firestore document
        const firestoreRide: FirestoreInDriverRide = {
          id: ride.id,
          driver_id: driverId,
          source_image_path: ride.source_image_path,
          extraction_confidence: ride.extraction_confidence,
          date: dateTimestamp,
          time: ride.time,
          destination_address: ride.destination_address,
          duration_value: ride.duration?.value ?? null,
          duration_unit: ride.duration?.unit ?? null,
          distance_value: ride.distance?.value ?? null,
          distance_unit: ride.distance?.unit ?? null,
          passenger_name: ride.passenger_name,
          rating_given: ride.rating_given,
          status: ride.status,
          cancellation_reason: ride.cancellation_reason,
          payment_method: ride.payment_method,
          payment_method_label: ride.payment_method_label,
          base_fare: ride.tarifa,
          total_received: ride.total_recibido,
          service_commission: ride.comision_servicio,
          commission_percentage: ride.comision_porcentaje,
          service_tax: ride.iva_pago_servicio,
          total_paid: ride.total_pagado,
          net_earnings: ride.mis_ingresos,
          extracted_at: Timestamp.fromDate(new Date(ride.extracted_at)),
          imported_at: Timestamp.now(),
          raw_ocr_text: ride.raw_ocr_text,
          category: 'indriver',
        };

        // Use ride.id as document ID to prevent duplicates
        const rideDocRef = doc(ridesCollection, ride.id);
        batch.set(rideDocRef, firestoreRide);
        savedCount++;
      } catch (rideError) {
        const errorMsg = rideError instanceof Error ? rideError.message : 'Unknown error';
        errors.push(`Error saving ride ${ride.id}: ${errorMsg}`);
      }
    }

    // Commit batch write
    console.log('[Firestore] Committing batch with', savedCount, 'documents...');
    console.log(
      '[Firestore] Database app name:',
      db.app.name,
      'Project:',
      db.app.options.projectId
    );
    await batch.commit();
    console.log('[Firestore] Batch commit successful!');

    // Verify write by reading back
    const verifySnapshot = await getDocs(ridesCollection);
    console.log('[Firestore] Verification read - documents in collection:', verifySnapshot.size);

    return {
      success: savedCount > 0,
      savedCount,
      errors,
    };
  } catch (error) {
    console.error('[Firestore] Error saving rides:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    // Check for common Firestore errors
    if (errorMsg.includes('permission-denied') || errorMsg.includes('PERMISSION_DENIED')) {
      return {
        success: false,
        savedCount: 0,
        errors: ['Permiso denegado. Verifica las reglas de seguridad de Firestore.'],
      };
    }
    return {
      success: false,
      savedCount: 0,
      errors: [`Error guardando viajes: ${errorMsg}`],
    };
  }
}

/**
 * Get all InDriver rides for a driver
 */
export async function getInDriverRides(
  driverId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
  }
): Promise<FirestoreInDriverRide[]> {
  const ridesCollection = collection(db, 'drivers', driverId, 'driver_rides');

  let q = query(ridesCollection, orderBy('date', 'asc'));

  if (options?.startDate) {
    q = query(q, where('date', '>=', Timestamp.fromDate(options.startDate)));
  }

  if (options?.endDate) {
    q = query(q, where('date', '<=', Timestamp.fromDate(options.endDate)));
  }

  if (options?.status) {
    q = query(q, where('status', '==', options.status));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as FirestoreInDriverRide);
}

/**
 * Update a single InDriver ride in Firestore
 */
export async function updateInDriverRide(
  driverId: string,
  rideId: string,
  updates: Partial<Omit<FirestoreInDriverRide, 'id' | 'driver_id' | 'imported_at' | 'extracted_at'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const rideDocRef = doc(db, 'drivers', driverId, 'driver_rides', rideId);

    // Convert date string to Timestamp if present
    const firestoreUpdates: Record<string, unknown> = { ...updates };
    if ('date' in updates && updates.date !== undefined) {
      if (updates.date === null) {
        firestoreUpdates.date = null;
      } else if (updates.date instanceof Timestamp) {
        firestoreUpdates.date = updates.date;
      } else {
        // It's a string date (YYYY-MM-DD), convert to Timestamp
        // Parse at noon local time to avoid timezone issues
        const dateStr = updates.date as unknown as string;
        const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) {
          const [, year, month, day] = isoMatch;
          // Create date at noon local time to avoid timezone edge cases
          const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
          firestoreUpdates.date = Timestamp.fromDate(parsedDate);
        } else {
          // Fallback with noon time
          const parsedDate = new Date(dateStr + 'T12:00:00');
          if (!isNaN(parsedDate.getTime())) {
            firestoreUpdates.date = Timestamp.fromDate(parsedDate);
          }
        }
      }
    }

    await updateDoc(rideDocRef, firestoreUpdates);

    return { success: true };
  } catch (error) {
    console.error('[Firestore] Error updating ride:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}
