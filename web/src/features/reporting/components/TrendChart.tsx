/**
 * Trend Chart Component
 *
 * Line/Area chart showing ride trends over time with goal line overlay.
 * Supports toggle between rides count and revenue.
 */

import { type FC, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import type { DailyTrend, ReportingGoal } from '../types';
import './TrendChart.css';

interface TrendChartProps {
  data: DailyTrend[];
  goal: ReportingGoal | null;
  isLoading: boolean;
}

type ViewMode = 'rides' | 'revenue';

const COLORS = {
  total: '#1e2a3a',
  indriver: '#0ea5e9',
  external: '#16a34a',
  goal: '#f05365',
};

// Format currency for axis
const formatCurrencyShort = (amount: number): string => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`;
  }
  return `${amount}`;
};

// Format full currency for tooltip
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format date for display (with validation to prevent RangeError)
const formatDateShort = (dateStr: string): string => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
  }).format(date);
};

// Custom tooltip factory
const createCustomTooltip = (viewMode: ViewMode) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length && label) {
      return (
        <div className="trend-tooltip">
          <p className="tooltip-date">{formatDateShort(label)}</p>
          {payload.map((entry: { name: string; value: number; color: string }, index: number) => (
            <p key={index} className="tooltip-entry" style={{ color: entry.color }}>
              <span className="tooltip-name">{entry.name}:</span>
              <span className="tooltip-value">
                {viewMode === 'revenue' ? formatCurrency(entry.value) : entry.value}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
};

export const TrendChart: FC<TrendChartProps> = ({ data, goal, isLoading }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('rides');

  if (isLoading) {
    return (
      <div className="trend-chart">
        <div className="chart-header">
          <h3 className="section-title">Tendencia de Viajes</h3>
        </div>
        <div className="chart-wrapper loading">
          <div className="chart-placeholder skeleton"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="trend-chart">
        <div className="chart-header">
          <h3 className="section-title">Tendencia de Viajes</h3>
        </div>
        <div className="empty-state">
          <span className="empty-icon">📈</span>
          <p>No hay datos para mostrar tendencias</p>
        </div>
      </div>
    );
  }

  // Transform data based on view mode
  const chartData = data.map((d) => ({
    date: d.date,
    displayDate: formatDateShort(d.date),
    Total: viewMode === 'rides' ? d.totalRides : d.totalRevenue,
    InDriver: viewMode === 'rides' ? d.indriverRides : d.indriverRevenue,
    Externo: viewMode === 'rides' ? d.externalRides : d.externalRevenue,
  }));

  // Calculate goal line value if applicable
  let goalValue: number | null = null;
  if (goal) {
    const isWeekly = goal.target_type.includes('week');
    const isRevenue = goal.target_type.includes('revenue');

    if ((viewMode === 'revenue') === isRevenue) {
      // Calculate daily target from weekly/monthly
      if (isWeekly) {
        goalValue = goal.target_value / 7;
      } else {
        goalValue = goal.target_value / 30;
      }
    }
  }

  return (
    <div className="trend-chart">
      <div className="chart-header">
        <h3 className="section-title">Tendencia de Viajes</h3>
        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === 'rides' ? 'active' : ''}`}
            onClick={() => setViewMode('rides')}
          >
            Viajes
          </button>
          <button
            className={`toggle-btn ${viewMode === 'revenue' ? 'active' : ''}`}
            onClick={() => setViewMode('revenue')}
          >
            Ingresos
          </button>
        </div>
      </div>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.total} stopOpacity={0.2} />
                <stop offset="95%" stopColor={COLORS.total} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorInDriver" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.indriver} stopOpacity={0.2} />
                <stop offset="95%" stopColor={COLORS.indriver} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExternal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.external} stopOpacity={0.2} />
                <stop offset="95%" stopColor={COLORS.external} stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={viewMode === 'revenue' ? formatCurrencyShort : (v) => String(v)}
            />
            <Tooltip content={createCustomTooltip(viewMode)} />
            <Legend
              wrapperStyle={{ paddingTop: '10px' }}
              iconType="circle"
              iconSize={8}
            />

            {goalValue !== null && (
              <ReferenceLine
                y={goalValue}
                stroke={COLORS.goal}
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: 'Meta',
                  fill: COLORS.goal,
                  fontSize: 11,
                  position: 'right',
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="Total"
              stroke={COLORS.total}
              strokeWidth={2}
              fill="url(#colorTotal)"
              activeDot={{ r: 4 }}
            />
            <Area
              type="monotone"
              dataKey="InDriver"
              stroke={COLORS.indriver}
              strokeWidth={2}
              fill="url(#colorInDriver)"
              activeDot={{ r: 4 }}
            />
            <Area
              type="monotone"
              dataKey="Externo"
              stroke={COLORS.external}
              strokeWidth={2}
              fill="url(#colorExternal)"
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
