/**
 * DateRangePicker Component
 *
 * A dropdown date range selector with preset options and custom range picker.
 * Consistent styling across the application.
 *
 * @example
 * // Basic usage with presets
 * <DateRangePicker
 *   value={dateRange}
 *   onChange={setDateRange}
 * />
 *
 * @example
 * // With custom presets
 * <DateRangePicker
 *   value={dateRange}
 *   onChange={setDateRange}
 *   presets={[
 *     { id: 'today', label: 'Hoy', days: 0 },
 *     { id: 'week', label: 'Esta semana', days: 7 },
 *   ]}
 * />
 */

import { type FC, useState, useRef, useEffect } from 'react';
import {
  getStartOfDay,
  getEndOfDay,
  formatDateInput,
  formatDateDisplay,
  parseDateInput,
} from './utils';
import './DateRangePicker.css';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface DatePreset {
  id: string;
  label: string;
  getRange: () => DateRange;
}

export interface DateRangePickerProps {
  /** Current date range value */
  value: DateRange;
  /** Callback when date range changes */
  onChange: (range: DateRange) => void;
  /** Custom preset options (uses defaults if not provided) */
  presets?: DatePreset[];
  /** Allow custom date range selection */
  allowCustom?: boolean;
  /** Minimum selectable date */
  min?: Date;
  /** Maximum selectable date */
  max?: Date;
  /** Additional CSS class */
  className?: string;
  /** Disable the picker */
  disabled?: boolean;
}

// Default presets
const defaultPresets: DatePreset[] = [
  {
    id: 'today',
    label: 'Hoy',
    getRange: () => {
      const today = new Date();
      return { startDate: getStartOfDay(today), endDate: getEndOfDay(today) };
    },
  },
  {
    id: 'yesterday',
    label: 'Ayer',
    getRange: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return { startDate: getStartOfDay(yesterday), endDate: getEndOfDay(yesterday) };
    },
  },
  {
    id: 'last7days',
    label: 'Ultimos 7 dias',
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      return { startDate: getStartOfDay(start), endDate: getEndOfDay(end) };
    },
  },
  {
    id: 'last30days',
    label: 'Ultimos 30 dias',
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 29);
      return { startDate: getStartOfDay(start), endDate: getEndOfDay(end) };
    },
  },
  {
    id: 'thisMonth',
    label: 'Este mes',
    getRange: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: getStartOfDay(start), endDate: getEndOfDay(end) };
    },
  },
  {
    id: 'lastMonth',
    label: 'Mes anterior',
    getRange: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: getStartOfDay(start), endDate: getEndOfDay(end) };
    },
  },
];

/**
 * Check if a date range matches a preset
 */
function matchesPreset(range: DateRange, preset: DatePreset): boolean {
  const presetRange = preset.getRange();
  return (
    formatDateInput(range.startDate) === formatDateInput(presetRange.startDate) &&
    formatDateInput(range.endDate) === formatDateInput(presetRange.endDate)
  );
}

export const DateRangePicker: FC<DateRangePickerProps> = ({
  value,
  onChange,
  presets = defaultPresets,
  allowCustom = true,
  min,
  max,
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<string>('');
  const [tempEndDate, setTempEndDate] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find which preset matches current value (if any)
  const matchedPreset = presets.find((preset) => matchesPreset(value, preset));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCustomPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPreset = (preset: DatePreset) => {
    onChange(preset.getRange());
    setIsOpen(false);
    setShowCustomPicker(false);
  };

  const handleCustomClick = () => {
    setShowCustomPicker(true);
    setTempStartDate(formatDateInput(value.startDate));
    setTempEndDate(formatDateInput(value.endDate));
  };

  const handleApplyCustom = () => {
    const startDate = parseDateInput(tempStartDate);
    const endDate = parseDateInput(tempEndDate);

    if (startDate && endDate && startDate <= endDate) {
      onChange({
        startDate: getStartOfDay(startDate),
        endDate: getEndOfDay(endDate),
      });
      setIsOpen(false);
      setShowCustomPicker(false);
    }
  };

  const getDisplayLabel = (): string => {
    if (matchedPreset) {
      return matchedPreset.label;
    }
    return `${formatDateDisplay(value.startDate)} - ${formatDateDisplay(value.endDate)}`;
  };

  return (
    <div className={`date-range-picker ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className={`date-range-picker__trigger ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        disabled={disabled}
      >
        <span className="date-range-picker__icon">{'\u{1F4C5}'}</span>
        <span className="date-range-picker__label">{getDisplayLabel()}</span>
        <span className={`date-range-picker__chevron ${isOpen ? 'open' : ''}`}>{'\u{25BC}'}</span>
      </button>

      {isOpen && (
        <div className="date-range-picker__dropdown">
          {!showCustomPicker ? (
            <>
              <ul className="date-range-picker__options" role="listbox">
                {presets.map((preset) => {
                  const isSelected = matchedPreset?.id === preset.id;
                  return (
                    <li key={preset.id} role="option" aria-selected={isSelected}>
                      <button
                        type="button"
                        className={`date-range-picker__option ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectPreset(preset)}
                      >
                        {preset.label}
                        {isSelected && <span className="date-range-picker__check">{'\u{2713}'}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {allowCustom && (
                <>
                  <div className="date-range-picker__divider" />
                  <button
                    type="button"
                    className={`date-range-picker__option date-range-picker__custom-option ${!matchedPreset ? 'selected' : ''}`}
                    onClick={handleCustomClick}
                  >
                    <span className="date-range-picker__custom-icon">{'\u{1F4C6}'}</span>
                    Personalizado
                    {!matchedPreset && <span className="date-range-picker__check">{'\u{2713}'}</span>}
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="date-range-picker__custom-picker">
              <div className="date-range-picker__picker-header">
                <button
                  type="button"
                  className="date-range-picker__back-button"
                  onClick={() => setShowCustomPicker(false)}
                >
                  {'\u{2190}'} Volver
                </button>
                <span className="date-range-picker__picker-title">Rango personalizado</span>
              </div>
              <div className="date-range-picker__date-inputs">
                <div className="date-range-picker__input-group">
                  <label htmlFor="drp-start-date">Desde</label>
                  <input
                    type="date"
                    id="drp-start-date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    max={tempEndDate || (max ? formatDateInput(max) : undefined)}
                    min={min ? formatDateInput(min) : undefined}
                  />
                </div>
                <div className="date-range-picker__input-group">
                  <label htmlFor="drp-end-date">Hasta</label>
                  <input
                    type="date"
                    id="drp-end-date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    min={tempStartDate || (min ? formatDateInput(min) : undefined)}
                    max={max ? formatDateInput(max) : undefined}
                  />
                </div>
              </div>
              <button
                type="button"
                className="date-range-picker__apply-button"
                onClick={handleApplyCustom}
                disabled={!tempStartDate || !tempEndDate}
              >
                Aplicar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
