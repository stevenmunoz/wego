/**
 * Hook for fetching and managing vehicles from Firebase
 *
 * Unified vehicle model:
 * - owner_id: who owns/pays for the vehicle
 * - assigned_driver_id: who currently drives (optional)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getOwnerVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  setVehicleAsPrimary,
  type FirestoreVehicle,
} from '@/core/firebase';
import type { VehicleCreateInput, VehicleUpdateInput, VehicleStatus } from '@/core/types';

interface UseDriverVehiclesOptions {
  status?: VehicleStatus;
}

interface UseDriverVehiclesReturn {
  vehicles: FirestoreVehicle[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addVehicle: (
    input: VehicleCreateInput
  ) => Promise<{ success: boolean; vehicleId?: string; error?: string }>;
  updateVehicle: (vehicleId: string, updates: VehicleUpdateInput) => Promise<void>;
  deleteVehicle: (vehicleId: string) => Promise<void>;
  setPrimaryVehicle: (vehicleId: string) => Promise<void>;
}

export const useDriverVehicles = (
  ownerId: string | undefined,
  options?: UseDriverVehiclesOptions
): UseDriverVehiclesReturn => {
  const [vehicles, setVehicles] = useState<FirestoreVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    if (!ownerId) {
      setVehicles([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetchedVehicles = await getOwnerVehicles(ownerId, options);
      setVehicles(fetchedVehicles);
    } catch (err) {
      console.error('[useDriverVehicles] Error fetching vehicles:', err);
      const message = err instanceof Error ? err.message : 'Error al cargar los vehículos';
      setError(message);
    } finally {
      setIsLoading(false);
    }
    // Dependencies use individual properties rather than the options object to prevent
    // unnecessary re-fetches when caller creates a new options object reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId, options?.status]);

  const handleAddVehicle = useCallback(
    async (input: VehicleCreateInput) => {
      if (!ownerId) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      const result = await createVehicle(ownerId, input);
      if (result.success) {
        await fetchVehicles();
      }
      return result;
    },
    [ownerId, fetchVehicles]
  );

  const handleUpdateVehicle = useCallback(
    async (vehicleId: string, updates: VehicleUpdateInput) => {
      if (!ownerId) {
        setError('Usuario no autenticado');
        return;
      }

      // Optimistic update - build safe updates excluding date fields that have type mismatch
      setVehicles((prev) =>
        prev.map((v) => {
          if (v.id !== vehicleId) return v;
          const safeUpdates: Partial<FirestoreVehicle> = {};
          if (updates.plate !== undefined) safeUpdates.plate = updates.plate;
          if (updates.brand !== undefined) safeUpdates.brand = updates.brand;
          if (updates.model !== undefined) safeUpdates.model = updates.model;
          if (updates.year !== undefined) safeUpdates.year = updates.year;
          if (updates.color !== undefined) safeUpdates.color = updates.color;
          if (updates.vehicle_type !== undefined) safeUpdates.vehicle_type = updates.vehicle_type;
          if (updates.fuel_type !== undefined) safeUpdates.fuel_type = updates.fuel_type;
          if (updates.passenger_capacity !== undefined)
            safeUpdates.passenger_capacity = updates.passenger_capacity;
          if (updates.luggage_capacity !== undefined)
            safeUpdates.luggage_capacity = updates.luggage_capacity;
          if (updates.accepts_pets !== undefined) safeUpdates.accepts_pets = updates.accepts_pets;
          if (updates.accepts_wheelchairs !== undefined)
            safeUpdates.accepts_wheelchairs = updates.accepts_wheelchairs;
          if (updates.has_child_seat !== undefined)
            safeUpdates.has_child_seat = updates.has_child_seat;
          if (updates.has_air_conditioning !== undefined)
            safeUpdates.has_air_conditioning = updates.has_air_conditioning;
          if (updates.status !== undefined) safeUpdates.status = updates.status;
          if (updates.is_primary !== undefined) safeUpdates.is_primary = updates.is_primary;
          if (updates.notes !== undefined) safeUpdates.notes = updates.notes;
          return { ...v, ...safeUpdates };
        })
      );

      try {
        const result = await updateVehicle(vehicleId, updates);
        if (!result.success) {
          setError(result.error || 'Error al actualizar el vehículo');
          await fetchVehicles();
        }
      } catch (err) {
        console.error('[useDriverVehicles] Error updating vehicle:', err);
        const message = err instanceof Error ? err.message : 'Error al actualizar el vehículo';
        setError(message);
        await fetchVehicles();
      }
    },
    [ownerId, fetchVehicles]
  );

  const handleDeleteVehicle = useCallback(
    async (vehicleId: string) => {
      if (!ownerId) {
        setError('Usuario no autenticado');
        return;
      }

      // Optimistic removal
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));

      try {
        const result = await deleteVehicle(vehicleId);
        if (!result.success) {
          setError(result.error || 'Error al eliminar el vehículo');
          await fetchVehicles();
        }
      } catch (err) {
        console.error('[useDriverVehicles] Error deleting vehicle:', err);
        const message = err instanceof Error ? err.message : 'Error al eliminar el vehículo';
        setError(message);
        await fetchVehicles();
      }
    },
    [ownerId, fetchVehicles]
  );

  const handleSetPrimaryVehicle = useCallback(
    async (vehicleId: string) => {
      if (!ownerId) {
        setError('Usuario no autenticado');
        return;
      }

      // Optimistic update
      setVehicles((prev) => prev.map((v) => ({ ...v, is_primary: v.id === vehicleId })));

      try {
        const result = await setVehicleAsPrimary(ownerId, vehicleId);
        if (!result.success) {
          setError(result.error || 'Error al establecer vehículo principal');
          await fetchVehicles();
        }
      } catch (err) {
        console.error('[useDriverVehicles] Error setting primary:', err);
        const message =
          err instanceof Error ? err.message : 'Error al establecer vehículo principal';
        setError(message);
        await fetchVehicles();
      }
    },
    [ownerId, fetchVehicles]
  );

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  return {
    vehicles,
    isLoading,
    error,
    refetch: fetchVehicles,
    addVehicle: handleAddVehicle,
    updateVehicle: handleUpdateVehicle,
    deleteVehicle: handleDeleteVehicle,
    setPrimaryVehicle: handleSetPrimaryVehicle,
  };
};
