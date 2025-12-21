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

// Decimal formatting for averages
const formatDecimal = (num: number): string => {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(num);
};

export const SummaryCards: FC<SummaryCardsProps> = ({ aggregations, isLoading }) => {
  if (isLoading) {
    return (
      <div className="reporting-summary-cards">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
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
  const totalPaid = aggregations?.totalPaid ?? 0;
  const totalVehicleIncome = aggregations?.totalVehicleIncome ?? 0;
  const totalVehicleExpenses = aggregations?.totalVehicleExpenses ?? 0;
  const netProfit = aggregations?.netProfit ?? 0;
  const averagePerRide = aggregations?.averagePerRide ?? 0;
  const averageRidesPerDay = aggregations?.averageRidesPerDay ?? 0;

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

      {/* Average Rides per Day */}
      <div className="summary-card card-rides-avg">
        <div className="card-icon">📊</div>
        <div className="card-content">
          <span className="card-label">Promedio Diario</span>
          <span className="card-value value-rides-avg">{formatDecimal(averageRidesPerDay)}</span>
          <span className="card-detail">viajes por día</span>
        </div>
      </div>

      {/* Total Paid - commissions paid by drivers */}
      <div className="summary-card card-total-paid">
        <div className="card-icon">💸</div>
        <div className="card-content">
          <span className="card-label">Total Pagado</span>
          <span className="card-value value-paid">{formatCurrency(totalPaid)}</span>
          <span className="card-detail">en comisiones</span>
        </div>
      </div>

      {/* Platform Revenue - from rides (total_received) */}
      <div className="summary-card card-revenue">
        <div className="card-icon">📱</div>
        <div className="card-content">
          <span className="card-label">Total Recibido</span>
          <span className="card-value value-income">{formatCurrency(totalRevenue)}</span>
          <span className="card-detail">en plataformas</span>
        </div>
      </div>

      {/* Actual Vehicle Income - from finances */}
      <div className="summary-card card-actual-income">
        <div className="card-icon">💰</div>
        <div className="card-content">
          <span className="card-label">Ingresos Reales</span>
          <span className="card-value value-actual">{formatCurrency(totalVehicleIncome)}</span>
          <span className="card-detail">
            {totalVehicleExpenses > 0
              ? `gastos: ${formatCurrency(totalVehicleExpenses)}`
              : 'de vehículos'}
          </span>
        </div>
      </div>

      {/* Net Profit */}
      <div className={`summary-card card-profit ${netProfit >= 0 ? 'positive' : 'negative'}`}>
        <div className="card-icon">{netProfit >= 0 ? '📈' : '📉'}</div>
        <div className="card-content">
          <span className="card-label">Ganancia Neta</span>
          <span className={`card-value ${netProfit >= 0 ? 'value-profit' : 'value-loss'}`}>
            {formatCurrency(netProfit)}
          </span>
          <span className="card-detail">ingresos - gastos</span>
        </div>
      </div>

      {/* Average per Ride */}
      <div className="summary-card card-average">
        <div className="card-icon">⚡</div>
        <div className="card-content">
          <span className="card-label">Promedio por Viaje</span>
          <span className="card-value value-average">{formatCurrency(averagePerRide)}</span>
          <span className="card-detail">por viaje</span>
        </div>
      </div>
    </div>
  );
};
