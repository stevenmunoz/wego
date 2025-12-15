/**
 * Firestore database service for WeGo
 */

import {
  getFirestore,
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  setDoc,
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

// ============================================================================
// USER ROLES
// ============================================================================

export type UserRole = 'admin' | 'driver';

export interface FirestoreUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface FirestoreDriver {
  id: string;
  name: string;
  email: string;
  phone: string;
  unique_slug: string;
  is_active: boolean;
  role?: UserRole;
  // Other driver fields...
  created_at?: Timestamp;
  updated_at?: Timestamp;
}

/**
 * Get user profile from Firestore users collection
 */
export async function getUserProfile(userId: string): Promise<FirestoreUser | null> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userDocRef);

    if (userSnapshot.exists()) {
      return { id: userSnapshot.id, ...userSnapshot.data() } as FirestoreUser;
    }
    return null;
  } catch (error) {
    console.error('[Firestore] Error fetching user profile:', error);
    return null;
  }
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(): Promise<FirestoreUser[]> {
  try {
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FirestoreUser));
  } catch (error) {
    console.error('[Firestore] Error fetching all users:', error);
    return [];
  }
}

/**
 * Create a new user in Firestore
 * Note: This creates the Firestore document. Firebase Auth user must be created separately.
 */
export async function createUserProfile(
  userId: string,
  data: {
    email: string;
    name: string;
    role: UserRole;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const now = Timestamp.now();

    await setDoc(userDocRef, {
      email: data.email,
      name: data.name,
      role: data.role,
      is_active: true,
      created_at: now,
      updated_at: now,
    });

    return { success: true };
  } catch (error) {
    console.error('[Firestore] Error creating user profile:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Update a user profile in Firestore
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<FirestoreUser, 'name' | 'role' | 'is_active'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      ...updates,
      updated_at: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error('[Firestore] Error updating user profile:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Create a new driver in Firestore
 */
export async function createDriverProfile(
  driverId: string,
  data: {
    email: string;
    name: string;
    phone: string;
    unique_slug: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const driverDocRef = doc(db, 'drivers', driverId);
    const now = Timestamp.now();

    await setDoc(driverDocRef, {
      email: data.email,
      name: data.name,
      phone: data.phone,
      unique_slug: data.unique_slug,
      is_active: true,
      created_at: now,
      updated_at: now,
    });

    return { success: true };
  } catch (error) {
    console.error('[Firestore] Error creating driver profile:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Update a driver profile in Firestore
 */
export async function updateDriverProfile(
  driverId: string,
  updates: Partial<Pick<FirestoreDriver, 'name' | 'phone' | 'unique_slug' | 'is_active'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const driverDocRef = doc(db, 'drivers', driverId);
    await updateDoc(driverDocRef, {
      ...updates,
      updated_at: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error('[Firestore] Error updating driver profile:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Get driver profile from Firestore drivers collection
 */
export async function getDriverProfile(driverId: string): Promise<FirestoreDriver | null> {
  try {
    const driverDocRef = doc(db, 'drivers', driverId);
    const driverSnapshot = await getDoc(driverDocRef);

    if (driverSnapshot.exists()) {
      return { id: driverSnapshot.id, ...driverSnapshot.data() } as FirestoreDriver;
    }
    return null;
  } catch (error) {
    console.error('[Firestore] Error fetching driver profile:', error);
    return null;
  }
}

/**
 * Get all drivers (admin only)
 */
export async function getAllDrivers(): Promise<FirestoreDriver[]> {
  try {
    const driversCollection = collection(db, 'drivers');
    const snapshot = await getDocs(driversCollection);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FirestoreDriver));
  } catch (error) {
    console.error('[Firestore] Error fetching all drivers:', error);
    return [];
  }
}

/**
 * Get all rides from all drivers (admin only)
 * Uses collection group query to fetch ALL rides regardless of driver document existence
 */
export async function getAllDriversRides(
  options?: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
  }
): Promise<Array<FirestoreInDriverRide & { driver_name?: string }>> {
  try {
    // Use collection group query to get ALL rides across ALL drivers
    const ridesCollectionGroup = collectionGroup(db, 'driver_rides');
    let q = query(ridesCollectionGroup, orderBy('date', 'asc'));

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
    console.log('[Firestore] getAllDriversRides - Collection group query returned:', snapshot.docs.length, 'rides');

    // Get all drivers AND users to map driver_id -> name
    // Some drivers may only exist in users collection, not drivers collection
    const [drivers, users] = await Promise.all([getAllDrivers(), getAllUsers()]);

    const nameMap = new Map<string, string>();

    // First add user names (lower priority)
    users.forEach((user) => {
      nameMap.set(user.id, user.name);
    });

    // Then add driver names (higher priority - will override user names if same ID)
    drivers.forEach((driver) => {
      nameMap.set(driver.id, driver.name);
    });

    // Map rides with driver names
    const allRides: Array<FirestoreInDriverRide & { driver_name?: string }> = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as FirestoreInDriverRide;
      return {
        ...data,
        driver_name: nameMap.get(data.driver_id) || `Driver ${data.driver_id.slice(0, 8)}...`,
      };
    });

    console.log('[Firestore] getAllDriversRides - Total rides:', allRides.length);

    return allRides;
  } catch (error) {
    console.error('[Firestore] Error fetching all drivers rides:', error);
    return [];
  }
}

/**
 * Ride data structure for Firestore
 *
 * Supports multiple ride sources:
 * - 'indriver': Imported from InDriver screenshots via OCR
 * - 'external': Registered via public form (WhatsApp, phone, etc.)
 * - 'independent': Other independent rides
 * - 'other': Miscellaneous
 */
export interface FirestoreInDriverRide {
  // Identification
  id: string;
  driver_id: string;
  vehicle_id?: string; // Optional for backward compatibility, will be required for new rides
  source_image_path: string | null;
  extraction_confidence: number | null;

  // Ride Details
  date: Timestamp | null;
  time: string;
  destination_address: string;
  duration_value: number | null;
  duration_unit: string | null;
  distance_value: number | null;
  distance_unit: string | null;

  // External ride fields (optional for backward compatibility)
  origin_address?: string;
  request_source?: 'whatsapp' | 'phone' | 'referral' | 'other';
  trip_reason?: 'personal' | 'work' | 'emergency' | 'other';
  time_of_day?: 'morning' | 'afternoon' | 'evening' | 'night';
  is_recurring?: boolean;
  tip_received?: boolean;
  tip_amount?: number | null;
  comments?: string | null;
  source_type?: 'ocr_import' | 'public_form' | 'manual';

  // Passenger Info
  passenger_name: string | null;
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
  extracted_at: Timestamp | null;
  imported_at: Timestamp | null;
  created_at?: Timestamp;
  raw_ocr_text: string | null;

  // Categorization (for filtering/reporting)
  category: 'indriver' | 'independent' | 'external' | 'other';
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
  }>,
  vehicleId?: string // Optional vehicle ID for tracking
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
          vehicle_id: vehicleId, // Track which vehicle was used
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
          created_at: Timestamp.now(),
          raw_ocr_text: ride.raw_ocr_text,
          source_type: 'ocr_import',
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
  try {
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
  } catch (error) {
    console.error(`[Firestore] Error fetching rides for driver ${driverId}:`, error);
    throw error; // Re-throw so caller can handle
  }
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
