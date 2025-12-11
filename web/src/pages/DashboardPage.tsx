/**
 * Dashboard page - displays all driver rides
 */

import { useState, useMemo } from 'react';
import { useAuthStore } from '@/core/store/auth-store';
import { DashboardLayout } from '@/components/DashboardLayout';
import { RidesTable } from '@/components/RidesTable';
import { DateFilter, type DateFilterOption } from '@/components/DateFilter';
import { StatusFilter, type StatusFilterOption } from '@/components/StatusFilter';
import { useDriverRides } from '@/hooks/useDriverRides';
import './DashboardPage.css';

export const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [dateRange, setDateRange] = useState<{ startDate?: Date; endDate?: Date }>({});
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all');

  const options = useMemo(
    () => ({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    }),
    [dateRange.startDate, dateRange.endDate]
  );

  const { rides, isLoading, error, refetch } = useDriverRides(user?.id, options);

  const handleDateFilterChange = (
    option: DateFilterOption,
    range: { startDate?: Date; endDate?: Date }
  ) => {
    setDateFilter(option);
    setDateRange(range);
  };

  return (
    <DashboardLayout>
      <div className="dashboard-page">
        <header className="page-header">
          <div className="page-header-content">
            <h1 className="page-title">Mis Viajes</h1>
            <p className="page-subtitle">
              Historial completo de todos tus viajes registrados
            </p>
          </div>
          <div className="page-header-actions">
            <DateFilter value={dateFilter} onChange={handleDateFilterChange} />
            <StatusFilter value={statusFilter} onChange={setStatusFilter} />
            <button type="button" className="btn btn-outline" onClick={refetch}>
              <span>🔄</span> Actualizar
            </button>
          </div>
        </header>

        {error && (
          <div className="error-banner">
            <span className="error-icon">!</span>
            <span>{error}</span>
            <button type="button" className="btn-retry" onClick={refetch}>
              Reintentar
            </button>
          </div>
        )}

        <RidesTable rides={rides} isLoading={isLoading} statusFilter={statusFilter} />
      </div>
    </DashboardLayout>
  );
};
