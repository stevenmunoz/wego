/**
 * Hook for fetching all rides from all drivers (admin only)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getAllDrivers,
  updateInDriverRide,
  getAllVehicles,
  type FirestoreInDriverRide,
  type DriverWithUser,
  type FirestoreVehicle,
} from '@/core/firebase';
import { getAllDriversRides } from '@/core/firebase/firestore';

interface UseAdminRidesOptions {
  startDate?: Date;
  endDate?: Date;
  status?: string;
}

export type RideWithDriver = FirestoreInDriverRide & {
  driver_name?: string;
  vehicle_plate?: string;
};

interface UseAdminRidesReturn {
  rides: RideWithDriver[];
  drivers: DriverWithUser[];
  vehicles: FirestoreVehicle[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateRide: (rideId: string, updates: Partial<FirestoreInDriverRide>) => Promise<void>;
}

export const useAdminRides = (options?: UseAdminRidesOptions): UseAdminRidesReturn => {
  const [rides, setRides] = useState<RideWithDriver[]>([]);
  const [drivers, setDrivers] = useState<DriverWithUser[]>([]);
  const [vehicles, setVehicles] = useState<FirestoreVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs to always access latest state (avoids stale closure issues in callbacks)
  const ridesRef = useRef<RideWithDriver[]>(rides);
  const vehiclesRef = useRef<FirestoreVehicle[]>(vehicles);
  ridesRef.current = rides;
  vehiclesRef.current = vehicles;

  const fetchRides = useCallback(async () => {
    console.log('[useAdminRides] Starting fetch with options:', options);
    setIsLoading(true);
    setError(null);

    try {
      // Fetch drivers, vehicles, and rides in parallel
      const [fetchedDrivers, fetchedVehicles, fetchedRides] = await Promise.all([
        getAllDrivers(),
        getAllVehicles(),
        getAllDriversRides(options),
      ]);

      console.log('[useAdminRides] Fetched:', {
        drivers: fetchedDrivers.length,
        vehicles: fetchedVehicles.length,
        rides: fetchedRides.length,
      });

      // Create maps for lookups
      // vehicle_id -> { plate, owner_id }
      const vehicleMap = new Map<string, { plate: string; owner_id: string }>();
      fetchedVehicles.forEach((vehicle: FirestoreVehicle) => {
        vehicleMap.set(vehicle.id, { plate: vehicle.plate, owner_id: vehicle.owner_id });
      });

      // driver_id -> name
      const driverNameMap = new Map<string, string>();
      fetchedDrivers.forEach((driver: DriverWithUser) => {
        driverNameMap.set(driver.id, driver.name);
      });

      // Enrich rides with vehicle plate and driver name (from vehicle owner)
      const enrichedRides: RideWithDriver[] = fetchedRides.map((ride) => {
        const vehicleInfo = ride.vehicle_id ? vehicleMap.get(ride.vehicle_id) : undefined;
        // Get driver name from vehicle owner, fallback to ride's driver_name
        const driverName = vehicleInfo?.owner_id
          ? driverNameMap.get(vehicleInfo.owner_id)
          : undefined;

        return {
          ...ride,
          vehicle_plate: vehicleInfo?.plate,
          driver_name: driverName || ride.driver_name,
        };
      });

      setDrivers(fetchedDrivers);
      setVehicles(fetchedVehicles);
      setRides(enrichedRides);
    } catch (err) {
      console.error('[useAdminRides] Error fetching rides:', err);
      const message = err instanceof Error ? err.message : 'Error al cargar los viajes';
      setError(message);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options?.startDate, options?.endDate, options?.status]);

  const updateRide = useCallback(
    async (rideId: string, updates: Partial<FirestoreInDriverRide>) => {
      console.log('[useAdminRides] updateRide called:', { rideId, updates });

      // Use refs to get latest state (avoids stale closure issues)
      const currentRides = ridesRef.current;
      const currentVehicles = vehiclesRef.current;

      // Find the ride to get the driver_id
      const ride = currentRides.find((r) => r.id === rideId);
      if (!ride) {
        console.log('[useAdminRides] Ride not found in local state');
        setError('Viaje no encontrado');
        return;
      }

      console.log('[useAdminRides] Found ride, driver_id:', ride.driver_id, '_docPath:', ride._docPath);

      // Build optimistic update with derived fields
      const optimisticUpdate: Partial<RideWithDriver> = { ...updates };

      // If vehicle_id is being updated, also derive vehicle_plate
      if ('vehicle_id' in updates) {
        if (updates.vehicle_id) {
          const vehicle = currentVehicles.find((v) => v.id === updates.vehicle_id);
          optimisticUpdate.vehicle_plate = vehicle?.plate;
          console.log('[useAdminRides] Derived vehicle_plate:', vehicle?.plate);
        } else {
          // Clearing vehicle
          optimisticUpdate.vehicle_plate = undefined;
        }
      }

      // Optimistically update local state first
      setRides((prevRides) =>
        prevRides.map((r) => (r.id === rideId ? { ...r, ...optimisticUpdate } : r))
      );

      try {
        console.log('[useAdminRides] Calling updateInDriverRide...');
        // Pass _docPath for reliable document targeting (handles rides stored in different locations)
        const result = await updateInDriverRide(ride.driver_id, rideId, updates, ride._docPath);
        console.log('[useAdminRides] updateInDriverRide result:', result);
        if (!result.success) {
          // Revert on error
          setError(result.error || 'Error al actualizar el viaje');
          await fetchRides(); // Refetch to get correct state
        }
      } catch (err) {
        console.error('[useAdminRides] Error updating ride:', err);
        const message = err instanceof Error ? err.message : 'Error al actualizar el viaje';
        setError(message);
        await fetchRides(); // Refetch to get correct state
      }
    },
    [fetchRides]
  );

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  return {
    rides,
    drivers,
    vehicles,
    isLoading,
    error,
    refetch: fetchRides,
    updateRide,
  };
};
