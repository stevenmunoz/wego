/**
 * Hook for fetching and updating driver rides from Firebase
 */

import { useState, useEffect, useCallback } from 'react';
import { getInDriverRides, updateInDriverRide, type FirestoreInDriverRide } from '@/core/firebase';

interface UseDriverRidesOptions {
  startDate?: Date;
  endDate?: Date;
  status?: string;
}

interface UseDriverRidesReturn {
  rides: FirestoreInDriverRide[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateRide: (rideId: string, updates: Partial<FirestoreInDriverRide>) => Promise<void>;
}

export const useDriverRides = (
  driverId: string | undefined,
  options?: UseDriverRidesOptions
): UseDriverRidesReturn => {
  const [rides, setRides] = useState<FirestoreInDriverRide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRides = useCallback(async () => {
    if (!driverId) {
      setRides([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetchedRides = await getInDriverRides(driverId, options);
      setRides(fetchedRides);
    } catch (err) {
      console.error('[useDriverRides] Error fetching rides:', err);
      const message = err instanceof Error ? err.message : 'Error al cargar los viajes';
      setError(message);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId, options?.startDate, options?.endDate, options?.status]);

  const updateRide = useCallback(
    async (rideId: string, updates: Partial<FirestoreInDriverRide>) => {
      if (!driverId) {
        setError('Usuario no autenticado');
        return;
      }

      // Optimistically update local state first
      setRides((prevRides) =>
        prevRides.map((ride) => (ride.id === rideId ? { ...ride, ...updates } : ride))
      );

      try {
        const result = await updateInDriverRide(driverId, rideId, updates);
        if (!result.success) {
          // Revert on error
          setError(result.error || 'Error al actualizar el viaje');
          await fetchRides(); // Refetch to get correct state
        }
      } catch (err) {
        console.error('[useDriverRides] Error updating ride:', err);
        const message = err instanceof Error ? err.message : 'Error al actualizar el viaje';
        setError(message);
        await fetchRides(); // Refetch to get correct state
      }
    },
    [driverId, fetchRides]
  );

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  return {
    rides,
    isLoading,
    error,
    refetch: fetchRides,
    updateRide,
  };
};
