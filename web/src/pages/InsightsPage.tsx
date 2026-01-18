/**
 * Insights Page
 *
 * Admin-only page displaying AI-generated weekly business insights
 * in a conversational email-style format with history sidebar.
 */

import { type FC, useState, useEffect, useCallback } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuthStore } from '@/core/store/auth-store';
import { trackPageViewed } from '@/core/analytics';
import { WeekPicker, getISOWeekNumber } from '@/features/insights/components/WeekPicker';
import { formatWeekId } from '@/core/firebase/insights';
import { InsightsSummary } from '@/features/insights/components/InsightsSummary';
import { WeeklyInsightsHistory, HistoryDrawer } from '@/features/insights/components/WeeklyInsightsHistory';
import { useWeeklyInsights } from '@/features/insights/hooks/useWeeklyInsights';
import { useWeeklyInsightsHistory } from '@/features/insights/hooks/useWeeklyInsightsHistory';
import type { WeekValue } from '@/features/insights/components/WeekPicker';
import './InsightsPage.css';

/**
 * Get the previous week (last completed week)
 */
function getLastWeek(): WeekValue {
  const now = new Date();
  now.setDate(now.getDate() - 7);
  return getISOWeekNumber(now);
}

/**
 * Get max selectable week (last week, since current week is in progress)
 */
function getMaxWeek(): WeekValue {
  return getLastWeek();
}

/**
 * Parse week ID from URL param (e.g., "2026-W02") to WeekValue
 */
function parseWeekIdToValue(weekId: string): WeekValue | null {
  const match = weekId.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return null;
  return { year: parseInt(match[1], 10), week: parseInt(match[2], 10) };
}

export const InsightsPage: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const userRole = useAuthStore((state) => state.userRole);
  const user = useAuthStore((state) => state.user);
  const isAdmin = userRole === 'admin';

  // Parse week from URL or default to last week
  const getInitialWeek = useCallback((): WeekValue => {
    const weekParam = searchParams.get('week');
    if (weekParam) {
      const parsed = parseWeekIdToValue(weekParam);
      if (parsed) return parsed;
    }
    return getLastWeek();
  }, [searchParams]);

  // Selected week state
  const [selectedWeek, setSelectedWeek] = useState<WeekValue>(getInitialWeek);

  // History drawer state (mobile)
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Fetch insights data
  const { insights, isLoading, error, refetch, triggerGeneration, isGenerating } =
    useWeeklyInsights({ week: selectedWeek });

  // Fetch history data
  const {
    summaries: historySummaries,
    isLoading: isHistoryLoading,
    isLoadingMore: isHistoryLoadingMore,
    hasMore: historyHasMore,
    loadMore: loadMoreHistory,
  } = useWeeklyInsightsHistory();

  // Update URL when week changes
  const handleWeekChange = useCallback(
    (week: WeekValue) => {
      setSelectedWeek(week);
      const weekId = formatWeekId(week.year, week.week);
      setSearchParams({ week: weekId }, { replace: true });
    },
    [setSearchParams]
  );

  // Handle selecting week from history
  const handleSelectFromHistory = useCallback(
    (weekId: string) => {
      const parsed = parseWeekIdToValue(weekId);
      if (parsed) {
        handleWeekChange(parsed);
      }
    },
    [handleWeekChange]
  );

  // Sync URL param on mount only - intentionally empty deps array
  useEffect(() => {
    const weekId = formatWeekId(selectedWeek.year, selectedWeek.week);
    const currentParam = searchParams.get('week');
    if (currentParam !== weekId) {
      setSearchParams({ week: weekId }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track page view
  useEffect(() => {
    if (isAdmin) {
      trackPageViewed('insights');
    }
  }, [isAdmin]);

  // Redirect non-admins
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Get display name (first name only)
  const displayName = user?.full_name ? user.full_name.split(' ')[0] : 'Usuario';

  // Current week ID for history highlighting
  const currentWeekId = formatWeekId(selectedWeek.year, selectedWeek.week);

  return (
    <DashboardLayout>
      <div className="insights-page">
        {/* Header */}
        <div className="page-header">
          <div className="header-left">
            <h1 className="page-title">Resumen Semanal</h1>
            <p className="page-subtitle">Tu operación en un vistazo</p>
          </div>
          <div className="header-actions">
            <WeekPicker
              label="Semana:"
              value={selectedWeek}
              onChange={handleWeekChange}
              max={getMaxWeek()}
            />
            <button
              className="action-button generate-button"
              onClick={triggerGeneration}
              disabled={isGenerating || isLoading}
            >
              {isGenerating ? 'Generando...' : 'Generar'}
            </button>
            <button
              className="action-button refresh-button"
              onClick={refetch}
              disabled={isLoading || isGenerating}
            >
              {isLoading ? 'Cargando...' : 'Actualizar'}
            </button>
            {/* History button for mobile */}
            <button
              className="action-button history-button"
              onClick={() => setIsHistoryDrawerOpen(true)}
            >
              Historial
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
            <button className="retry-button" onClick={refetch}>
              Reintentar
            </button>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="insights-layout">
          {/* Main Content */}
          <div className="insights-content">
            {isLoading ? (
              <div className="loading-state">
                <div className="loading-spinner" />
                <p>Cargando resumen semanal...</p>
              </div>
            ) : insights ? (
              <InsightsSummary data={insights} userName={displayName} />
            ) : (
              <div className="empty-state">
                <div className="empty-state__icon">📊</div>
                <h2 className="empty-state__title">No hay resumen disponible para esta semana</h2>
                <p className="empty-state__description">
                  Los resúmenes se generan automáticamente cada lunes a la 1:00 AM (hora Colombia).
                </p>
                <p className="empty-state__description">
                  Si necesitas generar el resumen ahora, haz clic en "Generar".
                </p>
                <button
                  className="empty-state__button"
                  onClick={triggerGeneration}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Generando...' : 'Generar Resumen'}
                </button>
              </div>
            )}
          </div>

          {/* History Sidebar (Desktop only) */}
          <WeeklyInsightsHistory
            summaries={historySummaries}
            selectedWeekId={currentWeekId}
            isLoading={isHistoryLoading}
            isLoadingMore={isHistoryLoadingMore}
            hasMore={historyHasMore}
            onSelectWeek={handleSelectFromHistory}
            onLoadMore={loadMoreHistory}
          />
        </div>

        {/* History Drawer (Mobile only) */}
        <HistoryDrawer
          isOpen={isHistoryDrawerOpen}
          onClose={() => setIsHistoryDrawerOpen(false)}
          summaries={historySummaries}
          selectedWeekId={currentWeekId}
          isLoading={isHistoryLoading}
          isLoadingMore={isHistoryLoadingMore}
          hasMore={historyHasMore}
          onSelectWeek={handleSelectFromHistory}
          onLoadMore={loadMoreHistory}
        />
      </div>
    </DashboardLayout>
  );
};
