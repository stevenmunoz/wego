/**
 * Peak Hours Heatmap Component
 *
 * Table-style heatmap showing ride frequency by hour (rows) and day (columns).
 * Inspired by Looker Studio heatmap design.
 */

import { type FC } from 'react';
import type { PeakHoursMatrix } from '../types';
import './PeakHoursHeatmap.css';

interface PeakHoursHeatmapProps {
  data: PeakHoursMatrix | null;
  isLoading: boolean;
}

const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Get color intensity based on value (blue gradient like Looker Studio)
const getIntensityClass = (value: number, maxValue: number): string => {
  if (value === 0 || maxValue === 0) return 'intensity-0';

  const ratio = value / maxValue;
  if (ratio >= 0.8) return 'intensity-5';
  if (ratio >= 0.6) return 'intensity-4';
  if (ratio >= 0.4) return 'intensity-3';
  if (ratio >= 0.2) return 'intensity-2';
  return 'intensity-1';
};

// Format hour for display (e.g., "6AM", "12PM")
const formatHour = (hour: number): string => {
  if (hour === 0) return '12AM';
  if (hour === 12) return '12PM';
  if (hour < 12) return `${hour}AM`;
  return `${hour - 12}PM`;
};

export const PeakHoursHeatmap: FC<PeakHoursHeatmapProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="peak-hours-heatmap">
        <h3 className="section-title">Viajes por Hora y Día</h3>
        <div className="heatmap-skeleton skeleton"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="peak-hours-heatmap">
        <h3 className="section-title">Viajes por Hora y Día</h3>
        <div className="empty-state">
          <span className="empty-icon">🕐</span>
          <p>No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  // Find max value for color scaling
  const maxValue = Math.max(...data.flat());

  // Calculate busiest hour
  let busiestDay = 0;
  let busiestHour = 0;
  let busiestValue = 0;

  data.forEach((dayData, dayIndex) => {
    dayData.forEach((value, hourIndex) => {
      if (value > busiestValue) {
        busiestValue = value;
        busiestDay = dayIndex;
        busiestHour = hourIndex;
      }
    });
  });

  // Calculate totals per day for the footer
  const dayTotals = DAYS_SHORT.map((_, dayIndex) =>
    HOURS.reduce((sum, hour) => sum + (data[dayIndex]?.[hour] || 0), 0)
  );

  return (
    <div className="peak-hours-heatmap">
      <div className="heatmap-header">
        <h3 className="section-title">Viajes por Hora y Día</h3>
        {busiestValue > 0 && (
          <div className="busiest-info">
            <span className="busiest-label">Hora más activa:</span>
            <span className="busiest-value">
              {DAYS_SHORT[busiestDay]} {formatHour(busiestHour)} ({busiestValue})
            </span>
          </div>
        )}
      </div>

      <div className="heatmap-table-container">
        <table className="heatmap-table">
          <thead>
            <tr>
              <th className="hour-header">Hora</th>
              {DAYS_SHORT.map((day) => (
                <th key={day} className="day-header">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour) => (
              <tr key={hour} className="heatmap-row">
                <td className="hour-cell">{formatHour(hour)}</td>
                {DAYS_SHORT.map((day, dayIndex) => {
                  const value = data[dayIndex]?.[hour] || 0;
                  const intensityClass = getIntensityClass(value, maxValue);

                  return (
                    <td
                      key={day}
                      className={`value-cell ${intensityClass}`}
                      title={`${day} ${formatHour(hour)}: ${value} viajes`}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="totals-row">
              <td className="hour-cell total-label">Total</td>
              {dayTotals.map((total, index) => (
                <td key={DAYS_SHORT[index]} className="total-cell">
                  {total}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Legend */}
      <div className="heatmap-legend">
        <span className="legend-label">Menos viajes</span>
        <div className="legend-scale">
          <div className="legend-cell intensity-0"></div>
          <div className="legend-cell intensity-1"></div>
          <div className="legend-cell intensity-2"></div>
          <div className="legend-cell intensity-3"></div>
          <div className="legend-cell intensity-4"></div>
          <div className="legend-cell intensity-5"></div>
        </div>
        <span className="legend-label">Más viajes</span>
      </div>
    </div>
  );
};
