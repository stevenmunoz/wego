/**
 * Period Utilities for Insights Generation
 *
 * Provides functions for calculating period ranges, formatting period IDs,
 * and handling date operations for various period types.
 */

import type { PeriodType, PeriodRange } from '../types/insights.types';

// ============ Spanish Month Names ============

const SPANISH_MONTHS_SHORT: Record<number, string> = {
  0: 'ene',
  1: 'feb',
  2: 'mar',
  3: 'abr',
  4: 'may',
  5: 'jun',
  6: 'jul',
  7: 'ago',
  8: 'sep',
  9: 'oct',
  10: 'nov',
  11: 'dic',
};

const SPANISH_MONTHS_FULL: Record<number, string> = {
  0: 'enero',
  1: 'febrero',
  2: 'marzo',
  3: 'abril',
  4: 'mayo',
  5: 'junio',
  6: 'julio',
  7: 'agosto',
  8: 'septiembre',
  9: 'octubre',
  10: 'noviembre',
  11: 'diciembre',
};

// ============ ISO Week Helpers ============

/**
 * Get ISO week number for a date
 * ISO 8601: Week 1 is the week containing the first Thursday of the year
 */
export function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Get ISO week year (may differ from calendar year around year boundaries)
 */
export function getISOWeekYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  return d.getUTCFullYear();
}

/**
 * Get Monday of the week containing the given date
 */
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get Sunday of the week containing the given date
 */
export function getSundayOfWeek(date: Date): Date {
  const monday = getMondayOfWeek(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

/**
 * Get bi-week number (1-27) for a date within the year
 * Bi-weeks are two-week periods starting from the first Monday of the year
 */
export function getBiWeekNumber(date: Date): number {
  const week = getISOWeekNumber(date);
  return Math.ceil(week / 2);
}

// ============ Period ID Formatting ============

/**
 * Format period ID based on type
 * - Daily: YYYY-MM-DD (e.g., "2026-01-15")
 * - Weekly: YYYY-Www (e.g., "2026-W02")
 * - Bi-weekly: YYYY-BWww (e.g., "2026-BW02")
 * - Monthly: YYYY-MM (e.g., "2026-01")
 */
export function formatPeriodId(type: PeriodType, date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  switch (type) {
    case 'daily':
      return `${year}-${month}-${day}`;
    case 'weekly': {
      const weekYear = getISOWeekYear(date);
      const week = getISOWeekNumber(date);
      return `${weekYear}-W${String(week).padStart(2, '0')}`;
    }
    case 'biweekly': {
      const bwYear = getISOWeekYear(date);
      const biWeek = getBiWeekNumber(date);
      return `${bwYear}-BW${String(biWeek).padStart(2, '0')}`;
    }
    case 'monthly':
      return `${year}-${month}`;
  }
}

/**
 * Parse period ID to extract year and period number/date
 */
export function parsePeriodId(
  periodId: string,
  type: PeriodType
): { year: number; value: number | Date } | null {
  switch (type) {
    case 'daily': {
      const match = periodId.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!match) return null;
      return {
        year: parseInt(match[1], 10),
        value: new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10)),
      };
    }
    case 'weekly': {
      const match = periodId.match(/^(\d{4})-W(\d{2})$/);
      if (!match) return null;
      return {
        year: parseInt(match[1], 10),
        value: parseInt(match[2], 10),
      };
    }
    case 'biweekly': {
      const match = periodId.match(/^(\d{4})-BW(\d{2})$/);
      if (!match) return null;
      return {
        year: parseInt(match[1], 10),
        value: parseInt(match[2], 10),
      };
    }
    case 'monthly': {
      const match = periodId.match(/^(\d{4})-(\d{2})$/);
      if (!match) return null;
      return {
        year: parseInt(match[1], 10),
        value: parseInt(match[2], 10),
      };
    }
  }
}

// ============ Period Range Calculation ============

/**
 * Get the first day of a specific ISO week
 */
function getFirstDayOfISOWeek(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const firstMonday = new Date(jan4);
  firstMonday.setDate(jan4.getDate() - dayOfWeek + 1);

  const result = new Date(firstMonday);
  result.setDate(firstMonday.getDate() + (week - 1) * 7);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Calculate period range for a given type and reference date
 */
export function getPeriodRange(type: PeriodType, referenceDate: Date): PeriodRange {
  switch (type) {
    case 'daily': {
      const start = new Date(referenceDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(referenceDate);
      end.setHours(23, 59, 59, 999);

      return {
        type,
        id: formatPeriodId(type, referenceDate),
        start,
        end,
        displayLabel: formatPeriodDisplaySpanish(type, start, end),
      };
    }

    case 'weekly': {
      const start = getMondayOfWeek(referenceDate);
      const end = getSundayOfWeek(referenceDate);

      return {
        type,
        id: formatPeriodId(type, referenceDate),
        start,
        end,
        displayLabel: formatPeriodDisplaySpanish(type, start, end),
      };
    }

    case 'biweekly': {
      // Get the ISO week and round down to nearest even week for bi-week start
      const weekNum = getISOWeekNumber(referenceDate);
      const biWeekStartWeek = weekNum % 2 === 1 ? weekNum : weekNum - 1;
      const year = getISOWeekYear(referenceDate);

      const start = getFirstDayOfISOWeek(year, biWeekStartWeek);
      const end = new Date(start);
      end.setDate(start.getDate() + 13); // 2 weeks - 1 day
      end.setHours(23, 59, 59, 999);

      return {
        type,
        id: formatPeriodId(type, start),
        start,
        end,
        displayLabel: formatPeriodDisplaySpanish(type, start, end),
      };
    }

    case 'monthly': {
      const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);

      return {
        type,
        id: formatPeriodId(type, referenceDate),
        start,
        end,
        displayLabel: formatPeriodDisplaySpanish(type, start, end),
      };
    }
  }
}

/**
 * Parse a period ID and calculate its range
 */
export function getPeriodRangeFromId(periodId: string, type: PeriodType): PeriodRange | null {
  const parsed = parsePeriodId(periodId, type);
  if (!parsed) return null;

  switch (type) {
    case 'daily': {
      const date = parsed.value as Date;
      return getPeriodRange(type, date);
    }
    case 'weekly': {
      const week = parsed.value as number;
      const firstDay = getFirstDayOfISOWeek(parsed.year, week);
      return getPeriodRange(type, firstDay);
    }
    case 'biweekly': {
      const biWeek = parsed.value as number;
      const startWeek = (biWeek - 1) * 2 + 1;
      const firstDay = getFirstDayOfISOWeek(parsed.year, startWeek);
      return getPeriodRange(type, firstDay);
    }
    case 'monthly': {
      const month = parsed.value as number;
      const firstDay = new Date(parsed.year, month - 1, 1);
      return getPeriodRange(type, firstDay);
    }
  }
}

/**
 * Get the previous period relative to the current one
 */
export function getPreviousPeriod(current: PeriodRange): PeriodRange {
  switch (current.type) {
    case 'daily': {
      const prevDate = new Date(current.start);
      prevDate.setDate(prevDate.getDate() - 1);
      return getPeriodRange('daily', prevDate);
    }

    case 'weekly': {
      const prevDate = new Date(current.start);
      prevDate.setDate(prevDate.getDate() - 7);
      return getPeriodRange('weekly', prevDate);
    }

    case 'biweekly': {
      const prevDate = new Date(current.start);
      prevDate.setDate(prevDate.getDate() - 14);
      return getPeriodRange('biweekly', prevDate);
    }

    case 'monthly': {
      const prevDate = new Date(current.start);
      prevDate.setMonth(prevDate.getMonth() - 1);
      return getPeriodRange('monthly', prevDate);
    }
  }
}

/**
 * Get the next period relative to the current one
 */
export function getNextPeriod(current: PeriodRange): PeriodRange {
  switch (current.type) {
    case 'daily': {
      const nextDate = new Date(current.end);
      nextDate.setDate(nextDate.getDate() + 1);
      return getPeriodRange('daily', nextDate);
    }

    case 'weekly': {
      const nextDate = new Date(current.end);
      nextDate.setDate(nextDate.getDate() + 1);
      return getPeriodRange('weekly', nextDate);
    }

    case 'biweekly': {
      const nextDate = new Date(current.end);
      nextDate.setDate(nextDate.getDate() + 1);
      return getPeriodRange('biweekly', nextDate);
    }

    case 'monthly': {
      const nextDate = new Date(current.start);
      nextDate.setMonth(nextDate.getMonth() + 1);
      return getPeriodRange('monthly', nextDate);
    }
  }
}

// ============ Display Formatting (Spanish) ============

/**
 * Format period for display in Spanish
 * - Daily: "15 de enero de 2026"
 * - Weekly: "5-11 ene 2026"
 * - Bi-weekly: "5-18 ene 2026"
 * - Monthly: "enero 2026"
 */
export function formatPeriodDisplaySpanish(type: PeriodType, start: Date, end: Date): string {
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = start.getMonth();
  const endMonth = end.getMonth();
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  switch (type) {
    case 'daily':
      return `${startDay} de ${SPANISH_MONTHS_FULL[startMonth]} de ${startYear}`;

    case 'weekly':
    case 'biweekly':
      if (startMonth === endMonth && startYear === endYear) {
        // Same month: "5-11 ene 2026"
        return `${startDay}-${endDay} ${SPANISH_MONTHS_SHORT[startMonth]} ${startYear}`;
      } else if (startYear === endYear) {
        // Different months, same year: "28 dic - 3 ene 2026"
        return `${startDay} ${SPANISH_MONTHS_SHORT[startMonth]} - ${endDay} ${SPANISH_MONTHS_SHORT[endMonth]} ${endYear}`;
      } else {
        // Different years: "28 dic 2025 - 3 ene 2026"
        return `${startDay} ${SPANISH_MONTHS_SHORT[startMonth]} ${startYear} - ${endDay} ${SPANISH_MONTHS_SHORT[endMonth]} ${endYear}`;
      }

    case 'monthly':
      return `${SPANISH_MONTHS_FULL[startMonth]} ${startYear}`;
  }
}

/**
 * Get a compact label for the period (for UI badges, etc.)
 */
export function formatPeriodCompactLabel(type: PeriodType, periodId: string): string {
  switch (type) {
    case 'daily': {
      // "2026-01-15" -> "15 ene"
      const parts = periodId.split('-');
      const day = parseInt(parts[2], 10);
      const month = parseInt(parts[1], 10) - 1;
      return `${day} ${SPANISH_MONTHS_SHORT[month]}`;
    }
    case 'weekly':
      // "2026-W02" -> "Sem 02"
      return `Sem ${periodId.split('-W')[1]}`;
    case 'biweekly':
      // "2026-BW02" -> "Quinc 02"
      return `Quinc ${periodId.split('-BW')[1]}`;
    case 'monthly': {
      // "2026-01" -> "ene 2026"
      const parts = periodId.split('-');
      const month = parseInt(parts[1], 10) - 1;
      return `${SPANISH_MONTHS_SHORT[month]} ${parts[0]}`;
    }
  }
}

// ============ Convenience Functions ============

/**
 * Get yesterday's date
 */
export function getYesterday(): Date {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  return yesterday;
}

/**
 * Get last week's Monday
 */
export function getLastWeekMonday(): Date {
  const today = new Date();
  const monday = getMondayOfWeek(today);
  monday.setDate(monday.getDate() - 7);
  return monday;
}

/**
 * Get last month's first day
 */
export function getLastMonthStart(): Date {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth() - 1, 1);
}

/**
 * Check if a date is within a period range
 */
export function isDateInPeriod(date: Date, period: PeriodRange): boolean {
  const time = date.getTime();
  return time >= period.start.getTime() && time <= period.end.getTime();
}

/**
 * Check if two period ranges are the same
 */
export function arePeriodsEqual(a: PeriodRange, b: PeriodRange): boolean {
  return a.type === b.type && a.id === b.id;
}
