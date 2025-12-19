/**
 * Hook for fetching all vehicles across all owners (admin only)
 *
 * Unified vehicle model:
 * - owner_id: who owns/pays for the vehicle
 * - assigned_driver_id: who currently drives (optional)
 * - Driver names are looked up client-side from the drivers list
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getAllVehicles,
  getAllDrivers,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  setVehicleAsPrimary,
  assignDriver,
  unassignDriver,
  type FirestoreVehicle,
  type DriverWithUser,
} from '@/core/firebase';
import type { VehicleCreateInput, VehicleUpdateInput } from '@/core/types';

interface UseAllVehiclesReturn {
  vehicles: FirestoreVehicle[];
  drivers: DriverWithUser[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addVehicle: (
    ownerId: string,
    input: VehicleCreateInput
  ) => Promise<{ success: boolean; vehicleId?: string; error?: string }>;
  updateVehicle: (
    vehicleId: string,
    updates: VehicleUpdateInput
  ) => Promise<{ success: boolean; error?: string }>;
  deleteVehicle: (vehicleId: string) => Promise<{ success: boolean; error?: string }>;
  setPrimaryVehicle: (
    ownerId: string,
    vehicleId: string
  ) => Promise<{ success: boolean; error?: string }>;
  assignDriver: (
    vehicleId: string,
    driverId: string
  ) => Promise<{ success: boolean; error?: string }>;
  unassignDriver: (vehicleId: string) => Promise<{ success: boolean; error?: string }>;
}

export const useAllVehicles = (): UseAllVehiclesReturn => {
  const [vehicles, setVehicles] = useState<FirestoreVehicle[]>([]);
  const [drivers, setDrivers] = useState<DriverWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all vehicles and drivers in parallel
      const [allVehicles, allDrivers] = await Promise.all([getAllVehicles(), getAllDrivers()]);

      setVehicles(allVehicles);
      setDrivers(allDrivers);
    } catch (err) {
      console.error('[useAllVehicles] Error fetching data:', err);
      const message = err instanceof Error ? err.message : 'Error al cargar los vehículos';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAddVehicle = useCallback(
    async (ownerId: string, input: VehicleCreateInput) => {
      const result = await createVehicle(ownerId, input);
      if (result.success) {
        await fetchData();
      }
      return result;
    },
    [fetchData]
  );

  const handleUpdateVehicle = useCallback(
    async (vehicleId: string, updates: VehicleUpdateInput) => {
      const result = await updateVehicle(vehicleId, updates);
      if (result.success) {
        await fetchData();
      }
      return result;
    },
    [fetchData]
  );

  const handleDeleteVehicle = useCallback(
    async (vehicleId: string) => {
      const result = await deleteVehicle(vehicleId);
      if (result.success) {
        await fetchData();
      }
      return result;
    },
    [fetchData]
  );

  const handleSetPrimaryVehicle = useCallback(
    async (ownerId: string, vehicleId: string) => {
      const result = await setVehicleAsPrimary(ownerId, vehicleId);
      if (result.success) {
        await fetchData();
      }
      return result;
    },
    [fetchData]
  );

  const handleAssignDriver = useCallback(
    async (vehicleId: string, driverId: string) => {
      const result = await assignDriver(vehicleId, driverId);
      if (result.success) {
        await fetchData();
      }
      return result;
    },
    [fetchData]
  );

  const handleUnassignDriver = useCallback(
    async (vehicleId: string) => {
      const result = await unassignDriver(vehicleId);
      if (result.success) {
        await fetchData();
      }
      return result;
    },
    [fetchData]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    vehicles,
    drivers,
    isLoading,
    error,
    refetch: fetchData,
    addVehicle: handleAddVehicle,
    updateVehicle: handleUpdateVehicle,
    deleteVehicle: handleDeleteVehicle,
    setPrimaryVehicle: handleSetPrimaryVehicle,
    assignDriver: handleAssignDriver,
    unassignDriver: handleUnassignDriver,
  };
};
