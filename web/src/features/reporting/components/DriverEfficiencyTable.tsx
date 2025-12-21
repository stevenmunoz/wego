/**
 * Driver Efficiency Table Component
 *
 * Sortable table showing driver performance metrics with goal comparison.
 */

import { type FC, useState, useMemo } from 'react';
import type { DriverEfficiency, ReportingGoal } from '../types';
import './DriverEfficiencyTable.css';

interface DriverEfficiencyTableProps {
  data: DriverEfficiency[];
  goal: ReportingGoal | null;
  isLoading: boolean;
}

type SortField = 'driverName' | 'rideCount' | 'revenue' | 'avgPerRide' | 'completionRate';
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

// Calculate goal achievement percentage
const calculateGoalAchievement = (
  rideCount: number,
  revenue: number,
  goal: ReportingGoal | null
): { percent: number; status: 'exceeded' | 'met' | 'warning' | 'below' } | null => {
  if (!goal) return null;

  const isRevenue = goal.target_type.includes('revenue');

  // Assume data is for the period matching the goal
  const actual = isRevenue ? revenue : rideCount;
  const target = goal.target_value;

  const percent = target > 0 ? (actual / target) * 100 : 0;

  let status: 'exceeded' | 'met' | 'warning' | 'below';
  if (percent >= 100) {
    status = 'exceeded';
  } else if (percent >= 90) {
    status = 'met';
  } else if (percent >= 70) {
    status = 'warning';
  } else {
    status = 'below';
  }

  return { percent, status };
};

export const DriverEfficiencyTable: FC<DriverEfficiencyTableProps> = ({
  data,
  goal,
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
      <div className="driver-efficiency-table">
        <h3 className="section-title">Eficiencia por Conductor</h3>
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
      <div className="driver-efficiency-table">
        <h3 className="section-title">Eficiencia por Conductor</h3>
        <div className="empty-state">
          <span className="empty-icon">👥</span>
          <p>No hay datos de conductores</p>
        </div>
      </div>
    );
  }

  return (
    <div className="driver-efficiency-table">
      <h3 className="section-title">Eficiencia por Conductor</h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('driverName')} className="sortable">
                Conductor {getSortIcon('driverName')}
              </th>
              <th onClick={() => handleSort('rideCount')} className="sortable align-right">
                Viajes {getSortIcon('rideCount')}
              </th>
              <th onClick={() => handleSort('revenue')} className="sortable align-right">
                Ingresos {getSortIcon('revenue')}
              </th>
              <th onClick={() => handleSort('avgPerRide')} className="sortable align-right">
                Prom/Viaje {getSortIcon('avgPerRide')}
              </th>
              {goal && <th className="align-center">vs Meta</th>}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((driver) => {
              const achievement = calculateGoalAchievement(driver.rideCount, driver.revenue, goal);

              return (
                <tr key={driver.driverId}>
                  <td className="driver-name">
                    <span className="name-text">{driver.driverName}</span>
                  </td>
                  <td className="align-right mono">{driver.rideCount}</td>
                  <td className="align-right mono">{formatCurrency(driver.revenue)}</td>
                  <td className="align-right mono">{formatCurrency(driver.avgPerRide)}</td>
                  {goal && achievement && (
                    <td className="align-center">
                      <span className={`goal-badge status-${achievement.status}`}>
                        {achievement.percent >= 100 ? '+' : ''}
                        {(achievement.percent - 100).toFixed(0)}%
                      </span>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
