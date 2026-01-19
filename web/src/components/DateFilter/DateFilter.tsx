/**
 * Date Filter Component
 * Gmail-style dropdown with predefined date range options and custom range picker
 */

import { type FC, useState, useRef, useEffect } from 'react';
import { trackRidesDateFiltered } from '@/core/analytics';
import {
  getStartOfDay,
  getEndOfDay,
  formatDateToInput,
  parseDateSafe,
} from '@/utils/date.utils';
import './DateFilter.css';

export type DateFilterOption =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'thisMonth'
  | 'lastMonth'
  | 'custom';

interface DateRange {
  startDate: Date | undefined;
  endDate: Date | undefined;
}

interface DateFilterProps {
  value: DateFilterOption;
  customRange?: DateRange | null;
  onChange: (option: DateFilterOption, range: DateRange) => void;
}

interface FilterOptionConfig {
  id: DateFilterOption;
  label: string;
  getRange: () => DateRange;
}

const filterOptions: FilterOptionConfig[] = [
  {
    id: 'all',
    label: 'Todos los viajes',
    getRange: () => ({ startDate: undefined, endDate: undefined }),
  },
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

const formatDateInput = (date: Date): string => {
  return formatDateToInput(date);
};

const formatDateDisplay = (date: Date): string => {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
  }).format(date);
};

export const DateFilter: FC<DateFilterProps> = ({ value, customRange, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<string>('');
  const [tempEndDate, setTempEndDate] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = filterOptions.find((opt) => opt.id === value);

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

  const handleSelect = (option: FilterOptionConfig) => {
    trackRidesDateFiltered(option.id);
    onChange(option.id, option.getRange());
    setIsOpen(false);
    setShowCustomPicker(false);
  };

  const handleCustomClick = () => {
    setShowCustomPicker(true);
    // Initialize with current range or default to last 7 days
    if (customRange?.startDate && customRange?.endDate) {
      setTempStartDate(formatDateInput(customRange.startDate));
      setTempEndDate(formatDateInput(customRange.endDate));
    } else {
      const now = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 6);
      setTempStartDate(formatDateInput(weekAgo));
      setTempEndDate(formatDateInput(now));
    }
  };

  const handleApplyCustom = () => {
    if (tempStartDate && tempEndDate) {
      // Parse date strings using centralized utility to avoid timezone issues
      const parsedStart = parseDateSafe(tempStartDate);
      const parsedEnd = parseDateSafe(tempEndDate);

      if (parsedStart && parsedEnd) {
        const startDate = getStartOfDay(parsedStart);
        const endDate = getEndOfDay(parsedEnd);

        if (startDate <= endDate) {
          trackRidesDateFiltered('custom');
          onChange('custom', { startDate, endDate });
          setIsOpen(false);
          setShowCustomPicker(false);
        }
      }
    }
  };

  const getDisplayLabel = (): string => {
    if (value === 'custom' && customRange?.startDate && customRange?.endDate) {
      return `${formatDateDisplay(customRange.startDate)} - ${formatDateDisplay(customRange.endDate)}`;
    }
    return selectedOption?.label || filterOptions[0].label;
  };

  return (
    <div className="date-filter" ref={dropdownRef}>
      <button
        type="button"
        className="date-filter-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="filter-icon">📅</span>
        <span className="filter-label">{getDisplayLabel()}</span>
        <span className={`filter-chevron ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="date-filter-dropdown">
          {!showCustomPicker ? (
            <>
              <ul className="filter-options" role="listbox">
                {filterOptions.map((option) => (
                  <li key={option.id} role="option" aria-selected={option.id === value}>
                    <button
                      type="button"
                      className={`dropdown-option ${option.id === value ? 'selected' : ''}`}
                      onClick={() => handleSelect(option)}
                    >
                      {option.label}
                      {option.id === value && <span className="check-icon">✓</span>}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="filter-divider"></div>
              <button
                type="button"
                className={`dropdown-option custom-option ${value === 'custom' ? 'selected' : ''}`}
                onClick={handleCustomClick}
              >
                <span className="custom-icon">📆</span>
                Personalizado
                {value === 'custom' && <span className="check-icon">✓</span>}
              </button>
            </>
          ) : (
            <div className="custom-date-picker">
              <div className="picker-header">
                <button
                  type="button"
                  className="back-button"
                  onClick={() => setShowCustomPicker(false)}
                >
                  ← Volver
                </button>
                <span className="picker-title">Rango personalizado</span>
              </div>
              <div className="date-inputs">
                <div className="date-input-group">
                  <label htmlFor="start-date">Desde</label>
                  <input
                    type="date"
                    id="start-date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    max={tempEndDate || undefined}
                  />
                </div>
                <div className="date-input-group">
                  <label htmlFor="end-date">Hasta</label>
                  <input
                    type="date"
                    id="end-date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    min={tempStartDate || undefined}
                  />
                </div>
              </div>
              <button
                type="button"
                className="apply-button"
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

// eslint-disable-next-line react-refresh/only-export-components
export const getDateRangeForOption = (option: DateFilterOption): DateRange => {
  const config = filterOptions.find((opt) => opt.id === option);
  return config ? config.getRange() : { startDate: undefined, endDate: undefined };
};
