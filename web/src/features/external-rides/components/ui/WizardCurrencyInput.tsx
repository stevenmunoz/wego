/**
 * WizardCurrencyInput Component
 *
 * Currency input with COP formatting for Colombian pesos
 */

import { type FC, type KeyboardEvent, useState, useRef, useEffect } from 'react';
import './WizardUI.css';

interface WizardCurrencyInputProps {
  value: number | undefined;
  onChange: (value: number) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onEnter?: () => void;
  disabled?: boolean;
}

/**
 * Format number as Colombian currency (e.g., 125000 -> "125.000")
 */
function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Parse formatted string back to number (e.g., "125.000" -> 125000)
 */
function parseCOP(value: string): number {
  // Remove all non-numeric characters except digits
  const numericString = value.replace(/[^\d]/g, '');
  return parseInt(numericString, 10) || 0;
}

export const WizardCurrencyInput: FC<WizardCurrencyInputProps> = ({
  value,
  onChange,
  placeholder = '0',
  autoFocus = true,
  onEnter,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [displayValue, setDisplayValue] = useState<string>(value ? formatCOP(value) : '');

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Update display value when value prop changes
  useEffect(() => {
    if (value !== undefined && value > 0) {
      setDisplayValue(formatCOP(value));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseCOP(rawValue);

    // Limit to reasonable max (10 million COP)
    if (numericValue <= 10000000) {
      setDisplayValue(numericValue > 0 ? formatCOP(numericValue) : '');
      onChange(numericValue);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && onEnter) {
      e.preventDefault();
      onEnter();
    }
  };

  return (
    <div className="wizard-currency-wrapper">
      <span className="wizard-currency-symbol">$</span>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        className="wizard-input wizard-currency-input"
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
      />
      <span className="wizard-currency-label">COP</span>
    </div>
  );
};
