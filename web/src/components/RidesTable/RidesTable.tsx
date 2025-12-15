/**
 * Rides Table Component
 *
 * Displays ride data in an editable table format for dashboard view
 */

import { type FC, useState, useMemo, useRef, useEffect } from 'react';
import type { FirestoreInDriverRide, FirestoreDriver, FirestoreVehicle } from '@/core/firebase';
import type { StatusFilterOption } from '@/components/StatusFilter';
import type { SourceFilterOption } from '@/components/SourceFilter';
import './RidesTable.css';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

type EditableField =
  | 'date'
  | 'time'
  | 'duration'
  | 'distance'
  | 'base_fare'
  | 'total_paid'
  | 'service_commission'
  | 'service_tax'
  | 'net_earnings'
  | 'status'
  | 'driver'
  | 'vehicle'
  | 'source';

interface EditingState {
  rideId: string;
  field: EditableField;
}

interface RidesTableProps {
  rides: Array<FirestoreInDriverRide & { driver_name?: string; vehicle_plate?: string }>;
  isLoading: boolean;
  onImportClick?: () => void;
  onUpdateRide?: (id: string, updates: Partial<FirestoreInDriverRide>) => void;
  statusFilter?: StatusFilterOption;
  sourceFilter?: SourceFilterOption;
  showDriverColumn?: boolean;
  showVehicleColumn?: boolean;
  showSourceColumn?: boolean;
  drivers?: FirestoreDriver[];
  vehicles?: FirestoreVehicle[];
}

// Helper to convert Firestore Timestamp or string date to YYYY-MM-DD for HTML date input
const toInputDateFormat = (timestamp: { toDate: () => Date } | string | null): string => {
  if (!timestamp) return '';
  try {
    if (typeof timestamp === 'string') {
      // Already in string format (YYYY-MM-DD), return as-is
      return timestamp;
    }
    const date = timestamp.toDate();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};

// Editable Cell Component for inline editing
interface EditableCellProps {
  value: string | number;
  displayValue: string;
  isEditing: boolean;
  type: 'text' | 'number' | 'date' | 'time' | 'select';
  options?: { value: string; label: string }[];
  onStartEdit: () => void;
  onSave: (value: string | number) => void;
  onCancel: () => void;
  className?: string;
  disabled?: boolean;
}

const EditableCell: FC<EditableCellProps> = ({
  value,
  displayValue,
  isEditing,
  type,
  options,
  onStartEdit,
  onSave,
  onCancel,
  className = '',
  disabled = false,
}) => {
  const getInitialValue = () => {
    return String(value);
  };

  const [editValue, setEditValue] = useState(getInitialValue);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();

      if (inputRef.current instanceof HTMLInputElement) {
        if (type === 'date' || type === 'time') {
          setTimeout(() => {
            try {
              (inputRef.current as HTMLInputElement)?.showPicker();
            } catch {
              // showPicker() may not be supported
            }
          }, 50);
        } else {
          inputRef.current.select();
        }
      } else if (inputRef.current instanceof HTMLSelectElement && type === 'select') {
        setTimeout(() => {
          try {
            (inputRef.current as HTMLSelectElement)?.showPicker();
          } catch {
            inputRef.current?.click();
          }
        }, 50);
      }
    }
  }, [isEditing, type]);

  useEffect(() => {
    setEditValue(String(value));
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleSave = () => {
    if (type === 'number') {
      const numValue = parseFloat(editValue.replace(/[^\d.-]/g, ''));
      onSave(isNaN(numValue) ? 0 : numValue);
    } else {
      onSave(editValue);
    }
  };

  if (disabled) {
    return <span className={className}>{displayValue}</span>;
  }

  if (isEditing) {
    if (type === 'select' && options) {
      return (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            onSave(e.target.value);
          }}
          onBlur={onCancel}
          onKeyDown={handleKeyDown}
          className="editable-input editable-select"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    if (type === 'date') {
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="date"
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            if (e.target.value) {
              onSave(e.target.value);
            }
          }}
          onBlur={() => {
            if (editValue) {
              handleSave();
            } else {
              onCancel();
            }
          }}
          onKeyDown={handleKeyDown}
          className="editable-input editable-date"
        />
      );
    }

    const getInputClassName = () => {
      if (type === 'number') return 'editable-input editable-number';
      if (type === 'time') return 'editable-input editable-time';
      return 'editable-input';
    };

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={type === 'number' ? 'text' : type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={getInputClassName()}
      />
    );
  }

  return (
    <span
      className={`editable-cell ${className}`}
      onClick={onStartEdit}
      title="Haz clic para editar"
    >
      {displayValue}
      <span className="edit-icon">✎</span>
    </span>
  );
};

// Format helpers
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (timestamp: { toDate: () => Date } | string | null): string => {
  if (!timestamp) return '-';
  let date: Date;
  if (typeof timestamp === 'string') {
    // Handle string date (YYYY-MM-DD from HTML input after optimistic update)
    // Parse manually to avoid timezone issues
    const isoMatch = timestamp.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      // Create date at noon local time to avoid timezone edge cases
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
    } else {
      // Fallback with noon time to avoid timezone issues
      date = new Date(timestamp + 'T12:00:00');
    }
  } else {
    // Handle Firestore Timestamp
    date = timestamp.toDate();
  }
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
  totalPaid: number;
  totalEarnings: number;
  completedCount: number;
  cancelledCount: number;
  cancelledByPassengerCount: number;
  cancelledByDriverCount: number;
  cancelledUncategorizedCount: number;
}

const getDateTimestamp = (date: { toDate: () => Date } | string | null | undefined): number => {
  if (!date) return 0;
  if (typeof date === 'string') {
    // Parse YYYY-MM-DD at noon to avoid timezone issues
    const isoMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0).getTime();
    }
    return new Date(date + 'T12:00:00').getTime();
  }
  return date.toDate?.()?.getTime() ?? 0;
};

const sortRidesByDateAndTime = <T extends FirestoreInDriverRide>(rides: T[]): T[] => {
  return [...rides].sort((a, b) => {
    // First compare by date
    const dateA = getDateTimestamp(a.date);
    const dateB = getDateTimestamp(b.date);
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
    (acc, ride) => {
      const isCancelled = ride.status !== 'completed';
      const isCancelledByPassenger = ride.status === 'cancelled_by_passenger';
      const isCancelledByDriver = ride.status === 'cancelled_by_driver';
      const isUncategorized = isCancelled && !isCancelledByPassenger && !isCancelledByDriver;

      return {
        totalFare: acc.totalFare + (ride.base_fare || 0),
        totalCommission: acc.totalCommission + (ride.service_commission || 0),
        totalTax: acc.totalTax + (ride.service_tax || 0),
        totalPaid: acc.totalPaid + (ride.total_paid || 0),
        totalEarnings: acc.totalEarnings + (ride.net_earnings || 0),
        completedCount: acc.completedCount + (ride.status === 'completed' ? 1 : 0),
        cancelledCount: acc.cancelledCount + (isCancelled ? 1 : 0),
        cancelledByPassengerCount: acc.cancelledByPassengerCount + (isCancelledByPassenger ? 1 : 0),
        cancelledByDriverCount: acc.cancelledByDriverCount + (isCancelledByDriver ? 1 : 0),
        cancelledUncategorizedCount: acc.cancelledUncategorizedCount + (isUncategorized ? 1 : 0),
      };
    },
    {
      totalFare: 0,
      totalCommission: 0,
      totalTax: 0,
      totalPaid: 0,
      totalEarnings: 0,
      completedCount: 0,
      cancelledCount: 0,
      cancelledByPassengerCount: 0,
      cancelledByDriverCount: 0,
      cancelledUncategorizedCount: 0,
    }
  );
};

// Helper to get source label
const getSourceLabel = (category?: string): string => {
  switch (category) {
    case 'indriver':
      return 'InDriver';
    case 'external':
      return 'Externo';
    case 'independent':
      return 'Independiente';
    default:
      return 'Otro';
  }
};

export const RidesTable: FC<RidesTableProps> = ({
  rides,
  isLoading,
  onImportClick,
  onUpdateRide,
  statusFilter = 'all',
  sourceFilter = 'all',
  showDriverColumn = false,
  showVehicleColumn = false,
  showSourceColumn = false,
  drivers = [],
  vehicles = [],
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [editing, setEditing] = useState<EditingState | null>(null);

  // Memoized dropdown options
  const driverOptions = useMemo(
    () =>
      drivers.map((d) => ({
        value: d.id,
        label: d.name,
      })),
    [drivers]
  );

  const vehicleOptions = useMemo(
    () =>
      vehicles.map((v) => ({
        value: v.id,
        label: `${v.plate} - ${v.brand} ${v.model}`,
        driver_id: v.driver_id,
      })),
    [vehicles]
  );

  const sourceOptions = useMemo(
    () => [
      { value: 'indriver', label: 'InDriver' },
      { value: 'external', label: 'Externo' },
    ],
    []
  );

  // Map vehicle_id -> driver info for quick lookup
  const vehicleDriverMap = useMemo(() => {
    const map = new Map<string, { driver_id: string; driver_name: string }>();
    vehicles.forEach((v) => {
      const driver = drivers.find((d) => d.id === v.driver_id);
      map.set(v.id, {
        driver_id: v.driver_id,
        driver_name: driver?.name || '',
      });
    });
    return map;
  }, [vehicles, drivers]);

  const startEditing = (rideId: string, field: EditableField) => {
    if (onUpdateRide) {
      setEditing({ rideId, field });
    }
  };

  const stopEditing = () => {
    setEditing(null);
  };

  const isEditingField = (rideId: string, field: EditableField) => {
    return editing?.rideId === rideId && editing?.field === field;
  };

  const handleUpdateField = (
    ride: FirestoreInDriverRide,
    field: EditableField,
    value: string | number
  ) => {
    if (!onUpdateRide) return;

    const updates: Partial<FirestoreInDriverRide> = {};

    switch (field) {
      case 'date':
        // Pass the date string - Firestore will convert it
        updates.date = value as unknown as FirestoreInDriverRide['date'];
        break;
      case 'time':
        updates.time = value as string;
        break;
      case 'duration':
        updates.duration_value = value as number;
        break;
      case 'distance':
        updates.distance_value = value as number;
        break;
      case 'base_fare':
        updates.base_fare = value as number;
        updates.total_received = value as number;
        // Recalculate net earnings
        updates.net_earnings = (value as number) - ride.service_commission - ride.service_tax;
        break;
      case 'total_paid':
        updates.total_paid = value as number;
        // Adjust commission to match the new total (keep tax unchanged)
        updates.service_commission = (value as number) - ride.service_tax;
        // Recalculate net earnings
        updates.net_earnings = ride.base_fare - (value as number);
        break;
      case 'service_commission':
        updates.service_commission = value as number;
        updates.total_paid = (value as number) + ride.service_tax;
        // Recalculate net earnings
        updates.net_earnings = ride.base_fare - (value as number) - ride.service_tax;
        break;
      case 'service_tax':
        updates.service_tax = value as number;
        updates.total_paid = ride.service_commission + (value as number);
        // Recalculate net earnings
        updates.net_earnings = ride.base_fare - ride.service_commission - (value as number);
        break;
      case 'net_earnings':
        updates.net_earnings = value as number;
        // Adjust base_fare to match the new net earnings (keep deductions unchanged)
        updates.base_fare = (value as number) + ride.service_commission + ride.service_tax;
        updates.total_received = updates.base_fare;
        break;
      case 'status':
        updates.status = value as string;
        break;
      case 'source':
        updates.category = value as 'indriver' | 'independent' | 'external' | 'other';
        break;
      case 'vehicle': {
        const newVehicleId = value as string;
        updates.vehicle_id = newVehicleId;
        // Get the vehicle's driver info
        const vehicleInfo = vehicleDriverMap.get(newVehicleId);
        if (vehicleInfo) {
          // Also update driver_id to match vehicle owner
          updates.driver_id = vehicleInfo.driver_id;
        }
        break;
      }
      case 'driver': {
        const newDriverId = value as string;
        updates.driver_id = newDriverId;
        break;
      }
    }

    onUpdateRide(ride.id, updates);
    stopEditing();
  };

  // Filter rides by status and source
  const filteredRides = useMemo(() => {
    let filtered = rides;

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'completed') {
        filtered = filtered.filter((r) => r.status === 'completed');
      } else if (statusFilter === 'cancelled') {
        filtered = filtered.filter((r) => r.status !== 'completed');
      } else if (statusFilter === 'cancelled_by_passenger') {
        filtered = filtered.filter((r) => r.status === 'cancelled_by_passenger');
      } else if (statusFilter === 'cancelled_by_driver') {
        filtered = filtered.filter((r) => r.status === 'cancelled_by_driver');
      }
    }

    // Filter by source
    if (sourceFilter !== 'all') {
      filtered = filtered.filter((r) => r.category === sourceFilter);
    }

    return filtered;
  }, [rides, statusFilter, sourceFilter]);

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
          <span className="summary-value">{formatCurrency(totals.totalFare)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Pagado</span>
          <span className="summary-value">{formatCurrency(totals.totalPaid)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Ganancias Netas</span>
          <span className="summary-value success">{formatCurrency(totals.totalEarnings)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Viajes Completados</span>
          <span className="summary-value">{allRidesTotals.completedCount}</span>
        </div>
        <div className="summary-card summary-card-with-tooltip">
          <span className="summary-label">Viajes Cancelados</span>
          <span className="summary-value error">{allRidesTotals.cancelledCount}</span>
          {allRidesTotals.cancelledCount > 0 && (
            <div className="summary-tooltip">
              <div className="tooltip-row">
                <span>Pasajero:</span>
                <span>{allRidesTotals.cancelledByPassengerCount}</span>
              </div>
              <div className="tooltip-row">
                <span>Conductor:</span>
                <span>{allRidesTotals.cancelledByDriverCount}</span>
              </div>
              {allRidesTotals.cancelledUncategorizedCount > 0 && (
                <div className="tooltip-row">
                  <span>Sin categoría:</span>
                  <span>{allRidesTotals.cancelledUncategorizedCount}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="rides-table">
          <thead>
            <tr>
              <th>#</th>
              {showDriverColumn && <th>Conductor</th>}
              {showVehicleColumn && <th>Vehículo</th>}
              {showSourceColumn && <th>Fuente</th>}
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
              <tr key={ride.id} className={ride.status !== 'completed' ? 'row-cancelled' : ''}>
                <td className="cell-index">{startIndex + index + 1}</td>
                {showDriverColumn && (
                  <td className="cell-driver">
                    <EditableCell
                      value={ride.driver_id || ''}
                      displayValue={ride.driver_name || '-'}
                      isEditing={isEditingField(ride.id, 'driver')}
                      type="select"
                      options={driverOptions}
                      onStartEdit={() => startEditing(ride.id, 'driver')}
                      onSave={(value) => handleUpdateField(ride, 'driver', value)}
                      onCancel={stopEditing}
                      disabled={!onUpdateRide || drivers.length === 0}
                    />
                  </td>
                )}
                {showVehicleColumn && (
                  <td className="cell-vehicle">
                    <EditableCell
                      value={ride.vehicle_id || ''}
                      displayValue={ride.vehicle_plate || '-'}
                      isEditing={isEditingField(ride.id, 'vehicle')}
                      type="select"
                      options={vehicleOptions}
                      onStartEdit={() => startEditing(ride.id, 'vehicle')}
                      onSave={(value) => handleUpdateField(ride, 'vehicle', value)}
                      onCancel={stopEditing}
                      disabled={!onUpdateRide || vehicles.length === 0}
                    />
                  </td>
                )}
                {showSourceColumn && (
                  <td className="cell-source">
                    <EditableCell
                      value={ride.category || 'indriver'}
                      displayValue={getSourceLabel(ride.category)}
                      isEditing={isEditingField(ride.id, 'source')}
                      type="select"
                      options={sourceOptions}
                      onStartEdit={() => startEditing(ride.id, 'source')}
                      onSave={(value) => handleUpdateField(ride, 'source', value)}
                      onCancel={stopEditing}
                      className={`source-badge source-${ride.category || 'other'}`}
                      disabled={!onUpdateRide}
                    />
                  </td>
                )}
                <td className="cell-date">
                  <EditableCell
                    value={toInputDateFormat(ride.date)}
                    displayValue={formatDate(ride.date)}
                    isEditing={isEditingField(ride.id, 'date')}
                    type="date"
                    onStartEdit={() => startEditing(ride.id, 'date')}
                    onSave={(value) => handleUpdateField(ride, 'date', value)}
                    onCancel={stopEditing}
                    disabled={!onUpdateRide}
                  />
                </td>
                <td className="cell-time">
                  <EditableCell
                    value={ride.time}
                    displayValue={formatTime(ride.time)}
                    isEditing={isEditingField(ride.id, 'time')}
                    type="time"
                    onStartEdit={() => startEditing(ride.id, 'time')}
                    onSave={(value) => handleUpdateField(ride, 'time', value)}
                    onCancel={stopEditing}
                    disabled={!onUpdateRide}
                  />
                </td>
                <td className="cell-duration">
                  <EditableCell
                    value={ride.duration_value ?? 0}
                    displayValue={formatDuration(ride.duration_value, ride.duration_unit)}
                    isEditing={isEditingField(ride.id, 'duration')}
                    type="number"
                    onStartEdit={() => startEditing(ride.id, 'duration')}
                    onSave={(value) => handleUpdateField(ride, 'duration', value)}
                    onCancel={stopEditing}
                    disabled={!onUpdateRide}
                  />
                </td>
                <td className="cell-distance">
                  <EditableCell
                    value={ride.distance_value ?? 0}
                    displayValue={formatDistance(ride.distance_value, ride.distance_unit)}
                    isEditing={isEditingField(ride.id, 'distance')}
                    type="number"
                    onStartEdit={() => startEditing(ride.id, 'distance')}
                    onSave={(value) => handleUpdateField(ride, 'distance', value)}
                    onCancel={stopEditing}
                    disabled={!onUpdateRide}
                  />
                </td>
                <td className="cell-status">
                  <EditableCell
                    value={ride.status}
                    displayValue={getStatusLabel(ride.status)}
                    isEditing={isEditingField(ride.id, 'status')}
                    type="select"
                    options={[
                      { value: 'completed', label: 'Completado' },
                      { value: 'cancelled_by_passenger', label: 'Cancelado (pasajero)' },
                      { value: 'cancelled_by_driver', label: 'Cancelado (conductor)' },
                    ]}
                    onStartEdit={() => startEditing(ride.id, 'status')}
                    onSave={(value) => handleUpdateField(ride, 'status', value)}
                    onCancel={stopEditing}
                    className={`status-badge status-${getStatusColor(ride.status)}`}
                    disabled={!onUpdateRide}
                  />
                </td>
                <td className="cell-income">
                  <div className="income-breakdown">
                    <EditableCell
                      value={ride.base_fare}
                      displayValue={formatCurrency(ride.base_fare)}
                      isEditing={isEditingField(ride.id, 'base_fare')}
                      type="number"
                      onStartEdit={() => startEditing(ride.id, 'base_fare')}
                      onSave={(value) => handleUpdateField(ride, 'base_fare', value)}
                      onCancel={stopEditing}
                      className="income-value"
                      disabled={!onUpdateRide}
                    />
                    <span className="income-detail">{ride.payment_method_label || 'Efectivo'}</span>
                  </div>
                </td>
                <td className="cell-deductions">
                  <div className="deductions-breakdown">
                    <EditableCell
                      value={ride.total_paid}
                      displayValue={formatCurrency(ride.total_paid)}
                      isEditing={isEditingField(ride.id, 'total_paid')}
                      type="number"
                      onStartEdit={() => startEditing(ride.id, 'total_paid')}
                      onSave={(value) => handleUpdateField(ride, 'total_paid', value)}
                      onCancel={stopEditing}
                      className="deduction-value"
                      disabled={!onUpdateRide}
                    />
                    {ride.service_commission > 0 && (
                      <EditableCell
                        value={ride.service_commission}
                        displayValue={`Comisión: ${formatCurrency(ride.service_commission)}`}
                        isEditing={isEditingField(ride.id, 'service_commission')}
                        type="number"
                        onStartEdit={() => startEditing(ride.id, 'service_commission')}
                        onSave={(value) => handleUpdateField(ride, 'service_commission', value)}
                        onCancel={stopEditing}
                        className="deduction-detail"
                        disabled={!onUpdateRide}
                      />
                    )}
                    {ride.service_tax > 0 && (
                      <EditableCell
                        value={ride.service_tax}
                        displayValue={`IVA: ${formatCurrency(ride.service_tax)}`}
                        isEditing={isEditingField(ride.id, 'service_tax')}
                        type="number"
                        onStartEdit={() => startEditing(ride.id, 'service_tax')}
                        onSave={(value) => handleUpdateField(ride, 'service_tax', value)}
                        onCancel={stopEditing}
                        className="deduction-detail"
                        disabled={!onUpdateRide}
                      />
                    )}
                  </div>
                </td>
                <td className="cell-net">
                  <EditableCell
                    value={ride.net_earnings}
                    displayValue={formatCurrency(ride.net_earnings)}
                    isEditing={isEditingField(ride.id, 'net_earnings')}
                    type="number"
                    onStartEdit={() => startEditing(ride.id, 'net_earnings')}
                    onSave={(value) => handleUpdateField(ride, 'net_earnings', value)}
                    onCancel={stopEditing}
                    className="net-value"
                    disabled={!onUpdateRide}
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="totals-row">
              <td
                colSpan={
                  6 +
                  (showDriverColumn ? 1 : 0) +
                  (showVehicleColumn ? 1 : 0) +
                  (showSourceColumn ? 1 : 0)
                }
                className="totals-label"
              >
                <strong>
                  Totales ({sortedRides.length} viajes: {totals.completedCount} completados
                  {totals.cancelledCount > 0 && `, ${totals.cancelledCount} cancelados`})
                </strong>
              </td>
              <td className="cell-income">
                <strong>{formatCurrency(totals.totalFare)}</strong>
              </td>
              <td className="cell-deductions">
                <strong>{formatCurrency(totals.totalPaid)}</strong>
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
            Mostrando {startIndex + 1}-{Math.min(endIndex, sortedRides.length)} de{' '}
            {sortedRides.length} viajes
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
