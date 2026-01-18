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
  deleteDoc,
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

export type UserRole = 'admin' | 'driver' | 'user';

export interface FirestoreUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * Driver profile in Firestore - stores only driver-specific data
 * User data (name, email, is_active) is stored in /users collection
 */
export interface FirestoreDriver {
  id: string;
  user_id: string; // Reference to /users/{userId} - SAME as id
  phone: string;
  unique_slug: string;
}

/**
 * Combined driver data for UI display (joined from /users + /drivers)
 */
export interface DriverWithUser {
  id: string;
  user_id: string;
  // From /users collection
  email: string;
  name: string;
  is_active: boolean;
  created_at: Timestamp;
  // From /drivers collection
  phone: string;
  unique_slug: string;
}

/**
 * Generate a URL-safe slug from a name
 * Example: "Juan Pérez" -> "juan-perez-x7k2"
 */
export function generateSlugFromName(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents (á→a, ñ→n)
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Spaces → hyphens
    .replace(/-+/g, '-') // Multiple hyphens → single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .trim();

  const suffix = Math.random().toString(36).substring(2, 6);
  return `${slug}-${suffix}`;
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
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as FirestoreUser);
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
 * Only stores driver-specific data (phone, slug)
 * User data (name, email, is_active) is stored in /users collection
 */
export async function createDriverProfile(
  driverId: string,
  data: {
    phone: string;
    unique_slug: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const driverDocRef = doc(db, 'drivers', driverId);

    await setDoc(driverDocRef, {
      user_id: driverId, // Reference back to /users/{driverId}
      phone: data.phone,
      unique_slug: data.unique_slug,
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
 * Only allows updating driver-specific fields (phone, unique_slug)
 * To update name/email/is_active, use updateUserProfile instead
 */
export async function updateDriverProfile(
  driverId: string,
  updates: Partial<Pick<FirestoreDriver, 'phone' | 'unique_slug'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const driverDocRef = doc(db, 'drivers', driverId);
    await updateDoc(driverDocRef, updates);
    return { success: true };
  } catch (error) {
    console.error('[Firestore] Error updating driver profile:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Get driver profile from Firestore drivers collection (raw, no user join)
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
 * Get driver with user data joined (for UI display)
 */
export async function getDriverWithUser(driverId: string): Promise<DriverWithUser | null> {
  try {
    const [driver, user] = await Promise.all([
      getDriverProfile(driverId),
      getUserProfile(driverId),
    ]);

    if (!driver || !user) {
      return null;
    }

    return {
      id: driver.id,
      user_id: driver.user_id,
      email: user.email,
      name: user.name,
      is_active: user.is_active,
      created_at: user.created_at,
      phone: driver.phone,
      unique_slug: driver.unique_slug,
    };
  } catch (error) {
    console.error('[Firestore] Error fetching driver with user:', error);
    return null;
  }
}

/**
 * Get all drivers with user data joined (admin only)
 * Returns combined DriverWithUser[] for UI display
 */
export async function getAllDrivers(): Promise<DriverWithUser[]> {
  try {
    // Get all driver documents
    const driversCollection = collection(db, 'drivers');
    const snapshot = await getDocs(driversCollection);
    const drivers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as FirestoreDriver);

    if (drivers.length === 0) {
      return [];
    }

    // Get all users to join
    const users = await getAllUsers();
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Join drivers with users
    const driversWithUsers: DriverWithUser[] = [];
    for (const driver of drivers) {
      const user = userMap.get(driver.user_id);
      if (user) {
        driversWithUsers.push({
          id: driver.id,
          user_id: driver.user_id,
          email: user.email,
          name: user.name,
          is_active: user.is_active,
          created_at: user.created_at,
          phone: driver.phone,
          unique_slug: driver.unique_slug,
        });
      } else {
        // Legacy driver without user link - skip or handle gracefully
        console.warn(`[Firestore] Driver ${driver.id} has no matching user`);
      }
    }

    return driversWithUsers;
  } catch (error) {
    console.error('[Firestore] Error fetching all drivers:', error);
    return [];
  }
}

/**
 * Get all rides from all drivers (admin only)
 * Uses collection group query to fetch ALL rides regardless of driver document existence
 */
export async function getAllDriversRides(options?: {
  startDate?: Date;
  endDate?: Date;
  status?: string;
}): Promise<Array<FirestoreInDriverRide & { driver_name?: string }>> {
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
    console.log(
      '[Firestore] getAllDriversRides - Collection group query returned:',
      snapshot.docs.length,
      'rides'
    );

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
    // IMPORTANT: Extract id, driver_id, and full path from document reference
    // This ensures updates target the correct Firestore location
    const allRides: Array<FirestoreInDriverRide & { driver_name?: string }> = snapshot.docs.map(
      (docSnap) => {
        const data = docSnap.data() as FirestoreInDriverRide;
        // Get the actual document ID (source of truth for Firestore path)
        const actualId = docSnap.id;
        // Get the actual driver_id from document path: {collection}/{driverId}/driver_rides/{rideId}
        const pathDriverId = docSnap.ref.parent.parent?.id;
        const actualDriverId = pathDriverId || data.driver_id;
        // Store the full document path for updates
        const docPath = docSnap.ref.path;

        return {
          ...data,
          // Override id with the actual document ID (source of truth)
          id: actualId,
          // Override driver_id with the one from the path (source of truth)
          driver_id: actualDriverId,
          // Store full path for updates (client-side only)
          _docPath: docPath,
          driver_name: nameMap.get(actualDriverId) || `Driver ${actualDriverId.slice(0, 8)}...`,
        };
      }
    );

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

  // Client-side only: full document path for updates (not stored in Firestore)
  _docPath?: string;
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
 * @param driverId - Driver ID (used if docPath not provided)
 * @param rideId - Ride ID (used if docPath not provided)
 * @param updates - Fields to update
 * @param docPath - Optional full document path (preferred, more reliable)
 */
export async function updateInDriverRide(
  driverId: string,
  rideId: string,
  updates: Partial<Omit<FirestoreInDriverRide, 'id' | 'imported_at' | 'extracted_at'>>,
  docPath?: string
): Promise<{ success: boolean; error?: string }> {
  console.log('[Firestore] updateInDriverRide called:', { driverId, rideId, updates, docPath });
  try {
    // Use the stored document path if available (more reliable), otherwise construct it
    const rideDocRef = docPath
      ? doc(db, docPath)
      : doc(db, 'drivers', driverId, 'driver_rides', rideId);
    console.log('[Firestore] Document path:', rideDocRef.path);

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

    console.log('[Firestore] Sending update to Firestore:', firestoreUpdates);
    await updateDoc(rideDocRef, firestoreUpdates);
    console.log('[Firestore] Update successful');

    return { success: true };
  } catch (error) {
    console.error('[Firestore] Error updating ride:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Reassign a ride to a different driver
 * This moves the document from one driver's subcollection to another
 * @param oldDriverId - Current driver ID (where ride is stored)
 * @param newDriverId - New driver ID (where ride should be moved)
 * @param rideId - Ride document ID
 * @param docPath - Optional full document path of the old document
 */
export async function reassignRideToDriver(
  oldDriverId: string,
  newDriverId: string,
  rideId: string,
  docPath?: string
): Promise<{ success: boolean; error?: string }> {
  console.log('[Firestore] reassignRideToDriver called:', {
    oldDriverId,
    newDriverId,
    rideId,
    docPath,
  });

  try {
    // Get the old document reference
    const oldDocRef = docPath
      ? doc(db, docPath)
      : doc(db, 'drivers', oldDriverId, 'driver_rides', rideId);

    // Get the existing ride data
    const oldDocSnap = await getDoc(oldDocRef);
    if (!oldDocSnap.exists()) {
      console.error('[Firestore] Original ride document not found');
      return { success: false, error: 'Viaje no encontrado' };
    }

    const rideData = oldDocSnap.data() as FirestoreInDriverRide;
    console.log('[Firestore] Retrieved ride data, moving to new driver');

    // Create reference for new location
    const newDocRef = doc(db, 'drivers', newDriverId, 'driver_rides', rideId);

    // Use batch to ensure atomicity
    const batch = writeBatch(db);

    // Create document in new location with updated driver_id
    const updatedRideData = {
      ...rideData,
      driver_id: newDriverId,
    };
    // Remove client-side only field
    delete (updatedRideData as Record<string, unknown>)._docPath;

    batch.set(newDocRef, updatedRideData);

    // Delete from old location
    batch.delete(oldDocRef);

    // Commit the batch
    await batch.commit();
    console.log('[Firestore] Ride successfully moved to new driver');

    return { success: true };
  } catch (error) {
    console.error('[Firestore] Error reassigning ride:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Delete a single InDriver ride from Firestore
 * @param driverId - Driver ID (used if docPath not provided)
 * @param rideId - Ride document ID
 * @param docPath - Optional full document path (preferred, more reliable)
 */
export async function deleteInDriverRide(
  driverId: string,
  rideId: string,
  docPath?: string
): Promise<{ success: boolean; error?: string }> {
  console.log('[Firestore] deleteInDriverRide called:', { driverId, rideId, docPath });
  try {
    // Use the stored document path if available (more reliable), otherwise construct it
    const rideDocRef = docPath
      ? doc(db, docPath)
      : doc(db, 'drivers', driverId, 'driver_rides', rideId);
    console.log('[Firestore] Deleting document at path:', rideDocRef.path);

    await deleteDoc(rideDocRef);
    console.log('[Firestore] Delete successful');

    return { success: true };
  } catch (error) {
    console.error('[Firestore] Error deleting ride:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Delete ALL rides from ALL drivers
 * WARNING: This is a destructive operation! Only use in development/testing environments.
 * @returns Result with count of deleted rides
 */
export async function deleteAllRides(): Promise<{
  success: boolean;
  deletedCount: number;
  error?: string;
}> {
  console.log('[Firestore] deleteAllRides called - WARNING: Deleting all rides');

  try {
    // Use collection group query to get ALL rides across ALL drivers
    const ridesCollectionGroup = collectionGroup(db, 'driver_rides');
    const snapshot = await getDocs(ridesCollectionGroup);

    console.log('[Firestore] Found', snapshot.docs.length, 'rides to delete');

    if (snapshot.docs.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    // Delete in batches (Firestore batch limit is 500 operations)
    const BATCH_SIZE = 500;
    let deletedCount = 0;

    for (let i = 0; i < snapshot.docs.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const batchDocs = snapshot.docs.slice(i, i + BATCH_SIZE);

      batchDocs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      await batch.commit();
      deletedCount += batchDocs.length;
      console.log(
        `[Firestore] Deleted batch ${Math.floor(i / BATCH_SIZE) + 1}, total: ${deletedCount}`
      );
    }

    console.log('[Firestore] All rides deleted successfully, total:', deletedCount);
    return { success: true, deletedCount };
  } catch (error) {
    console.error('[Firestore] Error deleting all rides:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, deletedCount: 0, error: errorMsg };
  }
}
