/**
 * useInsights Hook
 *
 * Period-agnostic hook for fetching and managing insights data.
 * Supports daily, weekly, bi-weekly, and monthly insights.
 */

import { useState, useEffect, useCallback } from 'react';
import { getInsights, triggerGeneratePeriodInsights } from '@/core/firebase/insights';
import type { PeriodType, PeriodInsights, UsePeriodInsightsReturn } from '../types/insights.types';

interface UseInsightsOptions {
  /** The type of period (daily, weekly, biweekly, monthly) */
  periodType: PeriodType;
  /** The period ID in appropriate format */
  periodId: string;
  /** Auto-fetch on mount and when period changes (default: true) */
  autoFetch?: boolean;
}

/**
 * Hook for fetching and managing period-agnostic insights
 *
 * @param options - Configuration options
 * @returns Insights data, loading state, and actions
 */
export function useInsights({
  periodType,
  periodId,
  autoFetch = true,
}: UseInsightsOptions): UsePeriodInsightsReturn {
  const [insights, setInsights] = useState<PeriodInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchInsights = useCallback(async () => {
    if (!periodId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getInsights(periodType, periodId);
      setInsights(data);
    } catch (err) {
      console.error('[useInsights] Failed to fetch:', err);
      setError('Error al cargar los insights');
    } finally {
      setIsLoading(false);
    }
  }, [periodType, periodId]);

  const triggerGeneration = useCallback(async () => {
    if (!periodId) return;

    setIsGenerating(true);
    setError(null);

    try {
      await triggerGeneratePeriodInsights(periodType, periodId);
      // Refetch after generation
      await fetchInsights();
    } catch (err) {
      console.error('[useInsights] Generation failed:', err);
      setError('Error al generar los insights');
    } finally {
      setIsGenerating(false);
    }
  }, [periodType, periodId, fetchInsights]);

  // Auto-fetch on mount and when period changes
  useEffect(() => {
    if (autoFetch && periodId) {
      fetchInsights();
    }
  }, [autoFetch, periodId, fetchInsights]);

  return {
    insights,
    isLoading,
    error,
    refetch: fetchInsights,
    triggerGeneration,
    isGenerating,
  };
}

// ============ History Hook ============

import {
  getInsightsList,
  type InsightsSummary,
  type InsightsListResult,
} from '@/core/firebase/insights';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

interface UseInsightsHistoryOptions {
  /** Filter by period type (optional) */
  periodType?: PeriodType;
  /** Number of items per page (default: 10) */
  pageSize?: number;
  /** Auto-fetch on mount (default: true) */
  autoFetch?: boolean;
}

interface UseInsightsHistoryReturn {
  summaries: InsightsSummary[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching paginated insights history
 *
 * @param options - Configuration options
 * @returns Paginated list of insights summaries with load more functionality
 */
export function useInsightsHistory({
  periodType,
  pageSize = 10,
  autoFetch = true,
}: UseInsightsHistoryOptions = {}): UseInsightsHistoryReturn {
  const [summaries, setSummaries] = useState<InsightsSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const fetchInsights = useCallback(
    async (append: boolean = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const result: InsightsListResult = await getInsightsList(
          periodType,
          pageSize,
          append ? lastDoc : null
        );

        if (append) {
          setSummaries((prev) => [...prev, ...result.summaries]);
        } else {
          setSummaries(result.summaries);
        }

        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
      } catch (err) {
        console.error('[useInsightsHistory] Failed to fetch:', err);
        setError('Error al cargar el historial de insights');
      } finally {
        setIsLoading(false);
      }
    },
    [periodType, pageSize, lastDoc]
  );

  const loadMore = useCallback(async () => {
    if (hasMore && !isLoading) {
      await fetchInsights(true);
    }
  }, [hasMore, isLoading, fetchInsights]);

  const refetch = useCallback(async () => {
    setLastDoc(null);
    setSummaries([]);
    await fetchInsights(false);
  }, [fetchInsights]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchInsights(false);
    }
  }, [autoFetch, periodType]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    summaries,
    isLoading,
    error,
    hasMore,
    loadMore,
    refetch,
  };
}
