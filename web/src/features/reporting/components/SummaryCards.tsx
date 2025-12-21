/**
 * Summary Cards Component
 *
 * Displays 4 KPI cards: Total Rides, Total Revenue, Commissions, Average per Ride
 */

import { type FC } from 'react';
import type { ReportingAggregations } from '../types';
import './SummaryCards.css';

interface SummaryCardsProps {
  aggregations: ReportingAggregations | null;
  isLoading: boolean;
}

// Currency formatting for Colombian locale
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Number formatting
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('es-CO').format(num);
};

export const SummaryCards: FC<SummaryCardsProps> = ({ aggregations, isLoading }) => {
  if (isLoading) {
    return (
      <div className="reporting-summary-cards">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="summary-card loading">
            <div className="card-icon skeleton"></div>
            <div className="card-content">
              <span className="card-label skeleton"></span>
              <span className="card-value skeleton"></span>
              <span className="card-detail skeleton"></span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const totalRides = aggregations?.completedRides ?? 0;
  const totalRevenue = aggregations?.totalRevenue ?? 0;
  const totalCommissions = aggregations?.totalCommissions ?? 0;
  const averagePerRide = aggregations?.averagePerRide ?? 0;

  return (
    <div className="reporting-summary-cards">
      {/* Total Rides */}
      <div className="summary-card card-rides">
        <div className="card-icon">🚗</div>
        <div className="card-content">
          <span className="card-label">Total Viajes</span>
          <span className="card-value value-primary">{formatNumber(totalRides)}</span>
          <span className="card-detail">viajes completados</span>
        </div>
      </div>

      {/* Total Revenue */}
      <div className="summary-card card-revenue">
        <div className="card-icon">💰</div>
        <div className="card-content">
          <span className="card-label">Ingresos Totales</span>
          <span className="card-value value-income">{formatCurrency(totalRevenue)}</span>
          <span className="card-detail">facturado</span>
        </div>
      </div>

      {/* Commissions */}
      <div className="summary-card card-commissions">
        <div className="card-icon">📊</div>
        <div className="card-content">
          <span className="card-label">Comisiones</span>
          <span className="card-value value-commission">{formatCurrency(totalCommissions)}</span>
          <span className="card-detail">recaudado</span>
        </div>
      </div>

      {/* Average per Ride */}
      <div className="summary-card card-average">
        <div className="card-icon">📈</div>
        <div className="card-content">
          <span className="card-label">Promedio por Viaje</span>
          <span className="card-value value-average">{formatCurrency(averagePerRide)}</span>
          <span className="card-detail">por viaje</span>
        </div>
      </div>
    </div>
  );
};
