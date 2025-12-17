/**
 * External Rides Firestore Service
 *
 * API functions for managing external rides and driver lookup
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/core/firebase/firestore';
import type { Driver, FirestoreDriver, ExternalRideInput, FirestoreExternalRide } from '../types';
import { PAYMENT_METHOD_LABELS } from '../constants';

// ============================================================================
// DRIVERS COLLECTION
// ============================================================================

/**
 * Get driver by unique slug (for public form validation)
 */
export async function getDriverBySlug(slug: string): Promise<Driver | null> {
  try {
    const driversRef = collection(db, 'drivers');
    const q = query(driversRef, where('unique_slug', '==', slug), where('is_active', '==', true));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const docSnap = snapshot.docs[0];
    const data = docSnap.data() as FirestoreDriver;

    return {
      id: docSnap.id,
      ...data,
    };
  } catch (error) {
    console.error('[externalRidesApi] Error fetching driver by slug:', error);
    throw error;
  }
}

/**
 * Get driver by ID
 */
export async function getDriverById(driverId: string): Promise<Driver | null> {
  try {
    const driverDocRef = doc(db, 'drivers', driverId);
    const docSnap = await getDoc(driverDocRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data() as FirestoreDriver;
    return {
      id: docSnap.id,
      ...data,
    };
  } catch (error) {
    console.error('[externalRidesApi] Error fetching driver by ID:', error);
    throw error;
  }
}

// ============================================================================
// EXTERNAL RIDES
// ============================================================================

/**
 * Generate unique ID for external ride
 */
function generateExternalRideId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ext_${timestamp}_${random}`;
}

/**
 * Get payment method label in Spanish
 */
function getPaymentMethodLabel(method: string): string {
  return PAYMENT_METHOD_LABELS[method] || 'Otro';
}

/**
 * Save external ride to Firestore
 */
export async function saveExternalRide(
  driverId: string,
  input: ExternalRideInput,
  vehicleId?: string // Optional vehicle ID (will use driver's primary vehicle if not provided)
): Promise<{ success: boolean; rideId?: string; error?: string }> {
  try {
    const rideId = generateExternalRideId();
    const rideDocRef = doc(db, 'drivers', driverId, 'driver_rides', rideId);

    // Parse date (YYYY-MM-DD format)
    const [year, month, day] = input.date.split('-').map(Number);
    const rideDate = new Date(year, month - 1, day, 12, 0, 0);

    // Calculate net earnings (no commission for external rides)
    const tipAmount = input.tip_received ? input.tip_amount || 0 : 0;
    const netEarnings = input.total_received + tipAmount;

    // Create Firestore document
    // Build base object without optional fields that may be undefined
    const firestoreRide: FirestoreExternalRide = {
      // Identification
      id: rideId,
      driver_id: driverId,
      vehicle_id: vehicleId ?? null, // Track which vehicle was used (null if not provided)

      // Ride Details
      date: Timestamp.fromDate(rideDate),
      time: input.time,
      origin_address: input.origin_address,
      destination_address: input.destination_address,

      // Request context
      request_source: input.request_source,
      trip_reason: input.trip_reason,
      time_of_day: input.time_of_day,
      is_recurring: input.is_recurring,

      // Financial (external rides: no commission)
      total_received: input.total_received,
      payment_method: input.payment_method,
      payment_method_label: getPaymentMethodLabel(input.payment_method),
      tip_received: input.tip_received,
      tip_amount: input.tip_received ? input.tip_amount || 0 : null,

      // Calculated fields (no commission for external rides)
      base_fare: input.total_received,
      service_commission: 0,
      commission_percentage: 0,
      service_tax: 0,
      total_paid: 0,
      net_earnings: netEarnings,

      // Status
      status: 'completed',

      // Categorization
      category: 'external',

      // Optional
      comments: input.comments || null,

      // Metadata
      created_at: Timestamp.now(),
      source_type: 'public_form',

      // Compatibility fields (nullable for external rides)
      source_image_path: null,
      extraction_confidence: null,
      duration_value: null,
      duration_unit: null,
      distance_value: null,
      distance_unit: null,
      passenger_name: null,
      rating_given: null,
      cancellation_reason: null,
      extracted_at: null,
      imported_at: null,
      raw_ocr_text: null,
    };

    await setDoc(rideDocRef, firestoreRide);

    console.log('[externalRidesApi] External ride saved:', rideId);

    return { success: true, rideId };
  } catch (error) {
    console.error('[externalRidesApi] Error saving external ride:', error);
    const errorMsg = error instanceof Error ? error.message : 'Error al guardar el viaje';

    // Check for common Firestore errors
    if (errorMsg.includes('permission-denied') || errorMsg.includes('PERMISSION_DENIED')) {
      return {
        success: false,
        error: 'Permiso denegado. Contacta al administrador.',
      };
    }

    return { success: false, error: errorMsg };
  }
}
