/**
 * Cancellation Rate Component
 *
 * Displays cancellation statistics with breakdown by reason.
 */

import { type FC } from 'react';
import type { CancellationBreakdown } from '../types';
import './CancellationRate.css';

interface CancellationRateProps {
  data: CancellationBreakdown | null;
  isLoading: boolean;
}

export const CancellationRate: FC<CancellationRateProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="cancellation-rate">
        <h3 className="section-title">Cancelaciones</h3>
        <div className="cards-grid loading">
          {[1, 2, 3].map((i) => (
            <div key={i} className="cancel-card skeleton"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="cancellation-rate">
        <h3 className="section-title">Cancelaciones</h3>
        <div className="empty-state">
          <span className="empty-icon">📊</span>
          <p>No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  const rateStatus =
    data.cancellationRate < 5
      ? 'good'
      : data.cancellationRate < 10
        ? 'warning'
        : 'bad';

  return (
    <div className="cancellation-rate">
      <h3 className="section-title">Cancelaciones</h3>

      <div className="cards-grid">
        {/* Total Cancellation Rate */}
        <div className={`cancel-card rate-card status-${rateStatus}`}>
          <div className="card-header">
            <span className="card-icon">📉</span>
            <span className="card-title">Tasa de Cancelacion</span>
          </div>
          <div className="card-value">{data.cancellationRate.toFixed(1)}%</div>
          <div className="card-detail">
            {data.totalCancelled} de {data.totalRides} viajes
          </div>
        </div>

        {/* By Passenger */}
        <div className="cancel-card passenger-card">
          <div className="card-header">
            <span className="card-icon">🚶</span>
            <span className="card-title">Por Pasajero</span>
          </div>
          <div className="card-value">{data.byPassenger}</div>
          <div className="card-detail">
            {data.totalCancelled > 0
              ? ((data.byPassenger / data.totalCancelled) * 100).toFixed(0)
              : 0}
            % del total
          </div>
        </div>

        {/* By Driver */}
        <div className="cancel-card driver-card">
          <div className="card-header">
            <span className="card-icon">🚗</span>
            <span className="card-title">Por Conductor</span>
          </div>
          <div className="card-value">{data.byDriver}</div>
          <div className="card-detail">
            {data.totalCancelled > 0
              ? ((data.byDriver / data.totalCancelled) * 100).toFixed(0)
              : 0}
            % del total
          </div>
        </div>
      </div>
    </div>
  );
};
