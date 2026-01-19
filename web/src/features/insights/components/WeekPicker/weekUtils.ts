/**
 * Week utility functions for ISO week calculations
 * Separated from WeekPicker component to avoid react-refresh warnings
 */

export interface WeekValue {
  year: number;
  week: number;
}

/**
 * Get the Sunday of the ISO week for a given date
 */
function getSundayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() + (day === 0 ? 0 : 7 - day);
  d.setDate(diff);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get ISO week number and year from a date
 */
export function getISOWeekNumber(date: Date): WeekValue {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
}

/**
 * Get a date from ISO week
 */
export function getDateFromISOWeek(year: number, week: number): Date {
  const jan1 = new Date(year, 0, 1);
  const jan1Day = jan1.getDay() || 7;
  const daysToFirstMonday = jan1Day <= 4 ? 1 - jan1Day : 8 - jan1Day;
  const firstMonday = new Date(year, 0, 1 + daysToFirstMonday);
  const targetMonday = new Date(firstMonday);
  targetMonday.setDate(firstMonday.getDate() + (week - 1) * 7);
  return targetMonday;
}

/**
 * Format week range for display (e.g., "6-12 ene 2026")
 */
export function formatWeekRange(value: WeekValue): string {
  const monday = getDateFromISOWeek(value.year, value.week);
  const sunday = getSundayOfWeek(monday);

  const startDay = monday.getDate();
  const endDay = sunday.getDate();
  const monthFormatter = new Intl.DateTimeFormat('es-CO', { month: 'short' });

  // If same month
  if (monday.getMonth() === sunday.getMonth()) {
    const month = monthFormatter.format(monday);
    return `${startDay}-${endDay} ${month} ${value.year}`;
  }

  // Different months
  const startMonth = monthFormatter.format(monday);
  const endMonth = monthFormatter.format(sunday);

  // If different years
  if (monday.getFullYear() !== sunday.getFullYear()) {
    return `${startDay} ${startMonth} ${monday.getFullYear()} - ${endDay} ${endMonth} ${sunday.getFullYear()}`;
  }

  return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${value.year}`;
}
