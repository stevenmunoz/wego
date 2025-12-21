/**
 * Reporting Date Filter Component
 *
 * Extended date filter with preset options and custom date range picker.
 */

import { type FC, useState, useRef, useEffect } from 'react';
import type { ReportingDateFilterOption, DateRange } from '../types';
import './ReportingDateFilter.css';

interface ReportingDateFilterProps {
  value: ReportingDateFilterOption;
  customRange: DateRange | null;
  onChange: (option: ReportingDateFilterOption, range: DateRange) => void;
}

interface FilterOptionConfig {
  id: ReportingDateFilterOption;
  label: string;
  getRange: () => DateRange;
}

const getStartOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getEndOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const filterOptions: FilterOptionConfig[] = [
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
  return date.toISOString().split('T')[0];
};

const formatDateDisplay = (date: Date): string => {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
  }).format(date);
};

export const ReportingDateFilter: FC<ReportingDateFilterProps> = ({
  value,
  customRange,
  onChange,
}) => {
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
    onChange(option.id, option.getRange());
    setIsOpen(false);
    setShowCustomPicker(false);
  };

  const handleCustomClick = () => {
    setShowCustomPicker(true);
    // Initialize with current range or default to last 7 days
    if (customRange) {
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
      const startDate = getStartOfDay(new Date(tempStartDate));
      const endDate = getEndOfDay(new Date(tempEndDate));

      if (startDate <= endDate) {
        onChange('custom', { startDate, endDate });
        setIsOpen(false);
        setShowCustomPicker(false);
      }
    }
  };

  const getDisplayLabel = (): string => {
    if (value === 'custom' && customRange) {
      return `${formatDateDisplay(customRange.startDate)} - ${formatDateDisplay(customRange.endDate)}`;
    }
    return selectedOption?.label || 'Seleccionar';
  };

  return (
    <div className="reporting-date-filter" ref={dropdownRef}>
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

// Helper to get initial date range
export const getInitialDateRange = (): DateRange => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  return { startDate: getStartOfDay(start), endDate: getEndOfDay(end) };
};
