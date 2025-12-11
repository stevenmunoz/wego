/**
 * Date Filter Component
 * Gmail-style dropdown with predefined date range options
 */

import { type FC, useState, useRef, useEffect } from 'react';
import './DateFilter.css';

export type DateFilterOption =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'thisMonth'
  | 'lastMonth';

interface DateRange {
  startDate: Date | undefined;
  endDate: Date | undefined;
}

interface DateFilterProps {
  value: DateFilterOption;
  onChange: (option: DateFilterOption, range: DateRange) => void;
}

interface FilterOptionConfig {
  id: DateFilterOption;
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

export const DateFilter: FC<DateFilterProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = filterOptions.find((opt) => opt.id === value) || filterOptions[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: FilterOptionConfig) => {
    onChange(option.id, option.getRange());
    setIsOpen(false);
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
        <span className="filter-label">{selectedOption.label}</span>
        <span className={`filter-chevron ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <ul className="date-filter-dropdown" role="listbox">
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
      )}
    </div>
  );
};

export const getDateRangeForOption = (option: DateFilterOption): DateRange => {
  const config = filterOptions.find((opt) => opt.id === option);
  return config ? config.getRange() : { startDate: undefined, endDate: undefined };
};
