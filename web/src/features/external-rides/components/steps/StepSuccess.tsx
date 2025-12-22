/**
 * StepSuccess Component
 *
 * Success screen shown after successful submission
 */

import { type FC } from 'react';
import { MESSAGES } from '../../constants';
import './Steps.css';

interface StepSuccessProps {
  onRegisterAnother: () => void;
}

export const StepSuccess: FC<StepSuccessProps> = ({ onRegisterAnother }) => {
  return (
    <div className="wizard-step wizard-step-success">
      <div className="success-content">
        <div className="success-icon">✓</div>
        <h2 className="success-title">{MESSAGES.SUBMIT_SUCCESS}</h2>
        <p className="success-description">{MESSAGES.SUCCESS_DESCRIPTION}</p>
        <button type="button" className="success-button" onClick={onRegisterAnother}>
          {MESSAGES.REGISTER_ANOTHER}
        </button>
      </div>
    </div>
  );
};
