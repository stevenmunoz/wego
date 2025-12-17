/**
 * WizardRadioGroup Component
 *
 * Radio option cards for single selection in wizard steps
 */

import { type FC } from 'react';
import type { RadioOption } from '../../types';
import './WizardUI.css';

interface WizardRadioGroupProps {
  options: RadioOption[];
  value: string | undefined;
  onChange: (value: string) => void;
  columns?: 1 | 2;
  disabled?: boolean;
}

export const WizardRadioGroup: FC<WizardRadioGroupProps> = ({
  options,
  value,
  onChange,
  columns = 1,
  disabled = false,
}) => {
  return (
    <div className={`wizard-radio-group wizard-radio-columns-${columns}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`wizard-radio-option ${value === option.value ? 'selected' : ''}`}
          onClick={() => !disabled && onChange(option.value)}
          disabled={disabled}
        >
          {option.icon && <span className="wizard-radio-icon">{option.icon}</span>}
          <div className="wizard-radio-content">
            <span className="wizard-radio-label">{option.label}</span>
            {option.description && (
              <span className="wizard-radio-description">{option.description}</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};
