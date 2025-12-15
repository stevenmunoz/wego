/**
 * StepIsRecurring Component
 *
 * Whether this is a recurring/frequent passenger
 */

import { type FC } from 'react';
import type { StepProps } from '../../types';
import { WizardYesNo } from '../ui';
import './Steps.css';

export const StepIsRecurring: FC<StepProps> = ({ formData, onUpdate, onNext }) => {
  const handleChange = (value: boolean) => {
    onUpdate({ is_recurring: value });
    // Auto-advance after selection
    setTimeout(onNext, 200);
  };

  return (
    <div className="wizard-step">
      <WizardYesNo value={formData.is_recurring} onChange={handleChange} />
    </div>
  );
};
