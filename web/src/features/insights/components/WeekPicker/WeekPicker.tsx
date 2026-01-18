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
import {
  type WeekValue,
  getISOWeekNumber,
  getDateFromISOWeek,
  formatWeekRange,
} from './weekUtils';

// Note: WeekValue and utility functions are exported via index.ts from weekUtils.ts

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
