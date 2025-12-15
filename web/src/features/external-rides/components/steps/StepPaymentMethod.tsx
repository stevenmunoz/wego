/**
 * StepPaymentMethod Component
 *
 * Payment method selection step
 */

import { type FC } from 'react';
import type { StepProps, ExternalPaymentMethod } from '../../types';
import { WizardRadioGroup } from '../ui';
import { PAYMENT_METHOD_OPTIONS } from '../../constants';
import './Steps.css';

export const StepPaymentMethod: FC<StepProps> = ({ formData, onUpdate, onNext }) => {
  const handleChange = (value: string) => {
    onUpdate({ payment_method: value as ExternalPaymentMethod });
    // Auto-advance after selection
    setTimeout(onNext, 200);
  };

  return (
    <div className="wizard-step">
      <WizardRadioGroup
        options={PAYMENT_METHOD_OPTIONS}
        value={formData.payment_method}
        onChange={handleChange}
      />
    </div>
  );
};
