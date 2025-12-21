/**
 * Peak Hours Heatmap Component
 *
 * 7x24 grid showing ride frequency by day and hour.
 */

import { type FC } from 'react';
import type { PeakHoursMatrix } from '../types';
import './PeakHoursHeatmap.css';

interface PeakHoursHeatmapProps {
  data: PeakHoursMatrix | null;
  isLoading: boolean;
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Get color intensity based on value
const getIntensityClass = (value: number, maxValue: number): string => {
  if (value === 0 || maxValue === 0) return 'intensity-0';

  const ratio = value / maxValue;
  if (ratio >= 0.8) return 'intensity-5';
  if (ratio >= 0.6) return 'intensity-4';
  if (ratio >= 0.4) return 'intensity-3';
  if (ratio >= 0.2) return 'intensity-2';
  return 'intensity-1';
};

// Format hour for display
const formatHour = (hour: number): string => {
  if (hour === 0) return '12am';
  if (hour === 12) return '12pm';
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
};

export const PeakHoursHeatmap: FC<PeakHoursHeatmapProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="peak-hours-heatmap">
        <h3 className="section-title">Horas Pico</h3>
        <div className="heatmap-skeleton skeleton"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="peak-hours-heatmap">
        <h3 className="section-title">Horas Pico</h3>
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

  return (
    <div className="peak-hours-heatmap">
      <div className="heatmap-header">
        <h3 className="section-title">Horas Pico</h3>
        {busiestValue > 0 && (
          <div className="busiest-info">
            <span className="busiest-label">Hora mas activa:</span>
            <span className="busiest-value">
              {DAYS[busiestDay]} {formatHour(busiestHour)} ({busiestValue} viajes)
            </span>
          </div>
        )}
      </div>

      <div className="heatmap-container">
        <div className="heatmap-grid">
          {/* Hour Labels (Top) */}
          <div className="hour-labels">
            <div className="corner-cell"></div>
            {HOURS.filter((h) => h % 3 === 0).map((hour) => (
              <div key={hour} className="hour-label" style={{ gridColumn: `span 3` }}>
                {formatHour(hour)}
              </div>
            ))}
          </div>

          {/* Grid Rows */}
          {DAYS.map((day, dayIndex) => (
            <div key={day} className="heatmap-row">
              <div className="day-label">{day}</div>
              {HOURS.map((hour) => {
                const value = data[dayIndex][hour];
                const intensityClass = getIntensityClass(value, maxValue);

                return (
                  <div
                    key={hour}
                    className={`heatmap-cell ${intensityClass}`}
                    title={`${day} ${formatHour(hour)}: ${value} viajes`}
                  >
                    <span className="cell-value">{value > 0 ? value : ''}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="heatmap-legend">
          <span className="legend-label">Menos</span>
          <div className="legend-scale">
            <div className="legend-cell intensity-0"></div>
            <div className="legend-cell intensity-1"></div>
            <div className="legend-cell intensity-2"></div>
            <div className="legend-cell intensity-3"></div>
            <div className="legend-cell intensity-4"></div>
            <div className="legend-cell intensity-5"></div>
          </div>
          <span className="legend-label">Mas</span>
        </div>
      </div>
    </div>
  );
};
