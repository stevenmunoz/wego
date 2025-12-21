/**
 * Reporting Page
 *
 * Admin-only dashboard displaying comprehensive ride analytics
 * with real-time updates from Firestore.
 */

import { type FC, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuthStore } from '@/core/store/auth-store';
import { trackPageViewed, trackReportingDateFiltered, trackReportingRefreshed } from '@/core/analytics';
import {
  SummaryCards,
  ReportingDateFilter,
  SourceComparison,
  TrendChart,
  DriverEfficiencyTable,
  VehicleEfficiencyTable,
  CancellationRate,
  PeakHoursHeatmap,
  PaymentMethodChart,
  GoalsSettingsModal,
} from '@/features/reporting/components';
import { useReportingData, useReportingGoals } from '@/features/reporting/hooks';
import type { ReportingDateFilterOption, DateRange } from '@/features/reporting/types';
import { getInitialDateRange } from '@/features/reporting/utils';
import './ReportingPage.css';

export const ReportingPage: FC = () => {
  const userRole = useAuthStore((state) => state.userRole);
  const isAdmin = userRole === 'admin';

  // Date filter state
  const [dateFilterOption, setDateFilterOption] = useState<ReportingDateFilterOption>('last30days');
  const [dateRange, setDateRange] = useState<DateRange>(getInitialDateRange());
  const [customRange, setCustomRange] = useState<DateRange | null>(null);

  // Goals modal state
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);

  // Fetch reporting data with real-time subscription
  const {
    aggregations,
    isLoading: isDataLoading,
    error: dataError,
    isRealtime,
    refetch,
  } = useReportingData({ startDate: dateRange.startDate, endDate: dateRange.endDate });

  // Fetch reporting goals
  const {
    goals,
    activeGoal,
    isLoading: isGoalsLoading,
    createGoal,
    deleteGoal,
  } = useReportingGoals();

  // Track page view
  useEffect(() => {
    if (isAdmin) {
      trackPageViewed('reporting');
    }
  }, [isAdmin]);

  // Redirect non-admins
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleDateFilterChange = (option: ReportingDateFilterOption, range: DateRange) => {
    setDateFilterOption(option);
    setDateRange(range);
    if (option === 'custom') {
      setCustomRange(range);
    }
    trackReportingDateFiltered(option);
  };

  const handleRefresh = () => {
    trackReportingRefreshed(isRealtime);
    refetch();
  };

  const isLoading = isDataLoading || isGoalsLoading;

  return (
    <DashboardLayout>
      <div className="reporting-page">
        {/* Header */}
        <div className="page-header">
          <div className="header-left">
            <h1 className="page-title">Reportes</h1>
            <p className="page-subtitle">
              Analisis de rendimiento y eficiencia
            </p>
          </div>
          <div className="header-actions">
            <ReportingDateFilter
              value={dateFilterOption}
              customRange={customRange}
              onChange={handleDateFilterChange}
            />
            <button
              className="action-button goals-button"
              onClick={() => setIsGoalsModalOpen(true)}
              title="Configurar metas"
            >
              ⚙️ Metas
            </button>
            <button
              className="action-button refresh-button"
              onClick={handleRefresh}
              disabled={isLoading}
              title={isRealtime ? 'Actualizacion en tiempo real activa' : 'Actualizar datos'}
            >
              {isRealtime && <span className="realtime-indicator"></span>}
              🔄 {isLoading ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {dataError && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{dataError}</span>
            <button className="retry-button" onClick={refetch}>
              Reintentar
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <SummaryCards aggregations={aggregations} isLoading={isLoading} />

        {/* Charts Row */}
        <div className="charts-row">
          <SourceComparison
            data={aggregations?.bySource ?? null}
            isLoading={isLoading}
          />
          <PaymentMethodChart
            data={aggregations?.byPaymentMethod ?? null}
            isLoading={isLoading}
          />
        </div>

        {/* Trend Chart */}
        <TrendChart
          data={aggregations?.dailyTrends ?? []}
          goal={activeGoal}
          isLoading={isLoading}
        />

        {/* Tables Row */}
        <div className="tables-row">
          <DriverEfficiencyTable
            data={aggregations?.byDriver ?? []}
            goal={activeGoal}
            isLoading={isLoading}
          />
          <VehicleEfficiencyTable
            data={aggregations?.byVehicle ?? []}
            isLoading={isLoading}
          />
        </div>

        {/* Bottom Row */}
        <div className="bottom-row">
          <CancellationRate
            data={aggregations?.cancellations ?? null}
            isLoading={isLoading}
          />
          <PeakHoursHeatmap
            data={aggregations?.peakHours ?? null}
            isLoading={isLoading}
          />
        </div>

        {/* Goals Modal */}
        <GoalsSettingsModal
          isOpen={isGoalsModalOpen}
          onClose={() => setIsGoalsModalOpen(false)}
          goals={goals}
          onSave={createGoal}
          onDelete={deleteGoal}
        />
      </div>
    </DashboardLayout>
  );
};
