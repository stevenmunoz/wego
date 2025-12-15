/**
 * Firestore vehicle service for WeGo
 */

import {
  collection,
  collectionGroup,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firestore';
import type {
  VehicleType,
  VehicleStatus,
  FuelType,
  VehicleCreateInput,
  VehicleUpdateInput,
} from '../types/vehicle.types';

/**
 * Firestore vehicle data structure
 */
export interface FirestoreVehicle {
  id: string;
  owner_id: string; // User who owns this vehicle
  driver_id: string; // Backward compatibility - same as owner_id
  current_driver_id?: string; // Currently assigned driver (optional)
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  vehicle_type: VehicleType;
  fuel_type: FuelType;
  passenger_capacity: number;
  luggage_capacity: number;
  accepts_pets: boolean;
  accepts_wheelchairs: boolean;
  has_child_seat: boolean;
  has_air_conditioning: boolean;
  soat_expiry: Timestamp | null;
  tecnomecanica_expiry: Timestamp | null;
  status: VehicleStatus;
  is_primary: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
  photo_url?: string;
  notes?: string;
}

// Collection path: vehicles/{vehicleId} (top-level collection)

/**
 * Get ALL vehicles across all drivers (admin only)
 * Uses collectionGroup to query both top-level and subcollection vehicles
 */
export async function getAllVehicles(): Promise<FirestoreVehicle[]> {
  // Use collectionGroup to get vehicles from both:
  // - Top-level: vehicles/{vehicleId}
  // - Subcollections: drivers/{driverId}/vehicles/{vehicleId}
  const vehiclesGroup = collectionGroup(db, 'vehicles');
  const q = query(vehiclesGroup, orderBy('created_at', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as FirestoreVehicle);
}

/**
 * Get all vehicles for an owner
 * Searches both top-level and subcollection for backward compatibility
 */
export async function getDriverVehicles(
  ownerId: string,
  options?: { status?: VehicleStatus }
): Promise<FirestoreVehicle[]> {
  // Query top-level collection (new structure)
  const topLevelCollection = collection(db, 'vehicles');
  let topLevelQuery = query(
    topLevelCollection,
    where('owner_id', '==', ownerId),
    orderBy('is_primary', 'desc'),
    orderBy('created_at', 'desc')
  );

  if (options?.status) {
    topLevelQuery = query(
      topLevelCollection,
      where('owner_id', '==', ownerId),
      where('status', '==', options.status),
      orderBy('is_primary', 'desc'),
      orderBy('created_at', 'desc')
    );
  }

  // Query subcollection (old structure: drivers/{driverId}/vehicles)
  const subCollection = collection(db, 'drivers', ownerId, 'vehicles');
  let subQuery = query(
    subCollection,
    orderBy('is_primary', 'desc'),
    orderBy('created_at', 'desc')
  );

  if (options?.status) {
    subQuery = query(
      subCollection,
      where('status', '==', options.status),
      orderBy('is_primary', 'desc'),
      orderBy('created_at', 'desc')
    );
  }

  // Fetch from both locations
  const [topLevelSnapshot, subSnapshot] = await Promise.all([
    getDocs(topLevelQuery),
    getDocs(subQuery),
  ]);

  // Combine results, deduplicating by id
  const vehicleMap = new Map<string, FirestoreVehicle>();

  // Add subcollection vehicles first (old data)
  subSnapshot.docs.forEach((doc) => {
    const data = doc.data() as FirestoreVehicle;
    vehicleMap.set(data.id, data);
  });

  // Add top-level vehicles (new data overwrites old if same id)
  topLevelSnapshot.docs.forEach((doc) => {
    const data = doc.data() as FirestoreVehicle;
    vehicleMap.set(data.id, data);
  });

  // Sort by is_primary desc, created_at desc
  return Array.from(vehicleMap.values()).sort((a, b) => {
    if (a.is_primary !== b.is_primary) {
      return a.is_primary ? -1 : 1;
    }
    return b.created_at.toMillis() - a.created_at.toMillis();
  });
}

/**
 * Get a single vehicle by ID
 */
export async function getVehicle(
  vehicleId: string
): Promise<FirestoreVehicle | null> {
  const vehicleRef = doc(db, 'vehicles', vehicleId);
  const snapshot = await getDoc(vehicleRef);

  if (!snapshot.exists()) return null;
  return snapshot.data() as FirestoreVehicle;
}

/**
 * Create a new vehicle
 */
export async function createVehicle(
  ownerId: string,
  input: VehicleCreateInput
): Promise<{ success: boolean; vehicleId?: string; error?: string }> {
  try {
    const vehiclesCollection = collection(db, 'vehicles');
    const vehicleRef = doc(vehiclesCollection);

    const now = Timestamp.now();
    const vehicle: FirestoreVehicle = {
      id: vehicleRef.id,
      owner_id: ownerId,
      driver_id: ownerId, // Backward compatibility
      plate: input.plate.toUpperCase().replace(/[^A-Z0-9]/g, ''),
      brand: input.brand,
      model: input.model,
      year: input.year,
      color: input.color,
      vehicle_type: input.vehicle_type,
      fuel_type: input.fuel_type,
      passenger_capacity: input.passenger_capacity,
      luggage_capacity: input.luggage_capacity ?? 2,
      accepts_pets: input.accepts_pets ?? false,
      accepts_wheelchairs: input.accepts_wheelchairs ?? false,
      has_child_seat: input.has_child_seat ?? false,
      has_air_conditioning: input.has_air_conditioning ?? true,
      soat_expiry: input.soat_expiry ? Timestamp.fromDate(new Date(input.soat_expiry)) : null,
      tecnomecanica_expiry: input.tecnomecanica_expiry
        ? Timestamp.fromDate(new Date(input.tecnomecanica_expiry))
        : null,
      status: 'active',
      is_primary: input.is_primary ?? false,
      created_at: now,
      updated_at: now,
      notes: input.notes,
    };

    await setDoc(vehicleRef, vehicle);

    return { success: true, vehicleId: vehicleRef.id };
  } catch (error) {
    console.error('[Firestore] Error creating vehicle:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Update an existing vehicle
 */
export async function updateVehicle(
  vehicleId: string,
  updates: VehicleUpdateInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const vehicleRef = doc(db, 'vehicles', vehicleId);

    const firestoreUpdates: Record<string, unknown> = {
      ...updates,
      updated_at: serverTimestamp(),
    };

    // Normalize plate if updated
    if (updates.plate) {
      firestoreUpdates.plate = updates.plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
    }

    // Convert date strings to Timestamps
    if (updates.soat_expiry !== undefined) {
      firestoreUpdates.soat_expiry = updates.soat_expiry
        ? Timestamp.fromDate(new Date(updates.soat_expiry))
        : null;
    }
    if (updates.tecnomecanica_expiry !== undefined) {
      firestoreUpdates.tecnomecanica_expiry = updates.tecnomecanica_expiry
        ? Timestamp.fromDate(new Date(updates.tecnomecanica_expiry))
        : null;
    }

    await updateDoc(vehicleRef, firestoreUpdates);

    return { success: true };
  } catch (error) {
    console.error('[Firestore] Error updating vehicle:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Delete a vehicle
 */
export async function deleteVehicle(
  vehicleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    await deleteDoc(vehicleRef);

    return { success: true };
  } catch (error) {
    console.error('[Firestore] Error deleting vehicle:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Set a vehicle as primary (and unset others)
 */
export async function setVehicleAsPrimary(
  ownerId: string,
  vehicleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get all vehicles for this owner
    const vehicles = await getDriverVehicles(ownerId);

    // Update all vehicles
    for (const vehicle of vehicles) {
      const vehicleRef = doc(db, 'vehicles', vehicle.id);
      await updateDoc(vehicleRef, {
        is_primary: vehicle.id === vehicleId,
        updated_at: serverTimestamp(),
      });
    }

    return { success: true };
  } catch (error) {
    console.error('[Firestore] Error setting primary vehicle:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Reassign a vehicle to a different driver (admin only)
 * This moves the vehicle document from one driver's subcollection to another
 */
export async function reassignVehicle(
  currentDriverId: string,
  newDriverId: string,
  vehicleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the vehicle data from current location
    const currentVehicleRef = doc(db, 'drivers', currentDriverId, 'vehicles', vehicleId);
    const vehicleSnapshot = await getDoc(currentVehicleRef);

    if (!vehicleSnapshot.exists()) {
      return { success: false, error: 'Vehículo no encontrado' };
    }

    const vehicleData = vehicleSnapshot.data() as FirestoreVehicle;

    // Create in new location with updated driver_id
    const newVehicleRef = doc(db, 'drivers', newDriverId, 'vehicles', vehicleId);
    await setDoc(newVehicleRef, {
      ...vehicleData,
      driver_id: newDriverId,
      is_primary: false, // Reset primary status when reassigning
      updated_at: serverTimestamp(),
    });

    // Delete from old location
    await deleteDoc(currentVehicleRef);

    return { success: true };
  } catch (error) {
    console.error('[Firestore] Error reassigning vehicle:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}
