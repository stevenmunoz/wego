/**
 * Rides Table Component
 *
 * Displays ride data in a read-only table format for dashboard view
 */

import { type FC, useState, useMemo } from 'react';
import type { FirestoreInDriverRide } from '@/core/firebase';
import type { StatusFilterOption } from '@/components/StatusFilter';
import './RidesTable.css';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

interface RidesTableProps {
  rides: FirestoreInDriverRide[];
  isLoading: boolean;
  onImportClick?: () => void;
  statusFilter?: StatusFilterOption;
}

// Format helpers
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (timestamp: { toDate: () => Date } | null): string => {
  if (!timestamp) return '-';
  const date = timestamp.toDate();
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const formatTime = (time: string): string => {
  return time || '-';
};

const formatDuration = (value: number | null, unit: string | null): string => {
  if (value === null) return '-';
  return `${value} ${unit || 'min'}`;
};

const formatDistance = (value: number | null, unit: string | null): string => {
  if (value === null) return '-';
  return `${value.toFixed(1)} ${unit || 'km'}`;
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'Completado';
    case 'cancelled_by_passenger':
      return 'Cancelado (pasajero)';
    case 'cancelled_by_driver':
      return 'Cancelado (conductor)';
    default:
      return status;
  }
};

const getStatusColor = (status: string): string => {
  if (status === 'completed') return 'success';
  if (status.includes('cancelled')) return 'error';
  return 'warning';
};

interface Totals {
  totalFare: number;
  totalCommission: number;
  totalTax: number;
  totalEarnings: number;
  completedCount: number;
  cancelledCount: number;
}

const sortRidesByDateAndTime = (rides: FirestoreInDriverRide[]): FirestoreInDriverRide[] => {
  return [...rides].sort((a, b) => {
    // First compare by date
    const dateA = a.date?.toDate?.()?.getTime() ?? 0;
    const dateB = b.date?.toDate?.()?.getTime() ?? 0;
    if (dateA !== dateB) {
      return dateA - dateB; // ascending by date
    }
    // If same date, compare by time string (HH:MM format)
    const timeA = a.time || '00:00';
    const timeB = b.time || '00:00';
    return timeA.localeCompare(timeB); // ascending by time
  });
};

const calculateTotals = (rides: FirestoreInDriverRide[]): Totals => {
  return rides.reduce(
    (acc, ride) => ({
      totalFare: acc.totalFare + (ride.base_fare || 0),
      totalCommission: acc.totalCommission + (ride.service_commission || 0),
      totalTax: acc.totalTax + (ride.service_tax || 0),
      totalEarnings: acc.totalEarnings + (ride.net_earnings || 0),
      completedCount: acc.completedCount + (ride.status === 'completed' ? 1 : 0),
      cancelledCount: acc.cancelledCount + (ride.status !== 'completed' ? 1 : 0),
    }),
    {
      totalFare: 0,
      totalCommission: 0,
      totalTax: 0,
      totalEarnings: 0,
      completedCount: 0,
      cancelledCount: 0,
    }
  );
};

export const RidesTable: FC<RidesTableProps> = ({
  rides,
  isLoading,
  onImportClick,
  statusFilter = 'all',
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Filter rides by status
  const filteredRides = useMemo(() => {
    if (statusFilter === 'all') return rides;
    if (statusFilter === 'completed') return rides.filter((r) => r.status === 'completed');
    if (statusFilter === 'cancelled') return rides.filter((r) => r.status !== 'completed');
    return rides;
  }, [rides, statusFilter]);

  const sortedRides = useMemo(() => sortRidesByDateAndTime(filteredRides), [filteredRides]);
  const totals = useMemo(() => calculateTotals(sortedRides), [sortedRides]);

  // Calculate totals for all rides (not just filtered) for summary cards
  const allRidesTotals = useMemo(() => calculateTotals(rides), [rides]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedRides.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRides = sortedRides.slice(startIndex, endIndex);

  // Reset to page 1 when rides change and current page exceeds total
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of table
    document.querySelector('.rides-table-container')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Generate page numbers to display
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  if (isLoading) {
    return (
      <div className="rides-table-loading">
        <div className="spinner"></div>
        <p>Cargando viajes...</p>
      </div>
    );
  }

  if (sortedRides.length === 0) {
    return (
      <div className="rides-table-empty">
        <div className="empty-icon">🚗</div>
        <h3>No hay viajes registrados</h3>
        <p>Importa tus viajes de InDriver para comenzar a ver tus estadisticas</p>
        {onImportClick && (
          <button type="button" className="btn btn-primary" onClick={onImportClick}>
            Importar Viajes
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rides-table-container">
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <span className="summary-label">Total Recibido</span>
          <span className="summary-value">
            {formatCurrency(totals.totalFare)}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Pagado</span>
          <span className="summary-value">
            {formatCurrency(totals.totalCommission + totals.totalTax)}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Ganancias Netas</span>
          <span className="summary-value success">
            {formatCurrency(totals.totalEarnings)}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Viajes Completados</span>
          <span className="summary-value">{allRidesTotals.completedCount}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Viajes Cancelados</span>
          <span className="summary-value error">{allRidesTotals.cancelledCount}</span>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="rides-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Duracion</th>
              <th>Distancia</th>
              <th>Estado</th>
              <th>Recibido</th>
              <th>Pagado</th>
              <th>Neto</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRides.map((ride, index) => (
              <tr
                key={ride.id}
                className={ride.status !== 'completed' ? 'row-cancelled' : ''}
              >
                <td className="cell-index">{startIndex + index + 1}</td>
                <td className="cell-date">{formatDate(ride.date)}</td>
                <td className="cell-time">{formatTime(ride.time)}</td>
                <td className="cell-duration">
                  {formatDuration(ride.duration_value, ride.duration_unit)}
                </td>
                <td className="cell-distance">
                  {formatDistance(ride.distance_value, ride.distance_unit)}
                </td>
                <td className="cell-status">
                  <span className={`status-badge status-${getStatusColor(ride.status)}`}>
                    {getStatusLabel(ride.status)}
                  </span>
                </td>
                <td className="cell-income">
                  <div className="income-breakdown">
                    <span className="income-value">
                      {formatCurrency(ride.base_fare)}
                    </span>
                    <span className="income-detail">
                      {ride.payment_method_label || 'Efectivo'}
                    </span>
                  </div>
                </td>
                <td className="cell-deductions">
                  <div className="deductions-breakdown">
                    <span className="deduction-value">
                      {formatCurrency(ride.total_paid)}
                    </span>
                    {ride.service_commission > 0 && (
                      <span className="deduction-detail">
                        Comision: {formatCurrency(ride.service_commission)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="cell-net">
                  <span className="net-value">
                    {formatCurrency(ride.net_earnings)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="totals-row">
              <td colSpan={6} className="totals-label">
                <strong>
                  Totales ({sortedRides.length} viajes: {totals.completedCount} completados
                  {totals.cancelledCount > 0 && `, ${totals.cancelledCount} cancelados`})
                </strong>
              </td>
              <td className="cell-income">
                <strong>{formatCurrency(totals.totalFare)}</strong>
              </td>
              <td className="cell-deductions">
                <strong>{formatCurrency(totals.totalCommission + totals.totalTax)}</strong>
              </td>
              <td className="cell-net">
                <strong>{formatCurrency(totals.totalEarnings)}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pagination */}
      {sortedRides.length > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            Mostrando {startIndex + 1}-{Math.min(endIndex, sortedRides.length)} de {sortedRides.length} viajes
          </div>
          <div className="page-size-selector">
            <label htmlFor="page-size">Mostrar:</label>
            <select
              id="page-size"
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="page-size-select"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="pagination-controls">
            <button
              type="button"
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Pagina anterior"
            >
              ←
            </button>

            {getPageNumbers().map((page, idx) =>
              page === 'ellipsis' ? (
                <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  type="button"
                  className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              )
            )}

            <button
              type="button"
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Pagina siguiente"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
