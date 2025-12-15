/**
 * WizardYesNo Component
 *
 * Large Yes/No button pair for boolean wizard steps
 */

import { type FC } from 'react';
import { MESSAGES } from '../../constants';
import './WizardUI.css';

interface WizardYesNoProps {
  value: boolean | undefined;
  onChange: (value: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
  disabled?: boolean;
}

export const WizardYesNo: FC<WizardYesNoProps> = ({
  value,
  onChange,
  yesLabel = MESSAGES.YES,
  noLabel = MESSAGES.NO,
  disabled = false,
}) => {
  return (
    <div className="wizard-yesno-group">
      <button
        type="button"
        className={`wizard-yesno-btn wizard-yesno-yes ${value === true ? 'selected' : ''}`}
        onClick={() => !disabled && onChange(true)}
        disabled={disabled}
      >
        {yesLabel}
      </button>
      <button
        type="button"
        className={`wizard-yesno-btn wizard-yesno-no ${value === false ? 'selected' : ''}`}
        onClick={() => !disabled && onChange(false)}
        disabled={disabled}
      >
        {noLabel}
      </button>
    </div>
  );
};
