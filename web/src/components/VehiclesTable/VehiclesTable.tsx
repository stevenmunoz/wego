/**
 * Vehicles Table Component
 *
 * Displays vehicle data in a table format with edit/delete actions
 */

import { type FC } from 'react';
import type { FirestoreVehicle } from '@/core/firebase';
import type { VehicleStatus } from '@/core/types';
import './VehiclesTable.css';

interface VehiclesTableProps {
  vehicles: FirestoreVehicle[];
  isLoading: boolean;
  onAddClick?: () => void;
  onEditVehicle?: (vehicle: FirestoreVehicle) => void;
  onDeleteVehicle?: (id: string) => void;
  onSetPrimary?: (id: string) => void;
}

// Status helpers
const getStatusLabel = (status: VehicleStatus): string => {
  const labels: Record<VehicleStatus, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    maintenance: 'En mantenimiento',
    pending_approval: 'Pendiente',
  };
  return labels[status] || status;
};

const getStatusColor = (status: VehicleStatus): string => {
  switch (status) {
    case 'active':
      return 'success';
    case 'inactive':
      return 'warning';
    case 'maintenance':
      return 'info';
    case 'pending_approval':
      return 'pending';
    default:
      return 'default';
  }
};

// Vehicle type helpers
const getVehicleTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    car: 'Automóvil',
    suv: 'Camioneta',
    van: 'Van',
    motorcycle: 'Motocicleta',
  };
  return labels[type] || type;
};

// Date format for display
const formatDate = (timestamp: { toDate: () => Date } | null): string => {
  if (!timestamp) return '-';
  const date = timestamp.toDate();
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

// Check if document is expiring soon (within 30 days) or expired
const getExpiryStatus = (timestamp: { toDate: () => Date } | null): 'ok' | 'warning' | 'expired' => {
  if (!timestamp) return 'ok';
  const date = timestamp.toDate();
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (date < now) return 'expired';
  if (date < thirtyDaysFromNow) return 'warning';
  return 'ok';
};

export const VehiclesTable: FC<VehiclesTableProps> = ({
  vehicles,
  isLoading,
  onAddClick,
  onEditVehicle,
  onDeleteVehicle,
  onSetPrimary,
}) => {
  const handleDelete = (vehicleId: string) => {
    if (onDeleteVehicle && window.confirm('¿Estás seguro de eliminar este vehículo?')) {
      onDeleteVehicle(vehicleId);
    }
  };

  if (isLoading) {
    return (
      <div className="vehicles-table-loading">
        <div className="spinner"></div>
        <p>Cargando vehículos...</p>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="vehicles-table-empty">
        <div className="empty-icon">🚙</div>
        <h3>No hay vehículos registrados</h3>
        <p>Agrega tu primer vehículo para comenzar</p>
        {onAddClick && (
          <button type="button" className="btn btn-primary" onClick={onAddClick}>
            Agregar Vehículo
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="vehicles-table-container">
      {/* Summary */}
      <div className="summary-bar">
        <div className="summary-item">
          <span className="summary-count">{vehicles.length}</span>
          <span className="summary-label">Vehículo{vehicles.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="summary-item">
          <span className="summary-count">{vehicles.filter((v) => v.status === 'active').length}</span>
          <span className="summary-label">Activo{vehicles.filter((v) => v.status === 'active').length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="vehicles-table">
          <thead>
            <tr>
              <th className="th-photo">Foto</th>
              <th>Placa</th>
              <th>Vehículo</th>
              <th>Tipo</th>
              <th>Color</th>
              <th>Capacidad</th>
              <th>SOAT</th>
              <th>Tecnomecánica</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => {
              const soatStatus = getExpiryStatus(vehicle.soat_expiry);
              const tecnoStatus = getExpiryStatus(vehicle.tecnomecanica_expiry);

              return (
                <tr key={vehicle.id} className={vehicle.is_primary ? 'row-primary' : ''}>
                  <td className="cell-photo">
                    {vehicle.photo_url ? (
                      <img
                        src={vehicle.photo_url}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        className="vehicle-thumbnail"
                      />
                    ) : (
                      <div className="vehicle-thumbnail-placeholder">🚗</div>
                    )}
                  </td>
                  <td className="cell-plate">
                    <span>{vehicle.plate}</span>
                    {vehicle.is_primary && <span className="primary-badge">Principal</span>}
                  </td>
                  <td className="cell-vehicle">
                    <div className="vehicle-info">
                      <span className="vehicle-brand">{vehicle.brand}</span>
                      <span className="vehicle-model">{vehicle.model}</span>
                      <span className="vehicle-year">{vehicle.year}</span>
                    </div>
                  </td>
                  <td className="cell-type">{getVehicleTypeLabel(vehicle.vehicle_type)}</td>
                  <td className="cell-color">{vehicle.color}</td>
                  <td className="cell-capacity">{vehicle.passenger_capacity} pasajeros</td>
                  <td className={`cell-document expiry-${soatStatus}`}>
                    {formatDate(vehicle.soat_expiry)}
                    {soatStatus === 'expired' && <span className="expiry-tag">Vencido</span>}
                    {soatStatus === 'warning' && <span className="expiry-tag warning">Por vencer</span>}
                  </td>
                  <td className={`cell-document expiry-${tecnoStatus}`}>
                    {formatDate(vehicle.tecnomecanica_expiry)}
                    {tecnoStatus === 'expired' && <span className="expiry-tag">Vencido</span>}
                    {tecnoStatus === 'warning' && <span className="expiry-tag warning">Por vencer</span>}
                  </td>
                  <td className="cell-status">
                    <span className={`status-badge status-${getStatusColor(vehicle.status)}`}>
                      {getStatusLabel(vehicle.status)}
                    </span>
                  </td>
                  <td className="cell-actions">
                    {onEditVehicle && (
                      <button
                        type="button"
                        className="btn-action btn-edit"
                        onClick={() => onEditVehicle(vehicle)}
                        title="Editar vehículo"
                      >
                        ✎
                      </button>
                    )}
                    {!vehicle.is_primary && onSetPrimary && (
                      <button
                        type="button"
                        className="btn-action btn-set-primary"
                        onClick={() => onSetPrimary(vehicle.id)}
                        title="Establecer como principal"
                      >
                        ★
                      </button>
                    )}
                    {onDeleteVehicle && (
                      <button
                        type="button"
                        className="btn-action btn-delete"
                        onClick={() => handleDelete(vehicle.id)}
                        title="Eliminar vehículo"
                      >
                        🗑
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
