/**
 * Source Filter Component
 * Dropdown filter for ride source (All, InDriver, External Form)
 */

import { type FC, useState, useRef, useEffect } from 'react';
import './SourceFilter.css';

export type SourceFilterOption = 'all' | 'indriver' | 'external';

interface SourceFilterProps {
  value: SourceFilterOption;
  onChange: (option: SourceFilterOption) => void;
}

interface FilterOptionConfig {
  id: SourceFilterOption;
  label: string;
  icon: string;
}

const filterOptions: FilterOptionConfig[] = [
  { id: 'all', label: 'Todas las fuentes', icon: '📊' },
  { id: 'indriver', label: 'InDriver', icon: '🚗' },
  { id: 'external', label: 'Formulario externo', icon: '📝' },
];

export const SourceFilter: FC<SourceFilterProps> = ({ value, onChange }) => {
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
    <div className="source-filter" ref={dropdownRef}>
      <button
        type="button"
        className="source-filter-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="filter-icon">{selectedOption.icon}</span>
        <span className="filter-label">{selectedOption.label}</span>
        <span className={`filter-chevron ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <ul className="source-filter-dropdown" role="listbox">
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
