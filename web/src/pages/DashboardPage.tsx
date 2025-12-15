/**
 * Dashboard page - displays rides based on user role
 * - Admin: sees all drivers' rides
 * - Driver: sees only their own rides
 */

import { useState, useMemo } from 'react';
import { useAuthStore } from '@/core/store/auth-store';
import { DashboardLayout } from '@/components/DashboardLayout';
import { RidesTable } from '@/components/RidesTable';
import { DateFilter, type DateFilterOption } from '@/components/DateFilter';
import { StatusFilter, type StatusFilterOption } from '@/components/StatusFilter';
import { SourceFilter, type SourceFilterOption } from '@/components/SourceFilter';
import { useDriverRides } from '@/hooks/useDriverRides';
import { useAdminRides } from '@/hooks/useAdminRides';
import './DashboardPage.css';

export const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const userRole = useAuthStore((state) => state.userRole);
  const isAdmin = userRole === 'admin';

  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [dateRange, setDateRange] = useState<{ startDate?: Date; endDate?: Date }>({});
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilterOption>('all');

  const options = useMemo(
    () => ({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    }),
    [dateRange.startDate, dateRange.endDate]
  );

  // Use appropriate hook based on role
  const driverRides = useDriverRides(isAdmin ? undefined : user?.id, options);
  const adminRides = useAdminRides(isAdmin ? options : undefined);

  // Select the right data based on role
  const { rides, isLoading, error, refetch, updateRide } = isAdmin ? adminRides : driverRides;
  const { drivers = [], vehicles = [] } = adminRides;

  const handleDateFilterChange = (
    option: DateFilterOption,
    range: { startDate?: Date; endDate?: Date }
  ) => {
    setDateFilter(option);
    setDateRange(range);
  };

  // Page titles based on role
  const pageTitle = isAdmin ? 'Todos los Viajes' : 'Mis Viajes';
  const pageSubtitle = isAdmin
    ? 'Historial completo de viajes de todos los conductores'
    : 'Historial completo de todos tus viajes registrados';

  return (
    <DashboardLayout>
      <div className="dashboard-page">
        <header className="page-header">
          <div className="page-header-content">
            <h1 className="page-title">{pageTitle}</h1>
            <p className="page-subtitle">{pageSubtitle}</p>
            {isAdmin && <span className="admin-badge">Admin</span>}
          </div>
          <div className="page-header-actions">
            <DateFilter value={dateFilter} onChange={handleDateFilterChange} />
            <StatusFilter value={statusFilter} onChange={setStatusFilter} />
            <SourceFilter value={sourceFilter} onChange={setSourceFilter} />
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

        <RidesTable
          rides={rides}
          isLoading={isLoading}
          statusFilter={statusFilter}
          sourceFilter={sourceFilter}
          onUpdateRide={updateRide}
          showDriverColumn={isAdmin}
          showVehicleColumn={true}
          showSourceColumn={true}
          drivers={isAdmin ? drivers : []}
          vehicles={isAdmin ? vehicles : []}
        />
      </div>
    </DashboardLayout>
  );
};
