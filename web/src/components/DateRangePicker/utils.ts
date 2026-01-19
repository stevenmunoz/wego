/**
 * DateRangePicker Utilities
 *
 * Re-exports from centralized date utilities for backward compatibility.
 * All date logic is now in @/utils/date.utils.ts
 */

import { getStartOfDay, getEndOfDay, formatDateToInput, parseDateSafe } from '@/utils/date.utils';

// Re-export core functions
export { getStartOfDay, getEndOfDay };

/**
 * Format a Date to YYYY-MM-DD string using local timezone
 */
export function formatDateInput(date: Date): string {
  return formatDateToInput(date);
}

/**
 * Format a Date for display in Spanish (Colombia) - short format
 */
export function formatDateDisplay(date: Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

/**
 * Parse a YYYY-MM-DD string to Date using local timezone with noon strategy
 */
export function parseDateInput(dateStr: string): Date | null {
  if (!dateStr) return null;
  const date = parseDateSafe(dateStr);
  if (!date) return null;
  // Return at start of day for range pickers
  return getStartOfDay(date);
}
