/**
 * useWeeklyInsights Hook
 *
 * Fetches and manages weekly insights data from Firestore.
 * Provides loading, error states, and manual trigger functionality.
 */

import { useState, useEffect, useCallback } from 'react';
import { getWeeklyInsights, triggerGenerateWeeklyInsights } from '@/core/firebase/insights';
import type { WeeklyInsights, UseWeeklyInsightsReturn } from '../types/insights.types';
import type { WeekValue } from '../components/WeekPicker';

interface UseWeeklyInsightsOptions {
  /** The week to fetch insights for */
  week: WeekValue;
  /** Auto-fetch on mount and when week changes (default: true) */
  autoFetch?: boolean;
}

/**
 * Hook for fetching and managing weekly insights
 *
 * @param options - Configuration options
 * @returns Weekly insights data, loading state, and actions
 */
export function useWeeklyInsights({
  week,
  autoFetch = true,
}: UseWeeklyInsightsOptions): UseWeeklyInsightsReturn {
  const [insights, setInsights] = useState<WeeklyInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getWeeklyInsights(week.year, week.week);
      setInsights(data);
    } catch (err) {
      console.error('[useWeeklyInsights] Failed to fetch:', err);
      setError('Error al cargar los insights semanales');
    } finally {
      setIsLoading(false);
    }
  }, [week.year, week.week]);

  const triggerGeneration = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      await triggerGenerateWeeklyInsights(week.year, week.week);
      // Refetch after generation
      await fetchInsights();
    } catch (err) {
      console.error('[useWeeklyInsights] Generation failed:', err);
      setError('Error al generar los insights semanales');
    } finally {
      setIsGenerating(false);
    }
  }, [week.year, week.week, fetchInsights]);

  // Auto-fetch on mount and when week changes
  useEffect(() => {
    if (autoFetch) {
      fetchInsights();
    }
  }, [autoFetch, fetchInsights]);

  return {
    insights,
    isLoading,
    error,
    refetch: fetchInsights,
    triggerGeneration,
    isGenerating,
  };
}
