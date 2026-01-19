/**
 * DateInput Utilities
 *
 * Re-exports from centralized date utilities for backward compatibility.
 * All date logic is now in @/utils/date.utils.ts
 */

import {
  formatDateToInput as formatDateToInputCentral,
  parseDateSafe,
  getStartOfDay,
} from '@/utils/date.utils';

// Re-export with same function names for backward compatibility
export { formatDateToInputCentral as formatDateToInput };

/**
 * Parse a YYYY-MM-DD string to Date using local timezone with noon strategy
 */
export function parseDateFromInput(dateStr: string): Date | null {
  if (!dateStr) return null;
  const date = parseDateSafe(dateStr);
  if (!date) return null;
  // Return at start of day for consistency with original behavior
  return getStartOfDay(date);
}
