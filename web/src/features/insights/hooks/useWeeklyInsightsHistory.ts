/**
 * useWeeklyInsightsHistory Hook
 *
 * Fetches paginated list of weekly insights summaries for the history sidebar.
 */

import { useState, useEffect, useCallback } from 'react';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import {
  getWeeklyInsightsList,
  type WeeklyInsightsSummary,
} from '@/core/firebase/insights';

interface UseWeeklyInsightsHistoryReturn {
  /** List of weekly insights summaries */
  summaries: WeeklyInsightsSummary[];
  /** Whether the initial load is in progress */
  isLoading: boolean;
  /** Whether more items are being loaded */
  isLoadingMore: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Load more items */
  loadMore: () => Promise<void>;
  /** Refresh the list */
  refresh: () => Promise<void>;
}

const PAGE_SIZE = 10;

export function useWeeklyInsightsHistory(): UseWeeklyInsightsHistoryReturn {
  const [summaries, setSummaries] = useState<WeeklyInsightsSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  // Initial load
  const loadInitial = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getWeeklyInsightsList(PAGE_SIZE);
      setSummaries(result.summaries);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('[useWeeklyInsightsHistory] Error loading history:', err);
      setError('Error al cargar el historial');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load more items
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !lastDoc) return;

    setIsLoadingMore(true);
    setError(null);

    try {
      const result = await getWeeklyInsightsList(PAGE_SIZE, lastDoc);
      setSummaries((prev) => [...prev, ...result.summaries]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('[useWeeklyInsightsHistory] Error loading more:', err);
      setError('Error al cargar más semanas');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, lastDoc]);

  // Refresh the list
  const refresh = useCallback(async () => {
    setLastDoc(null);
    await loadInitial();
  }, [loadInitial]);

  // Load on mount
  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  return {
    summaries,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
