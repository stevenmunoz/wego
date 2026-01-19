/**
 * WeekHistoryCard Component
 *
 * Displays a summary card for a single week in the history sidebar.
 */

import { type FC } from 'react';
import type { WeeklyInsightsSummary } from '@/core/firebase/insights';

interface WeekHistoryCardProps {
  /** Summary data for the week */
  summary: WeeklyInsightsSummary;
  /** Whether this week is currently selected */
  isSelected: boolean;
  /** Callback when card is clicked */
  onClick: () => void;
}

/**
 * Format date range for display in Spanish
 * Example: "6-12 ene 2026" or "30 dic - 5 ene"
 */
function formatWeekRange(startDate: Date, endDate: Date): string {
  const months = [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
  ];

  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const startMonth = months[startDate.getMonth()];
  const endMonth = months[endDate.getMonth()];
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  // Same month and year
  if (startMonth === endMonth && startYear === endYear) {
    return `${startDay}-${endDay} ${startMonth} ${startYear}`;
  }

  // Same year, different months
  if (startYear === endYear) {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
  }

  // Different years
  return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${endYear}`;
}

/**
 * Format currency in Colombian Peso format
 */
function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${Math.round(amount / 1000)}K`;
  }
  return `$${amount.toLocaleString('es-CO')}`;
}

export const WeekHistoryCard: FC<WeekHistoryCardProps> = ({ summary, isSelected, onClick }) => {
  const weekRange = formatWeekRange(summary.weekStart, summary.weekEnd);
  const formattedRevenue = formatCurrency(summary.totalRevenue);

  return (
    <button
      type="button"
      className={`week-history-card ${isSelected ? 'week-history-card--selected' : ''}`}
      onClick={onClick}
      aria-pressed={isSelected}
    >
      <div className="week-history-card__header">
        <span
          className={`week-history-card__dot ${isSelected ? 'week-history-card__dot--filled' : ''}`}
        />
        <span className="week-history-card__range">{weekRange}</span>
      </div>
      <div className="week-history-card__stats">
        <span className="week-history-card__rides">{summary.totalRides} viajes</span>
        <span className="week-history-card__separator">|</span>
        <span className="week-history-card__revenue">{formattedRevenue}</span>
      </div>
    </button>
  );
};
