/**
 * Hook for fetching all vehicles across all drivers (admin only)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getAllVehicles,
  getAllDrivers,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  setVehicleAsPrimary,
  reassignVehicle,
  type FirestoreVehicle,
  type FirestoreDriver,
} from '@/core/firebase';
import type { VehicleCreateInput, VehicleUpdateInput } from '@/core/types';

export interface VehicleWithDriver extends FirestoreVehicle {
  driver_name?: string;
}

interface UseAllVehiclesReturn {
  vehicles: VehicleWithDriver[];
  drivers: FirestoreDriver[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addVehicle: (
    driverId: string,
    input: VehicleCreateInput
  ) => Promise<{ success: boolean; vehicleId?: string; error?: string }>;
  updateVehicle: (
    driverId: string,
    vehicleId: string,
    updates: VehicleUpdateInput
  ) => Promise<{ success: boolean; error?: string }>;
  deleteVehicle: (
    driverId: string,
    vehicleId: string
  ) => Promise<{ success: boolean; error?: string }>;
  setPrimaryVehicle: (
    driverId: string,
    vehicleId: string
  ) => Promise<{ success: boolean; error?: string }>;
  reassignVehicle: (
    currentDriverId: string,
    newDriverId: string,
    vehicleId: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export const useAllVehicles = (): UseAllVehiclesReturn => {
  const [vehicles, setVehicles] = useState<VehicleWithDriver[]>([]);
  const [drivers, setDrivers] = useState<FirestoreDriver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all vehicles and drivers in parallel
      const [allVehicles, allDrivers] = await Promise.all([getAllVehicles(), getAllDrivers()]);

      // Create a map of driver_id -> driver_name for quick lookup
      const driverMap = new Map<string, string>();
      allDrivers.forEach((driver) => {
        driverMap.set(driver.id, driver.name);
      });

      // Enrich vehicles with driver names
      const enrichedVehicles: VehicleWithDriver[] = allVehicles.map((vehicle) => ({
        ...vehicle,
        driver_name: driverMap.get(vehicle.driver_id) || 'Sin asignar',
      }));

      setVehicles(enrichedVehicles);
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
    async (driverId: string, input: VehicleCreateInput) => {
      const result = await createVehicle(driverId, input);
      if (result.success) {
        await fetchData();
      }
      return result;
    },
    [fetchData]
  );

  const handleUpdateVehicle = useCallback(
    async (_driverId: string, vehicleId: string, updates: VehicleUpdateInput) => {
      const result = await updateVehicle(vehicleId, updates);
      if (result.success) {
        await fetchData();
      }
      return result;
    },
    [fetchData]
  );

  const handleDeleteVehicle = useCallback(
    async (_driverId: string, vehicleId: string) => {
      const result = await deleteVehicle(vehicleId);
      if (result.success) {
        await fetchData();
      }
      return result;
    },
    [fetchData]
  );

  const handleSetPrimaryVehicle = useCallback(
    async (driverId: string, vehicleId: string) => {
      const result = await setVehicleAsPrimary(driverId, vehicleId);
      if (result.success) {
        await fetchData();
      }
      return result;
    },
    [fetchData]
  );

  const handleReassignVehicle = useCallback(
    async (currentDriverId: string, newDriverId: string, vehicleId: string) => {
      const result = await reassignVehicle(currentDriverId, newDriverId, vehicleId);
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
    reassignVehicle: handleReassignVehicle,
  };
};
