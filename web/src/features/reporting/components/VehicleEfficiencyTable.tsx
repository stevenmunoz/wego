/**
 * Vehicle Efficiency Table Component
 *
 * Sortable table showing vehicle performance metrics with utilization.
 */

import { type FC, useState, useMemo } from 'react';
import type { VehicleEfficiency } from '../types';
import './VehicleEfficiencyTable.css';

interface VehicleEfficiencyTableProps {
  data: VehicleEfficiency[];
  isLoading: boolean;
}

type SortField = 'plate' | 'rideCount' | 'revenue' | 'activeDays' | 'utilizationPercent';
type SortDirection = 'asc' | 'desc';

// Currency formatting
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Utilization status
const getUtilizationStatus = (percent: number): 'high' | 'medium' | 'low' => {
  if (percent >= 70) return 'high';
  if (percent >= 40) return 'medium';
  return 'low';
};

export const VehicleEfficiencyTable: FC<VehicleEfficiencyTableProps> = ({
  data,
  isLoading,
}) => {
  const [sortField, setSortField] = useState<SortField>('rideCount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      let aValue: number | string = a[sortField];
      let bValue: number | string = b[sortField];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortDirection]);

  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (isLoading) {
    return (
      <div className="vehicle-efficiency-table">
        <h3 className="section-title">Eficiencia por Vehiculo</h3>
        <div className="table-skeleton">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="row-skeleton skeleton"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="vehicle-efficiency-table">
        <h3 className="section-title">Eficiencia por Vehiculo</h3>
        <div className="empty-state">
          <span className="empty-icon">🚙</span>
          <p>No hay datos de vehiculos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vehicle-efficiency-table">
      <h3 className="section-title">Eficiencia por Vehiculo</h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('plate')} className="sortable">
                Vehiculo {getSortIcon('plate')}
              </th>
              <th onClick={() => handleSort('rideCount')} className="sortable align-right">
                Viajes {getSortIcon('rideCount')}
              </th>
              <th onClick={() => handleSort('revenue')} className="sortable align-right">
                Ingresos {getSortIcon('revenue')}
              </th>
              <th onClick={() => handleSort('activeDays')} className="sortable align-right">
                Dias Activos {getSortIcon('activeDays')}
              </th>
              <th onClick={() => handleSort('utilizationPercent')} className="sortable align-right">
                Utilizacion {getSortIcon('utilizationPercent')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((vehicle) => {
              const status = getUtilizationStatus(vehicle.utilizationPercent);

              return (
                <tr key={vehicle.vehicleId}>
                  <td className="vehicle-plate">
                    <span className="plate-badge">{vehicle.plate}</span>
                  </td>
                  <td className="align-right mono">{vehicle.rideCount}</td>
                  <td className="align-right mono">{formatCurrency(vehicle.revenue)}</td>
                  <td className="align-right mono">
                    {vehicle.activeDays}/{vehicle.totalDays}
                  </td>
                  <td className="align-right">
                    <div className="utilization-cell">
                      <div className="utilization-bar">
                        <div
                          className={`utilization-fill status-${status}`}
                          style={{ width: `${Math.min(100, vehicle.utilizationPercent)}%` }}
                        ></div>
                      </div>
                      <span className={`utilization-value status-${status}`}>
                        {vehicle.utilizationPercent.toFixed(0)}%
                      </span>
                    </div>
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
