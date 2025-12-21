/**
 * P/L Summary Cards Component
 *
 * Displays income, expenses, and profit summary
 */

import { type FC } from 'react';
import type { VehiclePLSummary } from '@/core/types';
import './PLSummaryCards.css';

interface PLSummaryCardsProps {
  summary: VehiclePLSummary;
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

// Percentage formatting
const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

export const PLSummaryCards: FC<PLSummaryCardsProps> = ({ summary }) => {
  const isProfitable = summary.net_profit >= 0;

  return (
    <div className="pl-summary-container">
      <div className="summary-cards">
        {/* Total Income */}
        <div className="summary-card card-income">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <span className="card-label">Total Ingresos</span>
            <span className="card-value value-income">{formatCurrency(summary.total_income)}</span>
            <span className="card-detail">
              {summary.income_count} registro{summary.income_count !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="summary-card card-expense">
          <div className="card-icon">📉</div>
          <div className="card-content">
            <span className="card-label">Total Gastos</span>
            <span className="card-value value-expense">
              {formatCurrency(summary.total_expenses)}
            </span>
            <span className="card-detail">
              {summary.expense_count} registro{summary.expense_count !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Net Profit */}
        <div className={`summary-card card-profit ${isProfitable ? 'profitable' : 'loss'}`}>
          <div className="card-icon">{isProfitable ? '📈' : '📉'}</div>
          <div className="card-content">
            <span className="card-label">Ganancia Neta</span>
            <span className={`card-value ${isProfitable ? 'value-profit' : 'value-loss'}`}>
              {formatCurrency(summary.net_profit)}
            </span>
            <span className="card-detail">{isProfitable ? 'Utilidad' : 'Pérdida'}</span>
          </div>
        </div>

        {/* Profit Margin */}
        <div className="summary-card card-margin">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <span className="card-label">Margen</span>
            <span className={`card-value ${isProfitable ? 'value-profit' : 'value-loss'}`}>
              {summary.total_income > 0 ? formatPercentage(summary.profit_margin) : '—'}
            </span>
            <span className="card-detail">
              {summary.total_income > 0
                ? isProfitable
                  ? 'Rentable'
                  : 'No rentable'
                : 'Sin ingresos'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
