/**
 * InsightsSummaryCards Component
 *
 * Displays 4 KPI cards showing daily metrics:
 * - Total Rides
 * - Total Revenue
 * - InDriver breakdown
 * - External breakdown
 */

import { type FC } from 'react';
import type { DailyMetrics } from '../types';
import './InsightsSummaryCards.css';

interface InsightsSummaryCardsProps {
  metrics: DailyMetrics | null;
  isLoading: boolean;
}

/**
 * Format currency in Colombian locale
 */
function formatCurrency(amount: number): string {
  return amount.toLocaleString('es-CO');
}

/**
 * Format percentage change with sign
 */
function formatChange(value: number | null): { text: string; positive: boolean } | null {
  if (value === null) return null;
  return {
    text: `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`,
    positive: value >= 0,
  };
}

export const InsightsSummaryCards: FC<InsightsSummaryCardsProps> = ({ metrics, isLoading }) => {
  if (isLoading) {
    return (
      <div className="insights-summary-cards">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="summary-card summary-card--loading" />
        ))}
      </div>
    );
  }

  const ridesChange = formatChange(metrics?.rides_change_percent ?? null);
  const revenueChange = formatChange(metrics?.revenue_change_percent ?? null);

  return (
    <div className="insights-summary-cards">
      {/* Total Rides */}
      <div className="summary-card">
        <div className="summary-card__icon">{'\u{1F697}'}</div>
        <div className="summary-card__content">
          <span className="summary-card__label">Total Viajes</span>
          <span className="summary-card__value">{metrics?.completed_rides ?? 0}</span>
          {ridesChange && (
            <span
              className={`summary-card__change ${ridesChange.positive ? 'summary-card__change--positive' : 'summary-card__change--negative'}`}
            >
              {ridesChange.positive ? '\u{2191}' : '\u{2193}'} {ridesChange.text} vs ayer
            </span>
          )}
        </div>
      </div>

      {/* Total Revenue */}
      <div className="summary-card">
        <div className="summary-card__icon">{'\u{1F4B0}'}</div>
        <div className="summary-card__content">
          <span className="summary-card__label">Ingresos Totales</span>
          <span className="summary-card__value">${formatCurrency(metrics?.total_revenue ?? 0)}</span>
          {revenueChange && (
            <span
              className={`summary-card__change ${revenueChange.positive ? 'summary-card__change--positive' : 'summary-card__change--negative'}`}
            >
              {revenueChange.positive ? '\u{2191}' : '\u{2193}'} {revenueChange.text} vs ayer
            </span>
          )}
        </div>
      </div>

      {/* InDriver Breakdown */}
      <div className="summary-card">
        <div className="summary-card__icon">{'\u{1F4F1}'}</div>
        <div className="summary-card__content">
          <span className="summary-card__label">InDriver</span>
          <span className="summary-card__value">
            {metrics?.source_breakdown?.indriver?.count ?? 0} viajes
          </span>
          <span className="summary-card__detail">
            ({metrics?.source_breakdown?.indriver?.percentage?.toFixed(1) ?? 0}%) $
            {formatCurrency(metrics?.source_breakdown?.indriver?.revenue ?? 0)} COP
          </span>
        </div>
      </div>

      {/* External Breakdown */}
      <div className="summary-card summary-card--highlight">
        <div className="summary-card__icon">{'\u{1F4DE}'}</div>
        <div className="summary-card__content">
          <span className="summary-card__label">Externos</span>
          <span className="summary-card__value">
            {metrics?.source_breakdown?.external?.count ?? 0} viajes
          </span>
          <span className="summary-card__detail">
            ({metrics?.source_breakdown?.external?.percentage?.toFixed(1) ?? 0}%) $
            {formatCurrency(metrics?.source_breakdown?.external?.revenue ?? 0)} COP
          </span>
        </div>
      </div>
    </div>
  );
};
