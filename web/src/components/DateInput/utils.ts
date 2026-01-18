/**
 * DateInput Utilities
 *
 * Utility functions for date parsing and formatting with proper timezone handling.
 */

/**
 * Format a Date to YYYY-MM-DD string using local timezone
 */
export function formatDateToInput(date: Date | null): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string to Date using local timezone
 */
export function parseDateFromInput(dateStr: string): Date | null {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}
