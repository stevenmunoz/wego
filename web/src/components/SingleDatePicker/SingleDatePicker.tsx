/**
 * SingleDatePicker Component
 *
 * A dropdown single date selector with preset options and custom date picker.
 * Same visual style as DateRangePicker but for single date selection.
 *
 * @example
 * <SingleDatePicker
 *   value={selectedDate}
 *   onChange={setSelectedDate}
 * />
 */

import { type FC, useState, useRef, useEffect } from 'react';
import './SingleDatePicker.css';

export interface SingleDatePreset {
  id: string;
  label: string;
  getDate: () => Date;
}

export interface SingleDatePickerProps {
  /** Current date value */
  value: Date;
  /** Callback when date changes */
  onChange: (date: Date) => void;
  /** Custom preset options (uses defaults if not provided) */
  presets?: SingleDatePreset[];
  /** Allow custom date selection */
  allowCustom?: boolean;
  /** Minimum selectable date */
  min?: Date;
  /** Maximum selectable date */
  max?: Date;
  /** Additional CSS class */
  className?: string;
  /** Disable the picker */
  disabled?: boolean;
  /** Label text */
  label?: string;
}

// Utility functions
const getStartOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDateInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateDisplay = (date: Date): string => {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const parseDateInput = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

// Default presets for single date (past dates for insights)
const defaultPresets: SingleDatePreset[] = [
  {
    id: 'yesterday',
    label: 'Ayer',
    getDate: () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return getStartOfDay(d);
    },
  },
  {
    id: '2daysAgo',
    label: 'Hace 2 días',
    getDate: () => {
      const d = new Date();
      d.setDate(d.getDate() - 2);
      return getStartOfDay(d);
    },
  },
  {
    id: '7daysAgo',
    label: 'Hace 7 días',
    getDate: () => {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return getStartOfDay(d);
    },
  },
  {
    id: '14daysAgo',
    label: 'Hace 14 días',
    getDate: () => {
      const d = new Date();
      d.setDate(d.getDate() - 14);
      return getStartOfDay(d);
    },
  },
  {
    id: '30daysAgo',
    label: 'Hace 30 días',
    getDate: () => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return getStartOfDay(d);
    },
  },
];

/**
 * Check if a date matches a preset
 */
function matchesPreset(date: Date, preset: SingleDatePreset): boolean {
  const presetDate = preset.getDate();
  return formatDateInput(date) === formatDateInput(presetDate);
}

export const SingleDatePicker: FC<SingleDatePickerProps> = ({
  value,
  onChange,
  presets = defaultPresets,
  allowCustom = true,
  min,
  max,
  className = '',
  disabled = false,
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [tempDate, setTempDate] = useState<string>('');
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

  const handleSelectPreset = (preset: SingleDatePreset) => {
    onChange(preset.getDate());
    setIsOpen(false);
    setShowCustomPicker(false);
  };

  const handleCustomClick = () => {
    setShowCustomPicker(true);
    setTempDate(formatDateInput(value));
  };

  const handleApplyCustom = () => {
    const date = parseDateInput(tempDate);
    if (date) {
      onChange(getStartOfDay(date));
      setIsOpen(false);
      setShowCustomPicker(false);
    }
  };

  const getDisplayLabel = (): string => {
    if (matchedPreset) {
      return matchedPreset.label;
    }
    return formatDateDisplay(value);
  };

  return (
    <div className={`single-date-picker ${className}`} ref={dropdownRef}>
      {label && <span className="single-date-picker__label-text">{label}</span>}
      <button
        type="button"
        className={`single-date-picker__trigger ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        disabled={disabled}
      >
        <span className="single-date-picker__icon">📅</span>
        <span className="single-date-picker__label">{getDisplayLabel()}</span>
        <span className={`single-date-picker__chevron ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="single-date-picker__dropdown">
          {!showCustomPicker ? (
            <>
              <ul className="single-date-picker__options" role="listbox">
                {presets.map((preset) => {
                  const isSelected = matchedPreset?.id === preset.id;
                  return (
                    <li key={preset.id} role="option" aria-selected={isSelected}>
                      <button
                        type="button"
                        className={`single-date-picker__option ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectPreset(preset)}
                      >
                        {preset.label}
                        {isSelected && <span className="single-date-picker__check">✓</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {allowCustom && (
                <>
                  <div className="single-date-picker__divider" />
                  <button
                    type="button"
                    className={`single-date-picker__option single-date-picker__custom-option ${!matchedPreset ? 'selected' : ''}`}
                    onClick={handleCustomClick}
                  >
                    <span className="single-date-picker__custom-icon">📆</span>
                    Personalizado
                    {!matchedPreset && <span className="single-date-picker__check">✓</span>}
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="single-date-picker__custom-picker">
              <div className="single-date-picker__picker-header">
                <button
                  type="button"
                  className="single-date-picker__back-button"
                  onClick={() => setShowCustomPicker(false)}
                >
                  ← Volver
                </button>
                <span className="single-date-picker__picker-title">Seleccionar fecha</span>
              </div>
              <div className="single-date-picker__date-inputs">
                <div className="single-date-picker__input-group">
                  <label htmlFor="sdp-date">Fecha</label>
                  <input
                    type="date"
                    id="sdp-date"
                    value={tempDate}
                    onChange={(e) => setTempDate(e.target.value)}
                    min={min ? formatDateInput(min) : undefined}
                    max={max ? formatDateInput(max) : undefined}
                  />
                </div>
              </div>
              <button
                type="button"
                className="single-date-picker__apply-button"
                onClick={handleApplyCustom}
                disabled={!tempDate}
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
