/**
 * WeekPicker Component
 *
 * A dropdown week selector with preset options for selecting ISO weeks.
 * Displays week range (e.g., "6-12 ene 2026") and stores as ISO week (e.g., "2026-W02").
 *
 * @example
 * <WeekPicker
 *   value={{ year: 2026, week: 2 }}
 *   onChange={setSelectedWeek}
 * />
 */

import { type FC, useState, useRef, useEffect } from 'react';
import './WeekPicker.css';

export interface WeekValue {
  year: number;
  week: number;
}

export interface WeekPreset {
  id: string;
  label: string;
  getWeek: () => WeekValue;
}

export interface WeekPickerProps {
  /** Current week value */
  value: WeekValue;
  /** Callback when week changes */
  onChange: (week: WeekValue) => void;
  /** Custom preset options (uses defaults if not provided) */
  presets?: WeekPreset[];
  /** Maximum selectable week (can't select future weeks) */
  max?: WeekValue;
  /** Additional CSS class */
  className?: string;
  /** Disable the picker */
  disabled?: boolean;
  /** Label text */
  label?: string;
}

// Utility functions for week calculations

/**
 * Get the Monday of the ISO week for a given date
 */
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the Sunday of the ISO week for a given date
 */
function getSundayOfWeek(date: Date): Date {
  const monday = getMondayOfWeek(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday;
}

/**
 * Get ISO week number and year from a date
 */
function getISOWeekNumber(date: Date): WeekValue {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
}

/**
 * Get a date from ISO week
 */
function getDateFromISOWeek(year: number, week: number): Date {
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
function formatWeekRange(value: WeekValue): string {
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

/**
 * Check if two week values are equal
 */
function weeksAreEqual(a: WeekValue, b: WeekValue): boolean {
  return a.year === b.year && a.week === b.week;
}

/**
 * Check if week a is after week b
 */
function weekIsAfter(a: WeekValue, b: WeekValue): boolean {
  if (a.year > b.year) return true;
  if (a.year < b.year) return false;
  return a.week > b.week;
}

// Default presets for week selection (past weeks)
function getDefaultPresets(): WeekPreset[] {
  return [
    {
      id: 'lastWeek',
      label: 'Semana pasada',
      getWeek: () => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return getISOWeekNumber(d);
      },
    },
    {
      id: '2weeksAgo',
      label: 'Hace 2 semanas',
      getWeek: () => {
        const d = new Date();
        d.setDate(d.getDate() - 14);
        return getISOWeekNumber(d);
      },
    },
    {
      id: '3weeksAgo',
      label: 'Hace 3 semanas',
      getWeek: () => {
        const d = new Date();
        d.setDate(d.getDate() - 21);
        return getISOWeekNumber(d);
      },
    },
    {
      id: '4weeksAgo',
      label: 'Hace 4 semanas',
      getWeek: () => {
        const d = new Date();
        d.setDate(d.getDate() - 28);
        return getISOWeekNumber(d);
      },
    },
  ];
}

export const WeekPicker: FC<WeekPickerProps> = ({
  value,
  onChange,
  presets,
  max,
  className = '',
  disabled = false,
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const defaultPresets = getDefaultPresets();
  const allPresets = presets || defaultPresets;

  // Find which preset matches current value (if any)
  const matchedPreset = allPresets.find((preset) => weeksAreEqual(value, preset.getWeek()));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPreset = (preset: WeekPreset) => {
    const weekValue = preset.getWeek();
    // Check if within max limit
    if (max && weekIsAfter(weekValue, max)) {
      return;
    }
    onChange(weekValue);
    setIsOpen(false);
  };

  const handlePreviousWeek = () => {
    const monday = getDateFromISOWeek(value.year, value.week);
    monday.setDate(monday.getDate() - 7);
    const newWeek = getISOWeekNumber(monday);
    onChange(newWeek);
  };

  const handleNextWeek = () => {
    const monday = getDateFromISOWeek(value.year, value.week);
    monday.setDate(monday.getDate() + 7);
    const newWeek = getISOWeekNumber(monday);

    // Check if within max limit
    if (max && weekIsAfter(newWeek, max)) {
      return;
    }
    onChange(newWeek);
  };

  const isNextDisabled = max && weekIsAfter({ year: value.year, week: value.week + 1 }, max);

  return (
    <div className={`week-picker ${className}`} ref={dropdownRef}>
      {label && <span className="week-picker__label-text">{label}</span>}

      <div className="week-picker__controls">
        <button
          type="button"
          className="week-picker__nav-button"
          onClick={handlePreviousWeek}
          disabled={disabled}
          aria-label="Semana anterior"
        >
          ‹
        </button>

        <button
          type="button"
          className={`week-picker__trigger ${disabled ? 'disabled' : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          disabled={disabled}
        >
          <span className="week-picker__icon">📅</span>
          <span className="week-picker__label">{formatWeekRange(value)}</span>
          <span className={`week-picker__chevron ${isOpen ? 'open' : ''}`}>▼</span>
        </button>

        <button
          type="button"
          className="week-picker__nav-button"
          onClick={handleNextWeek}
          disabled={disabled || isNextDisabled}
          aria-label="Semana siguiente"
        >
          ›
        </button>
      </div>

      {isOpen && (
        <div className="week-picker__dropdown">
          <ul className="week-picker__options" role="listbox">
            {allPresets.map((preset) => {
              const presetWeek = preset.getWeek();
              const isSelected = matchedPreset?.id === preset.id;
              const isDisabled = max && weekIsAfter(presetWeek, max);

              return (
                <li key={preset.id} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    className={`week-picker__option ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                    onClick={() => !isDisabled && handleSelectPreset(preset)}
                    disabled={isDisabled}
                  >
                    <span className="week-picker__option-label">{preset.label}</span>
                    <span className="week-picker__option-range">
                      {formatWeekRange(presetWeek)}
                    </span>
                    {isSelected && <span className="week-picker__check">✓</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export { getISOWeekNumber, getDateFromISOWeek, formatWeekRange };
