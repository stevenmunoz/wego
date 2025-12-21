/**
 * Vehicle Finance Charts Component
 *
 * Displays income and expense breakdown charts for vehicle finances.
 */

import { type FC } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import type { IncomeByTypeBreakdown, ExpensesByCategoryBreakdown } from '../types';
import {
  INCOME_TYPE_LABELS,
  EXPENSE_CATEGORY_LABELS,
} from '@/core/types/vehicle-finance.types';
import './VehicleFinanceCharts.css';

interface VehicleFinanceChartsProps {
  totalIncome: number;
  totalExpenses: number;
  incomeByType: IncomeByTypeBreakdown;
  expensesByCategory: ExpensesByCategoryBreakdown;
  isLoading: boolean;
}

// Colors for income types
const INCOME_COLORS: Record<string, string> = {
  weekly_payment: '#16a34a', // Green
  tip_share: '#22c55e',
  bonus: '#4ade80',
  other: '#86efac',
};

// Colors for expense categories
const EXPENSE_COLORS: Record<string, string> = {
  fuel: '#ef4444', // Red shades
  maintenance: '#f97316', // Orange
  insurance_soat: '#eab308', // Yellow
  tecnomecanica: '#84cc16', // Lime
  taxes: '#06b6d4', // Cyan
  fines: '#8b5cf6', // Purple
  parking: '#ec4899', // Pink
  car_wash: '#14b8a6', // Teal
  accessories: '#f59e0b', // Amber
  other: '#6b7280', // Gray
};

// Currency formatting
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Custom tooltip for pie charts
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }> }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="finance-chart-tooltip">
        <p className="tooltip-label">{data.name}</p>
        <p className="tooltip-value" style={{ color: data.payload.color }}>
          {formatCurrency(data.value)}
        </p>
      </div>
    );
  }
  return null;
};

export const VehicleFinanceCharts: FC<VehicleFinanceChartsProps> = ({
  totalIncome,
  totalExpenses,
  incomeByType,
  expensesByCategory,
  isLoading,
}) => {
  // Prepare income data for pie chart
  const incomeData = Object.entries(incomeByType)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      name: INCOME_TYPE_LABELS[key as keyof typeof INCOME_TYPE_LABELS] || key,
      value,
      color: INCOME_COLORS[key] || '#86efac',
    }));

  // Prepare expenses data for pie chart
  const expensesData = Object.entries(expensesByCategory)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      name: EXPENSE_CATEGORY_LABELS[key as keyof typeof EXPENSE_CATEGORY_LABELS] || key,
      value,
      color: EXPENSE_COLORS[key] || '#6b7280',
    }));

  // Prepare comparison data for bar chart
  const comparisonData = [
    { name: 'Ingresos', value: totalIncome, color: '#16a34a' },
    { name: 'Gastos', value: totalExpenses, color: '#ef4444' },
  ];

  const hasIncomeData = incomeData.length > 0;
  const hasExpenseData = expensesData.length > 0;
  const hasAnyData = hasIncomeData || hasExpenseData || totalIncome > 0 || totalExpenses > 0;

  if (isLoading) {
    return (
      <div className="vehicle-finance-charts">
        <div className="finance-chart-card loading">
          <div className="skeleton chart-skeleton"></div>
        </div>
        <div className="finance-chart-card loading">
          <div className="skeleton chart-skeleton"></div>
        </div>
      </div>
    );
  }

  if (!hasAnyData) {
    return (
      <div className="vehicle-finance-charts">
        <div className="finance-chart-card empty-state">
          <div className="empty-icon">💰</div>
          <h4>Sin datos de finanzas</h4>
          <p>No hay ingresos ni gastos registrados en este período.</p>
          <p className="empty-hint">Registra transacciones en /finanzas para verlas aquí.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vehicle-finance-charts">
      {/* Income vs Expenses Comparison */}
      <div className="finance-chart-card">
        <h3 className="chart-title">Ingresos vs Gastos</h3>
        <div className="chart-container bar-chart">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={comparisonData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis
                type="number"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                width={70}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value) || 0), '']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {comparisonData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-summary">
          <div className="summary-item income">
            <span className="summary-label">Total Ingresos</span>
            <span className="summary-value">{formatCurrency(totalIncome)}</span>
          </div>
          <div className="summary-item expenses">
            <span className="summary-label">Total Gastos</span>
            <span className="summary-value">{formatCurrency(totalExpenses)}</span>
          </div>
          <div className={`summary-item net ${totalIncome - totalExpenses >= 0 ? 'positive' : 'negative'}`}>
            <span className="summary-label">Balance</span>
            <span className="summary-value">{formatCurrency(totalIncome - totalExpenses)}</span>
          </div>
        </div>
      </div>

      {/* Expenses by Category */}
      {hasExpenseData && (
        <div className="finance-chart-card">
          <h3 className="chart-title">Gastos por Categoría</h3>
          <div className="chart-container pie-chart">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={expensesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {expensesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">
            {expensesData.map((entry) => (
              <div key={entry.name} className="legend-item">
                <span className="legend-color" style={{ backgroundColor: entry.color }}></span>
                <span className="legend-label">{entry.name}</span>
                <span className="legend-value">{formatCurrency(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Income by Type */}
      {hasIncomeData && (
        <div className="finance-chart-card">
          <h3 className="chart-title">Ingresos por Tipo</h3>
          <div className="chart-container pie-chart">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={incomeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {incomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">
            {incomeData.map((entry) => (
              <div key={entry.name} className="legend-item">
                <span className="legend-color" style={{ backgroundColor: entry.color }}></span>
                <span className="legend-label">{entry.name}</span>
                <span className="legend-value">{formatCurrency(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
