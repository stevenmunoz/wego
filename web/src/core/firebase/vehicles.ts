/**
 * Firestore vehicle service for WeGo
 *
 * Unified vehicle collection: vehicles/{vehicleId}
 * - owner_id: who owns/pays for the vehicle
 * - assigned_driver_id: who currently drives (optional)
 * - Income/expenses stored as subcollections
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
  writeBatch,
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
  owner_id: string;
  assigned_driver_id?: string;
  weekly_rental_amount?: number;
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
  soat_document_url?: string;
  tecnomecanica_document_url?: string;
  status: VehicleStatus;
  is_primary: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
  photo_url?: string;
  notes?: string;
}

// Collection path: vehicles/{vehicleId}

/**
 * Get ALL vehicles (admin only)
 */
export async function getAllVehicles(): Promise<FirestoreVehicle[]> {
  const vehiclesCollection = collection(db, 'vehicles');
  const q = query(vehiclesCollection, orderBy('created_at', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as FirestoreVehicle);
}

/**
 * Get all vehicles for an owner
 */
export async function getOwnerVehicles(
  ownerId: string,
  options?: { status?: VehicleStatus }
): Promise<FirestoreVehicle[]> {
  const vehiclesCollection = collection(db, 'vehicles');

  let q = query(
    vehiclesCollection,
    where('owner_id', '==', ownerId),
    orderBy('is_primary', 'desc'),
    orderBy('created_at', 'desc')
  );

  if (options?.status) {
    q = query(
      vehiclesCollection,
      where('owner_id', '==', ownerId),
      where('status', '==', options.status),
      orderBy('is_primary', 'desc'),
      orderBy('created_at', 'desc')
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as FirestoreVehicle);
}

/**
 * Get a single vehicle by ID
 */
export async function getVehicle(vehicleId: string): Promise<FirestoreVehicle | null> {
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

    // Add optional fleet management fields
    if (input.weekly_rental_amount !== undefined) {
      vehicle.weekly_rental_amount = input.weekly_rental_amount;
    }
    if (input.assigned_driver_id) {
      vehicle.assigned_driver_id = input.assigned_driver_id;
    }

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

    // Remove file objects from updates (handled separately)
    delete firestoreUpdates.imageFile;
    delete firestoreUpdates.soatFile;
    delete firestoreUpdates.tecnomecanicaFile;

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
 * Set a vehicle as primary (and unset others for the same owner)
 */
export async function setVehicleAsPrimary(
  ownerId: string,
  vehicleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const vehicles = await getOwnerVehicles(ownerId);
    const batch = writeBatch(db);

    for (const vehicle of vehicles) {
      const vehicleRef = doc(db, 'vehicles', vehicle.id);
      batch.update(vehicleRef, {
        is_primary: vehicle.id === vehicleId,
        updated_at: serverTimestamp(),
      });
    }

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('[Firestore] Error setting primary vehicle:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Assign a driver to a vehicle
 */
export async function assignDriver(
  vehicleId: string,
  driverId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    await updateDoc(vehicleRef, {
      assigned_driver_id: driverId,
      updated_at: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('[Firestore] Error assigning driver:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Unassign the current driver from a vehicle
 */
export async function unassignDriver(
  vehicleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    await updateDoc(vehicleRef, {
      assigned_driver_id: null,
      updated_at: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('[Firestore] Error unassigning driver:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}
