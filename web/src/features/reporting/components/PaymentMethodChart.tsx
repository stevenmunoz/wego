/**
 * Payment Method Chart Component
 *
 * Pie chart showing distribution of payment methods.
 */

import { type FC } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { PaymentMethodBreakdown } from '../types';
import './PaymentMethodChart.css';

interface PaymentMethodChartProps {
  data: PaymentMethodBreakdown | null;
  isLoading: boolean;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  bancolombia: 'Bancolombia',
  other: 'Otro',
};

const PAYMENT_COLORS: Record<string, string> = {
  cash: '#22c55e',
  nequi: '#ec4899',
  daviplata: '#f97316',
  bancolombia: '#facc15',
  other: '#94a3b8',
};

// Custom tooltip
const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { percent: string } }>;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="payment-tooltip">
        <p className="tooltip-name">{data.name}</p>
        <p className="tooltip-value">
          {data.value} viajes ({data.payload.percent}%)
        </p>
      </div>
    );
  }
  return null;
};

export const PaymentMethodChart: FC<PaymentMethodChartProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="payment-method-chart">
        <h3 className="section-title">Métodos de Pago</h3>
        <div className="chart-skeleton skeleton"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="payment-method-chart">
        <h3 className="section-title">Métodos de Pago</h3>
        <div className="empty-state">
          <span className="empty-icon">💳</span>
          <p>No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  // Transform data for chart
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);

  const chartData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: PAYMENT_LABELS[key] || key,
      value,
      color: PAYMENT_COLORS[key] || PAYMENT_COLORS.other,
      percent: total > 0 ? ((value / total) * 100).toFixed(1) : '0',
    }));

  if (chartData.length === 0) {
    return (
      <div className="payment-method-chart">
        <h3 className="section-title">Métodos de Pago</h3>
        <div className="empty-state">
          <span className="empty-icon">💳</span>
          <p>No hay datos de pagos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-method-chart">
      <h3 className="section-title">Métodos de Pago</h3>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={70}
              innerRadius={40}
              paddingAngle={2}
              dataKey="value"
              label={({ percent }) => `${percent}%`}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend */}
      <div className="payment-legend">
        {chartData.map((item) => (
          <div key={item.name} className="legend-item">
            <span className="legend-dot" style={{ background: item.color }}></span>
            <span className="legend-name">{item.name}</span>
            <span className="legend-count">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
