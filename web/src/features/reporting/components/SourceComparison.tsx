/**
 * Source Comparison Component
 *
 * Displays InDriver vs External rides comparison using:
 * - Donut chart for percentage distribution
 * - Bar chart for revenue comparison
 */

import { type FC } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { SourceBreakdown } from '../types';
import './SourceComparison.css';

interface SourceComparisonProps {
  data: SourceBreakdown | null;
  isLoading: boolean;
}

const COLORS = {
  indriver: '#0ea5e9', // Blue - InDriver brand color
  external: '#16a34a', // Green - External/organic rides
};

// Currency formatting
const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount}`;
};

const formatFullCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Custom tooltip for charts
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { revenue?: number } }> }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{data.name}</p>
        <p className="tooltip-value">{data.value} viajes</p>
        {data.payload.revenue !== undefined && (
          <p className="tooltip-revenue">{formatFullCurrency(data.payload.revenue)}</p>
        )}
      </div>
    );
  }
  return null;
};

export const SourceComparison: FC<SourceComparisonProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="source-comparison">
        <h3 className="section-title">Comparación por Fuente</h3>
        <div className="charts-grid loading">
          <div className="chart-placeholder skeleton"></div>
          <div className="chart-placeholder skeleton"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="source-comparison">
        <h3 className="section-title">Comparación por Fuente</h3>
        <div className="empty-state">
          <span className="empty-icon">📊</span>
          <p>No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  const totalRides = data.indriver.count + data.external.count;
  const totalRevenue = data.indriver.revenue + data.external.revenue;

  const pieData = [
    {
      name: 'InDriver',
      value: data.indriver.count,
      revenue: data.indriver.revenue,
      color: COLORS.indriver,
    },
    {
      name: 'Externo',
      value: data.external.count,
      revenue: data.external.revenue,
      color: COLORS.external,
    },
  ];

  const barData = [
    {
      name: 'InDriver',
      viajes: data.indriver.count,
      ingresos: data.indriver.revenue,
      color: COLORS.indriver,
    },
    {
      name: 'Externo',
      viajes: data.external.count,
      ingresos: data.external.revenue,
      color: COLORS.external,
    },
  ];

  // Calculate percentages
  const indriverPercent = totalRides > 0 ? ((data.indriver.count / totalRides) * 100).toFixed(1) : '0';
  const externalPercent = totalRides > 0 ? ((data.external.count / totalRides) * 100).toFixed(1) : '0';

  return (
    <div className="source-comparison">
      <h3 className="section-title">Comparación por Fuente</h3>

      <div className="charts-grid">
        {/* Donut Chart */}
        <div className="chart-container">
          <h4 className="chart-subtitle">Distribución de Viajes</h4>
          <div className="donut-wrapper">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <span className="donut-total">{totalRides}</span>
              <span className="donut-label">viajes</span>
            </div>
          </div>
          <div className="legend-custom">
            <div className="legend-item">
              <span className="legend-color" style={{ background: COLORS.indriver }}></span>
              <span className="legend-text">InDriver</span>
              <span className="legend-percent">{indriverPercent}%</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: COLORS.external }}></span>
              <span className="legend-text">Externo</span>
              <span className="legend-percent">{externalPercent}%</span>
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="chart-container">
          <h4 className="chart-subtitle">Ingresos por Fuente</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis
                type="number"
                tickFormatter={formatCurrency}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                width={60}
              />
              <Tooltip
                formatter={(value) => formatFullCurrency(value as number)}
                labelStyle={{ fontWeight: 600 }}
              />
              <Bar dataKey="ingresos" radius={[0, 4, 4, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="revenue-summary">
            <span className="revenue-label">Total:</span>
            <span className="revenue-value">{formatFullCurrency(totalRevenue)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
