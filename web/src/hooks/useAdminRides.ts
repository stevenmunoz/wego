/**
 * Hook for fetching all rides from all drivers (admin only)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getAllDrivers,
  updateInDriverRide,
  reassignRideToDriver,
  deleteInDriverRide,
  deleteAllRides as deleteAllRidesFromFirestore,
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
  isDeleting: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateRide: (rideId: string, updates: Partial<FirestoreInDriverRide>) => Promise<void>;
  deleteRide: (rideId: string) => Promise<void>;
  deleteAllRides: () => Promise<{ success: boolean; deletedCount: number }>;
}

export const useAdminRides = (options?: UseAdminRidesOptions): UseAdminRidesReturn => {
  const [rides, setRides] = useState<RideWithDriver[]>([]);
  const [drivers, setDrivers] = useState<DriverWithUser[]>([]);
  const [vehicles, setVehicles] = useState<FirestoreVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
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

      // Enrich rides with vehicle plate and driver name
      const enrichedRides: RideWithDriver[] = fetchedRides.map((ride) => {
        const vehicleInfo = ride.vehicle_id ? vehicleMap.get(ride.vehicle_id) : undefined;
        // Get driver name from ride's driver_id (the actual driver who did the ride)
        const driverName = ride.driver_id ? driverNameMap.get(ride.driver_id) : undefined;

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
    // Dependencies use individual properties rather than the options object to prevent
    // unnecessary re-fetches when caller creates a new options object reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options?.startDate, options?.endDate, options?.status]);

  const updateRide = useCallback(
    async (rideId: string, updates: Partial<FirestoreInDriverRide>) => {
      console.log('[useAdminRides] updateRide called:', { rideId, updates });

      // Use refs to get latest state (avoids stale closure issues)
      const currentRides = ridesRef.current;
      const currentVehicles = vehiclesRef.current;
      const currentDrivers = drivers;

      // Find the ride to get the driver_id
      const ride = currentRides.find((r) => r.id === rideId);
      if (!ride) {
        console.log('[useAdminRides] Ride not found in local state');
        setError('Viaje no encontrado');
        return;
      }

      console.log(
        '[useAdminRides] Found ride, driver_id:',
        ride.driver_id,
        '_docPath:',
        ride._docPath
      );

      // Check if driver_id is being changed
      const isDriverChange =
        'driver_id' in updates &&
        updates.driver_id !== undefined &&
        updates.driver_id !== ride.driver_id;

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

      // If driver is being changed, also derive driver_name
      if (isDriverChange && updates.driver_id) {
        const newDriver = currentDrivers.find((d) => d.id === updates.driver_id);
        optimisticUpdate.driver_name = newDriver?.name;
        console.log('[useAdminRides] Derived driver_name:', newDriver?.name);
      }

      // Optimistically update local state first
      setRides((prevRides) =>
        prevRides.map((r) => (r.id === rideId ? { ...r, ...optimisticUpdate } : r))
      );

      try {
        if (isDriverChange && updates.driver_id) {
          // Driver is being changed - need to move the document to new driver's subcollection
          console.log('[useAdminRides] Driver change detected, calling reassignRideToDriver...');
          const reassignResult = await reassignRideToDriver(
            ride.driver_id,
            updates.driver_id,
            rideId,
            ride._docPath
          );
          console.log('[useAdminRides] reassignRideToDriver result:', reassignResult);

          if (!reassignResult.success) {
            setError(reassignResult.error || 'Error al reasignar el viaje');
            await fetchRides(); // Refetch to get correct state
            return;
          }

          // If there are other updates besides driver_id, apply them to the new location
          const otherUpdates = { ...updates };
          delete otherUpdates.driver_id;

          if (Object.keys(otherUpdates).length > 0) {
            console.log(
              '[useAdminRides] Applying additional updates to new location:',
              otherUpdates
            );
            const newDocPath = `drivers/${updates.driver_id}/driver_rides/${rideId}`;
            const updateResult = await updateInDriverRide(
              updates.driver_id,
              rideId,
              otherUpdates,
              newDocPath
            );
            if (!updateResult.success) {
              setError(updateResult.error || 'Error al actualizar el viaje');
              await fetchRides();
              return;
            }
          }

          console.log('[useAdminRides] Driver reassignment completed successfully');
        } else {
          // Normal update (no driver change)
          console.log('[useAdminRides] Calling updateInDriverRide...');
          // Pass _docPath for reliable document targeting (handles rides stored in different locations)
          const result = await updateInDriverRide(ride.driver_id, rideId, updates, ride._docPath);
          console.log('[useAdminRides] updateInDriverRide result:', result);
          if (!result.success) {
            // Revert on error
            setError(result.error || 'Error al actualizar el viaje');
            await fetchRides(); // Refetch to get correct state
          }
        }
      } catch (err) {
        console.error('[useAdminRides] Error updating ride:', err);
        const message = err instanceof Error ? err.message : 'Error al actualizar el viaje';
        setError(message);
        await fetchRides(); // Refetch to get correct state
      }
    },
    [fetchRides, drivers]
  );

  const deleteRide = useCallback(
    async (rideId: string) => {
      console.log('[useAdminRides] deleteRide called:', { rideId });

      // Use refs to get latest state
      const currentRides = ridesRef.current;

      // Find the ride to get the driver_id and docPath
      const ride = currentRides.find((r) => r.id === rideId);
      if (!ride) {
        console.log('[useAdminRides] Ride not found in local state');
        setError('Viaje no encontrado');
        return;
      }

      console.log(
        '[useAdminRides] Found ride, driver_id:',
        ride.driver_id,
        '_docPath:',
        ride._docPath
      );

      // Optimistically remove from local state
      setRides((prevRides) => prevRides.filter((r) => r.id !== rideId));

      try {
        const result = await deleteInDriverRide(ride.driver_id, rideId, ride._docPath);
        console.log('[useAdminRides] deleteInDriverRide result:', result);

        if (!result.success) {
          // Revert on error
          setError(result.error || 'Error al eliminar el viaje');
          await fetchRides(); // Refetch to get correct state
        }
      } catch (err) {
        console.error('[useAdminRides] Error deleting ride:', err);
        const message = err instanceof Error ? err.message : 'Error al eliminar el viaje';
        setError(message);
        await fetchRides(); // Refetch to get correct state
      }
    },
    [fetchRides]
  );

  const deleteAllRides = useCallback(async (): Promise<{ success: boolean; deletedCount: number }> => {
    console.log('[useAdminRides] deleteAllRides called');
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteAllRidesFromFirestore();
      console.log('[useAdminRides] deleteAllRides result:', result);

      if (result.success) {
        // Clear local state
        setRides([]);
      } else {
        setError(result.error || 'Error al eliminar todos los viajes');
      }

      return { success: result.success, deletedCount: result.deletedCount };
    } catch (err) {
      console.error('[useAdminRides] Error deleting all rides:', err);
      const message = err instanceof Error ? err.message : 'Error al eliminar todos los viajes';
      setError(message);
      return { success: false, deletedCount: 0 };
    } finally {
      setIsDeleting(false);
    }
  }, []);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  return {
    rides,
    drivers,
    vehicles,
    isLoading,
    isDeleting,
    error,
    refetch: fetchRides,
    updateRide,
    deleteRide,
    deleteAllRides,
  };
};
