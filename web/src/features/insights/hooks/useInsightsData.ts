/**
 * useInsightsData Hook
 *
 * Fetches AI-generated daily insights for a selected date.
 * Admin-only functionality.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/core/store/auth-store';
import { getDailyInsights, formatDateId } from '@/core/firebase/insights';
import type { DailyInsights, UseInsightsDataReturn } from '../types/insights.types';

/**
 * Hook to fetch daily insights for a specific date
 *
 * @param selectedDate - The date to fetch insights for
 * @returns Object with insights data, loading state, error, and refetch function
 */
export function useInsightsData(selectedDate: Date): UseInsightsDataReturn {
  const [insights, setInsights] = useState<DailyInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userRole = useAuthStore((state) => state.userRole);
  const isAdmin = userRole === 'admin';

  // Fetch insights for the selected date
  const fetchInsights = useCallback(async () => {
    if (!isAdmin) {
      setInsights(null);
      setIsLoading(false);
      setError('No autorizado');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getDailyInsights(selectedDate);
      setInsights(data);

      if (!data) {
        // Not an error, just no insights for this date
        setError(null);
      }
    } catch (err) {
      console.error('[useInsightsData] Error fetching insights:', err);
      const message = err instanceof Error ? err.message : 'Error al cargar insights';
      setError(message);
      setInsights(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, isAdmin]);

  // Fetch on mount and when date changes
  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Return the hook state
  return {
    insights,
    isLoading,
    error,
    refetch: fetchInsights,
  };
}

/**
 * Get yesterday's date (default for insights)
 */
export function getYesterdayDate(): Date {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  return yesterday;
}

// Re-export formatDateId for convenience
export { formatDateId };
