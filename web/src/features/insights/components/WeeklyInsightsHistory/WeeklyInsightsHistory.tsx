/**
 * WeeklyInsightsHistory Component
 *
 * Sidebar showing historical weekly insights for navigation.
 * Desktop: Always visible sidebar
 */

import { type FC } from 'react';
import type { WeeklyInsightsSummary } from '@/core/firebase/insights';
import { WeekHistoryCard } from './WeekHistoryCard';
import './WeeklyInsightsHistory.css';

interface WeeklyInsightsHistoryProps {
  /** List of weekly insights summaries */
  summaries: WeeklyInsightsSummary[];
  /** Currently selected week ID */
  selectedWeekId: string;
  /** Whether loading initial data */
  isLoading: boolean;
  /** Whether loading more data */
  isLoadingMore: boolean;
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Callback when a week is selected */
  onSelectWeek: (weekId: string) => void;
  /** Callback to load more weeks */
  onLoadMore: () => void;
}

/**
 * Loading skeleton for history cards
 */
const HistorySkeleton: FC = () => (
  <div className="week-history-skeleton">
    {[1, 2, 3].map((i) => (
      <div key={i} className="week-history-skeleton__card">
        <div className="week-history-skeleton__line week-history-skeleton__line--long" />
        <div className="week-history-skeleton__line week-history-skeleton__line--short" />
      </div>
    ))}
  </div>
);

/**
 * Empty state when no history available
 */
const HistoryEmpty: FC = () => (
  <div className="week-history-empty">
    <span className="week-history-empty__icon">📅</span>
    <p className="week-history-empty__text">Sin historial disponible</p>
  </div>
);

export const WeeklyInsightsHistory: FC<WeeklyInsightsHistoryProps> = ({
  summaries,
  selectedWeekId,
  isLoading,
  isLoadingMore,
  hasMore,
  onSelectWeek,
  onLoadMore,
}) => {
  if (isLoading) {
    return (
      <aside className="weekly-insights-history">
        <h3 className="weekly-insights-history__title">Historial</h3>
        <HistorySkeleton />
      </aside>
    );
  }

  if (summaries.length === 0) {
    return (
      <aside className="weekly-insights-history">
        <h3 className="weekly-insights-history__title">Historial</h3>
        <HistoryEmpty />
      </aside>
    );
  }

  return (
    <aside className="weekly-insights-history">
      <h3 className="weekly-insights-history__title">Historial</h3>
      <div className="weekly-insights-history__list">
        {summaries.map((summary) => (
          <WeekHistoryCard
            key={summary.weekId}
            summary={summary}
            isSelected={summary.weekId === selectedWeekId}
            onClick={() => onSelectWeek(summary.weekId)}
          />
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          className="weekly-insights-history__load-more"
          onClick={onLoadMore}
          disabled={isLoadingMore}
        >
          {isLoadingMore ? 'Cargando...' : 'Cargar más'}
        </button>
      )}
    </aside>
  );
};
