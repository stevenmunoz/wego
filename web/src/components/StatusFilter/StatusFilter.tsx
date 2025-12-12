/**
 * Status Filter Component
 * Dropdown filter for ride status (All, Completed, Cancelled)
 */

import { type FC, useState, useRef, useEffect } from 'react';
import './StatusFilter.css';

export type StatusFilterOption = 'all' | 'completed' | 'cancelled' | 'cancelled_by_passenger' | 'cancelled_by_driver';

interface StatusFilterProps {
  value: StatusFilterOption;
  onChange: (option: StatusFilterOption) => void;
}

interface FilterOptionConfig {
  id: StatusFilterOption;
  label: string;
  icon: string;
}

const filterOptions: FilterOptionConfig[] = [
  { id: 'all', label: 'Todos los viajes', icon: '📋' },
  { id: 'completed', label: 'Completados', icon: '✅' },
  { id: 'cancelled', label: 'Cancelados', icon: '❌' },
  { id: 'cancelled_by_passenger', label: 'Cancelados (pasajero)', icon: '🚶' },
  { id: 'cancelled_by_driver', label: 'Cancelados (conductor)', icon: '🚗' },
];

export const StatusFilter: FC<StatusFilterProps> = ({ value, onChange }) => {
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
    onChange(option.id);
    setIsOpen(false);
  };

  return (
    <div className="status-filter" ref={dropdownRef}>
      <button
        type="button"
        className="status-filter-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="filter-icon">{selectedOption.icon}</span>
        <span className="filter-label">{selectedOption.label}</span>
        <span className={`filter-chevron ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <ul className="status-filter-dropdown" role="listbox">
          {filterOptions.map((option) => (
            <li key={option.id} role="option" aria-selected={option.id === value}>
              <button
                type="button"
                className={`dropdown-option ${option.id === value ? 'selected' : ''}`}
                onClick={() => handleSelect(option)}
              >
                <span className="option-icon">{option.icon}</span>
                <span>{option.label}</span>
                {option.id === value && <span className="check-icon">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
