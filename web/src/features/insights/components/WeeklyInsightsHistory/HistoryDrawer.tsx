/**
 * HistoryDrawer Component
 *
 * Mobile-only bottom sheet drawer showing weekly insights history.
 */

import { type FC, useEffect } from 'react';
import type { WeeklyInsightsSummary } from '@/core/firebase/insights';
import { WeekHistoryCard } from './WeekHistoryCard';

interface HistoryDrawerProps {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Callback to close the drawer */
  onClose: () => void;
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
const DrawerSkeleton: FC = () => (
  <div className="history-drawer__skeleton">
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
const DrawerEmpty: FC = () => (
  <div className="history-drawer__empty">
    <span className="history-drawer__empty-icon">📅</span>
    <p className="history-drawer__empty-text">Sin historial disponible</p>
  </div>
);

export const HistoryDrawer: FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  summaries,
  selectedWeekId,
  isLoading,
  isLoadingMore,
  hasMore,
  onSelectWeek,
  onLoadMore,
}) => {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle week selection with auto-close
  const handleSelectWeek = (weekId: string) => {
    onSelectWeek(weekId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="history-drawer-overlay" onClick={onClose}>
      <div
        className="history-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Historial de semanas"
      >
        {/* Drag handle */}
        <div className="history-drawer__handle" />

        {/* Header */}
        <div className="history-drawer__header">
          <h3 className="history-drawer__title">Historial</h3>
          <button
            type="button"
            className="history-drawer__close"
            onClick={onClose}
            aria-label="Cerrar historial"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="history-drawer__content">
          {isLoading ? (
            <DrawerSkeleton />
          ) : summaries.length === 0 ? (
            <DrawerEmpty />
          ) : (
            <>
              <div className="history-drawer__list">
                {summaries.map((summary) => (
                  <WeekHistoryCard
                    key={summary.weekId}
                    summary={summary}
                    isSelected={summary.weekId === selectedWeekId}
                    onClick={() => handleSelectWeek(summary.weekId)}
                  />
                ))}
              </div>
              {hasMore && (
                <button
                  type="button"
                  className="history-drawer__load-more"
                  onClick={onLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? 'Cargando...' : 'Cargar más semanas'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
