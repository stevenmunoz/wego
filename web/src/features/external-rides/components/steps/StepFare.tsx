/**
 * StepFare Component
 *
 * Trip fare input step (in COP)
 */

import { type FC } from 'react';
import type { StepProps } from '../../types';
import { WizardCurrencyInput } from '../ui';
import './Steps.css';

export const StepFare: FC<StepProps> = ({ formData, onUpdate, onNext }) => {
  const handleChange = (value: number) => {
    onUpdate({ total_received: value });
  };

  const handleEnter = () => {
    if (formData.total_received && formData.total_received >= 1000) {
      onNext();
    }
  };

  return (
    <div className="wizard-step">
      <WizardCurrencyInput
        value={formData.total_received}
        onChange={handleChange}
        onEnter={handleEnter}
        autoFocus
      />
    </div>
  );
};
