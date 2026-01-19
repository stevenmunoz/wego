/**
 * VehicleFinanceCard Component
 *
 * Compact card showing vehicle weekly P/L summary.
 * Displays: plate, name, rides, km, income, expenses (top 3), profit.
 */

import { type FC } from 'react';
import type { WeeklyVehicleFinance } from '../../types/insights.types';
import './VehicleFinanceCard.css';

interface VehicleFinanceCardProps {
  /** Vehicle finance data */
  vehicle: WeeklyVehicleFinance;
}

/**
 * Format number as Colombian pesos (COP)
 */
function formatCOP(amount: number): string {
  return amount.toLocaleString('es-CO');
}

export const VehicleFinanceCard: FC<VehicleFinanceCardProps> = ({ vehicle }) => {
  const { vehicle_plate, vehicle_name, rides_count, total_km, total_income, expenses, net_profit } =
    vehicle;

  const isProfit = net_profit >= 0;

  // Build expense breakdown string
  const expenseBreakdown = expenses.top_categories
    .map((cat) => `${cat.label} $${formatCOP(cat.amount)}`)
    .join(' | ');

  return (
    <div className="vehicle-finance-card">
      <header className="vehicle-finance-card__header">
        <span className="vehicle-finance-card__plate">{vehicle_plate}</span>
        <span className="vehicle-finance-card__name">({vehicle_name})</span>
      </header>

      <div className="vehicle-finance-card__body">
        <div className="vehicle-finance-card__row">
          <span className="vehicle-finance-card__label">Ingresos:</span>
          <span className="vehicle-finance-card__value vehicle-finance-card__value--income">
            ${formatCOP(total_income)} COP
          </span>
          <span className="vehicle-finance-card__meta">
            {rides_count} viajes | {formatCOP(total_km)} km
          </span>
        </div>

        <div className="vehicle-finance-card__row">
          <span className="vehicle-finance-card__label">Gastos:</span>
          <span className="vehicle-finance-card__value vehicle-finance-card__value--expense">
            ${formatCOP(expenses.total)} COP
          </span>
          {expenses.top_categories.length > 0 && (
            <span className="vehicle-finance-card__breakdown">└─ {expenseBreakdown}</span>
          )}
        </div>

        <div className="vehicle-finance-card__row vehicle-finance-card__row--profit">
          <span className="vehicle-finance-card__label">Utilidad:</span>
          <span
            className={`vehicle-finance-card__value vehicle-finance-card__value--profit ${isProfit ? 'positive' : 'negative'}`}
          >
            ${formatCOP(net_profit)} COP
          </span>
        </div>
      </div>
    </div>
  );
};
