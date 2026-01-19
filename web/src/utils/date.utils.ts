/**
 * WeGo Date Utilities
 *
 * TIMEZONE STRATEGY: "Noon Local Time"
 * =====================================
 * All date parsing uses noon (12:00) local time to avoid the "midnight UTC bug":
 * - new Date("2026-01-07") → midnight UTC → Jan 6 at 7pm in Colombia (UTC-5)
 * - new Date(2026, 0, 7, 12, 0, 0) → noon local → Jan 7 in Colombia ✓
 *
 * RULES:
 * 1. NEVER use new Date(string) directly for date-only strings
 * 2. ALWAYS use parseDateSafe() or parseISODate() for string parsing
 * 3. Use Firestore serverTimestamp() for created_at/updated_at
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// SAFE DATE PARSING (Noon Strategy)
// ============================================================================

/**
 * Safely parse a date string to avoid timezone issues.
 * Uses noon local time to prevent day shifts.
 *
 * Supported formats:
 * - YYYY-MM-DD (ISO format)
 * - DD/MM/YYYY (Colombian format)
 *
 * @param dateStr - Date string to parse
 * @returns Date object at noon local time, or null if invalid
 */
export function parseDateSafe(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;

  // Try ISO format YYYY-MM-DD
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
  }

  // Try DD/MM/YYYY format (Colombian)
  const colombianMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (colombianMatch) {
    const [, day, month, year] = colombianMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
  }

  // Try parsing as full datetime (already has time component)
  const fullDate = new Date(dateStr);
  if (!isNaN(fullDate.getTime())) {
    // If it looks like a date-only string, force noon
    if (dateStr.length <= 10 || !dateStr.includes(':')) {
      const d = new Date(fullDate);
      d.setHours(12, 0, 0, 0);
      return d;
    }
    return fullDate;
  }

  return null;
}

/**
 * Parse ISO date string (YYYY-MM-DD) at noon local time.
 *
 * @param dateStr - ISO format date string
 * @returns Date object at noon local time, or null if invalid
 */
export function parseISODate(dateStr: string): Date | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
}

/**
 * Parse Colombian date string (DD/MM/YYYY) at noon local time.
 *
 * @param dateStr - Colombian format date string
 * @returns Date object at noon local time, or null if invalid
 */
export function parseColombianDate(dateStr: string): Date | null {
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
}

// ============================================================================
// DAY BOUNDARIES (for queries)
// ============================================================================

/**
 * Get start of day (00:00:00.000) in local timezone.
 * Use for date range query start bounds.
 *
 * @param date - Date to get start of day for
 * @returns New Date object at start of day
 */
export function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day (23:59:59.999) in local timezone.
 * Use for date range query end bounds.
 *
 * @param date - Date to get end of day for
 * @returns New Date object at end of day
 */
export function getEndOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

// ============================================================================
// FORMATTING (for display)
// ============================================================================

/**
 * Format date for HTML input elements (YYYY-MM-DD).
 *
 * @param date - Date to format
 * @returns ISO format string for input value, or empty string if null
 */
export function formatDateToInput(date: Date | null): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date for Colombian display (e.g., "15 de ene de 2026").
 *
 * @param date - Date to format
 * @param options - Optional Intl.DateTimeFormat options to override defaults
 * @returns Formatted date string, or empty string if null
 */
export function formatDateDisplay(
  date: Date | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(date);
}

/**
 * Format date for Colombian short display (DD/MM/YYYY).
 *
 * @param date - Date to format
 * @returns Short date string, or empty string if null
 */
export function formatDateShort(date: Date | null): string {
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format date with time for display.
 *
 * @param date - Date to format
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date | null): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

// ============================================================================
// FIRESTORE HELPERS
// ============================================================================

/**
 * Convert date string to Firestore Timestamp safely.
 * Uses noon local time strategy to avoid timezone issues.
 *
 * @param dateStr - Date string to convert
 * @returns Firestore Timestamp, or null if invalid
 */
export function toTimestamp(dateStr: string | null | undefined): Timestamp | null {
  const date = parseDateSafe(dateStr);
  return date ? Timestamp.fromDate(date) : null;
}

/**
 * Convert Date object to Firestore Timestamp.
 *
 * @param date - Date to convert
 * @returns Firestore Timestamp, or null if invalid
 */
export function dateToTimestamp(date: Date | null | undefined): Timestamp | null {
  return date ? Timestamp.fromDate(date) : null;
}

/**
 * Convert Firestore Timestamp to Date.
 *
 * @param timestamp - Firestore Timestamp to convert
 * @returns Date object, or null if invalid
 */
export function fromTimestamp(timestamp: Timestamp | null | undefined): Date | null {
  return timestamp?.toDate() ?? null;
}

// ============================================================================
// COMPARISON HELPERS
// ============================================================================

/**
 * Check if two dates are the same day (ignoring time).
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if same day
 */
export function isSameDay(date1: Date | null, date2: Date | null): boolean {
  if (!date1 || !date2) return false;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if a date is today.
 *
 * @param date - Date to check
 * @returns True if date is today
 */
export function isToday(date: Date | null): boolean {
  return isSameDay(date, new Date());
}

/**
 * Check if a date falls within a range (inclusive).
 *
 * @param date - Date to check
 * @param start - Range start
 * @param end - Range end
 * @returns True if date is within range
 */
export function isWithinRange(date: Date, start: Date, end: Date): boolean {
  const startOfStart = getStartOfDay(start);
  const endOfEnd = getEndOfDay(end);
  return date >= startOfStart && date <= endOfEnd;
}
