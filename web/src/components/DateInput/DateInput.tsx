/**
 * DateInput Component
 *
 * A consistent, reusable date input with proper styling and timezone handling.
 * Use this component for all date inputs across the application.
 *
 * @example
 * // Single date input
 * <DateInput
 *   label="Fecha"
 *   value={selectedDate}
 *   onChange={setSelectedDate}
 * />
 *
 * @example
 * // With max date restriction
 * <DateInput
 *   label="Fecha de nacimiento"
 *   value={birthDate}
 *   onChange={setBirthDate}
 *   max={new Date()}
 * />
 */

import { type FC, type ChangeEvent, useId } from 'react';
import { formatDateToInput, parseDateFromInput } from './utils';
import './DateInput.css';

export interface DateInputProps {
  /** Label text displayed above the input */
  label?: string;
  /** Current date value */
  value: Date | null;
  /** Callback when date changes */
  onChange: (date: Date | null) => void;
  /** Minimum selectable date */
  min?: Date;
  /** Maximum selectable date */
  max?: Date;
  /** Input ID (auto-generated if not provided) */
  id?: string;
  /** Disable the input */
  disabled?: boolean;
  /** Error message to display */
  error?: string;
  /** Additional CSS class */
  className?: string;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Show calendar icon */
  showIcon?: boolean;
  /** Placeholder text when no date selected */
  placeholder?: string;
}

export const DateInput: FC<DateInputProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  id,
  disabled = false,
  error,
  className = '',
  size = 'medium',
  showIcon = true,
  placeholder,
}) => {
  const autoId = useId();
  const inputId = id || `date-input-${autoId}`;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value;
    const parsedDate = parseDateFromInput(dateStr);
    onChange(parsedDate);
  };

  const sizeClass = `date-input--${size}`;
  const errorClass = error ? 'date-input--error' : '';
  const iconClass = showIcon ? 'date-input--with-icon' : 'date-input--no-icon';

  return (
    <div className={`date-input-wrapper ${className}`}>
      {label && (
        <label className="date-input__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className={`date-input__container ${sizeClass} ${errorClass} ${iconClass}`}>
        <input
          type="date"
          id={inputId}
          className="date-input__input"
          value={formatDateToInput(value)}
          onChange={handleChange}
          min={min ? formatDateToInput(min) : undefined}
          max={max ? formatDateToInput(max) : undefined}
          disabled={disabled}
          placeholder={placeholder}
        />
      </div>
      {error && <span className="date-input__error">{error}</span>}
    </div>
  );
};
