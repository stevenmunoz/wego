/**
 * Firestore vehicle service for WeGo
 */

import {
  collection,
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
  driver_id: string;
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

// Collection path: drivers/{driverId}/vehicles/{vehicleId}

/**
 * Get all vehicles for a driver
 */
export async function getDriverVehicles(
  driverId: string,
  options?: { status?: VehicleStatus }
): Promise<FirestoreVehicle[]> {
  const vehiclesCollection = collection(db, 'drivers', driverId, 'vehicles');

  let q = query(vehiclesCollection, orderBy('is_primary', 'desc'), orderBy('created_at', 'desc'));

  if (options?.status) {
    q = query(vehiclesCollection, where('status', '==', options.status), orderBy('is_primary', 'desc'), orderBy('created_at', 'desc'));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as FirestoreVehicle);
}

/**
 * Get a single vehicle by ID
 */
export async function getVehicle(
  driverId: string,
  vehicleId: string
): Promise<FirestoreVehicle | null> {
  const vehicleRef = doc(db, 'drivers', driverId, 'vehicles', vehicleId);
  const snapshot = await getDoc(vehicleRef);

  if (!snapshot.exists()) return null;
  return snapshot.data() as FirestoreVehicle;
}

/**
 * Create a new vehicle
 */
export async function createVehicle(
  driverId: string,
  input: VehicleCreateInput
): Promise<{ success: boolean; vehicleId?: string; error?: string }> {
  try {
    const vehiclesCollection = collection(db, 'drivers', driverId, 'vehicles');
    const vehicleRef = doc(vehiclesCollection);

    const now = Timestamp.now();
    const vehicle: FirestoreVehicle = {
      id: vehicleRef.id,
      driver_id: driverId,
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
  driverId: string,
  vehicleId: string,
  updates: VehicleUpdateInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const vehicleRef = doc(db, 'drivers', driverId, 'vehicles', vehicleId);

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
  driverId: string,
  vehicleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const vehicleRef = doc(db, 'drivers', driverId, 'vehicles', vehicleId);
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
  driverId: string,
  vehicleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get all vehicles
    const vehicles = await getDriverVehicles(driverId);

    // Update all vehicles
    for (const vehicle of vehicles) {
      const vehicleRef = doc(db, 'drivers', driverId, 'vehicles', vehicle.id);
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
