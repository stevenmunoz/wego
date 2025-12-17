/**
 * useDriverBySlug Hook
 *
 * Fetches driver data by unique slug for public form validation
 */

import { useState, useEffect, useCallback } from 'react';
import type { Driver } from '../types';
import { getDriverBySlug } from '../services';

interface UseDriverBySlugReturn {
  driver: Driver | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDriverBySlug(slug: string | undefined): UseDriverBySlugReturn {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDriver = useCallback(async () => {
    if (!slug) {
      setIsLoading(false);
      setError('No se proporciono un enlace valido');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const driverData = await getDriverBySlug(slug);

      if (driverData) {
        setDriver(driverData);
      } else {
        setError('Este enlace no es valido o el conductor no esta activo.');
      }
    } catch (err) {
      console.error('[useDriverBySlug] Error:', err);
      setError('Error de conexion. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchDriver();
  }, [fetchDriver]);

  return {
    driver,
    isLoading,
    error,
    refetch: fetchDriver,
  };
}
