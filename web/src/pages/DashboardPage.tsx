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
import { DriverFilter } from '@/components/DriverFilter';
import { useDriverRides } from '@/hooks/useDriverRides';
import { useAdminRides } from '@/hooks/useAdminRides';
import './DashboardPage.css';

// Check if running in dev environment (never allow delete all in prod)
const isDev = import.meta.env.VITE_FIREBASE_PROJECT_ID?.includes('dev');

export const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const userRole = useAuthStore((state) => state.userRole);
  const isAdmin = userRole === 'admin';

  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [dateRange, setDateRange] = useState<{ startDate?: Date; endDate?: Date }>({});
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilterOption>('all');
  const [driverFilter, setDriverFilter] = useState<string>('all');
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

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
  const {
    drivers = [],
    vehicles = [],
    deleteRide,
    deleteAllRides,
    isDeleting,
  } = adminRides;

  const handleDateFilterChange = (
    option: DateFilterOption,
    range: { startDate?: Date; endDate?: Date }
  ) => {
    setDateFilter(option);
    setDateRange(range);
  };

  const handleDeleteAllRides = async () => {
    if (!deleteAllRides) return;

    const result = await deleteAllRides();
    if (result.success) {
      setShowDeleteAllConfirm(false);
    }
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
          <div className="page-header-top">
            <div className="page-header-title">
              <h1 className="page-title">
                {pageTitle}
                {isAdmin && <span className="admin-badge">Admin</span>}
              </h1>
              <p className="page-subtitle">{pageSubtitle}</p>
            </div>
            <div className="page-header-actions">
              <button type="button" className="btn btn-outline" onClick={refetch}>
                <span>🔄</span> Actualizar
              </button>
              {/* Delete All Rides - DEV ONLY, Admin only */}
              {isDev && isAdmin && (
                <>
                  {showDeleteAllConfirm ? (
                    <div className="delete-all-confirm">
                      <span className="delete-all-warning">¿Eliminar TODOS los viajes?</span>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={handleDeleteAllRides}
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Eliminando...' : 'Confirmar'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => setShowDeleteAllConfirm(false)}
                        disabled={isDeleting}
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-danger-outline btn-sm"
                      onClick={() => setShowDeleteAllConfirm(true)}
                      title="Solo disponible en entorno de desarrollo"
                    >
                      Eliminar Todos (DEV)
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="page-header-filters">
            <DateFilter value={dateFilter} onChange={handleDateFilterChange} />
            <StatusFilter value={statusFilter} onChange={setStatusFilter} />
            <SourceFilter value={sourceFilter} onChange={setSourceFilter} />
            {isAdmin && (
              <DriverFilter drivers={drivers} value={driverFilter} onChange={setDriverFilter} />
            )}
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
          driverFilter={isAdmin ? driverFilter : 'all'}
          onUpdateRide={updateRide}
          onDeleteRide={isAdmin ? deleteRide : undefined}
          showDriverColumn={isAdmin}
          showVehicleColumn={true}
          showSourceColumn={true}
          showDeleteButton={isAdmin}
          drivers={isAdmin ? drivers : []}
          vehicles={isAdmin ? vehicles : []}
        />
      </div>
    </DashboardLayout>
  );
};
