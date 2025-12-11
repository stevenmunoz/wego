/**
 * Hook for fetching driver rides from Firebase
 */

import { useState, useEffect, useCallback } from 'react';
import { getInDriverRides, type FirestoreInDriverRide } from '@/core/firebase';

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
  }, [driverId, options?.startDate, options?.endDate, options?.status]);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  return {
    rides,
    isLoading,
    error,
    refetch: fetchRides,
  };
};
