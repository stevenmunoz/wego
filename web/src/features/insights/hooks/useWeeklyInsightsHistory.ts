/**
 * useWeeklyInsightsHistory Hook
 *
 * Subscribes to real-time updates of weekly insights summaries for the history sidebar.
 * Automatically refreshes when new insights are generated.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import {
  getWeeklyInsightsList,
  subscribeToWeeklyInsightsList,
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
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const loadedCountRef = useRef(0);

  // Subscribe to real-time updates on mount
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToWeeklyInsightsList(
      PAGE_SIZE,
      (newSummaries) => {
        setSummaries(newSummaries);
        loadedCountRef.current = newSummaries.length;
        // If we got a full page, there might be more
        setHasMore(newSummaries.length >= PAGE_SIZE);
        setIsLoading(false);
      },
      (err) => {
        console.error('[useWeeklyInsightsHistory] Subscription error:', err);
        setError('Error al cargar el historial');
        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  // Load more items (uses one-time fetch for pagination beyond initial subscription)
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    setError(null);

    try {
      // Use lastDoc if available, otherwise fetch based on current summaries count
      const result = await getWeeklyInsightsList(PAGE_SIZE, lastDoc);
      setSummaries((prev) => {
        // Merge new summaries, avoiding duplicates based on weekId
        const existingIds = new Set(prev.map((s) => s.weekId));
        const newUniqueSummaries = result.summaries.filter((s) => !existingIds.has(s.weekId));
        return [...prev, ...newUniqueSummaries];
      });
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('[useWeeklyInsightsHistory] Error loading more:', err);
      setError('Error al cargar más semanas');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, lastDoc]);

  // Refresh the list (subscription auto-updates, so this is mainly for resetting pagination)
  const refresh = useCallback(async () => {
    setLastDoc(null);
    setHasMore(true);
    // The subscription will automatically provide fresh data
  }, []);

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
