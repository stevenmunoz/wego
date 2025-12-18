/**
 * Driver Filter Component
 * Dropdown filter for selecting a specific driver (admin only)
 */

import { type FC, useState, useRef, useEffect } from 'react';
import type { DriverWithUser } from '@/core/firebase';
import './DriverFilter.css';

interface DriverFilterProps {
  drivers: DriverWithUser[];
  value: string; // 'all' or driver ID
  onChange: (driverId: string) => void;
}

export const DriverFilter: FC<DriverFilterProps> = ({ drivers, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedDriver = value === 'all' ? null : drivers.find((d) => d.id === value);
  const displayLabel = selectedDriver ? selectedDriver.name : 'Todos los conductores';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (driverId: string) => {
    onChange(driverId);
    setIsOpen(false);
  };

  return (
    <div className="driver-filter" ref={dropdownRef}>
      <button
        type="button"
        className="driver-filter-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="filter-icon">👤</span>
        <span className="filter-label">{displayLabel}</span>
        <span className={`filter-chevron ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <ul className="driver-filter-dropdown" role="listbox">
          <li role="option" aria-selected={value === 'all'}>
            <button
              type="button"
              className={`dropdown-option ${value === 'all' ? 'selected' : ''}`}
              onClick={() => handleSelect('all')}
            >
              <span className="option-icon">👥</span>
              <span>Todos los conductores</span>
              {value === 'all' && <span className="check-icon">✓</span>}
            </button>
          </li>
          {drivers.map((driver) => (
            <li key={driver.id} role="option" aria-selected={driver.id === value}>
              <button
                type="button"
                className={`dropdown-option ${driver.id === value ? 'selected' : ''}`}
                onClick={() => handleSelect(driver.id)}
              >
                <span className="option-icon">🚗</span>
                <span>{driver.name}</span>
                {driver.id === value && <span className="check-icon">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
