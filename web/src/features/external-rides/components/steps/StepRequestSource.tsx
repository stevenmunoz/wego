/**
 * StepRequestSource Component
 *
 * How the passenger contacted the driver
 */

import { type FC } from 'react';
import type { StepProps, RequestSource } from '../../types';
import { WizardRadioGroup } from '../ui';
import { REQUEST_SOURCE_OPTIONS } from '../../constants';
import './Steps.css';

export const StepRequestSource: FC<StepProps> = ({ formData, onUpdate, onNext }) => {
  const handleChange = (value: string) => {
    onUpdate({ request_source: value as RequestSource });
    // Auto-advance after selection
    setTimeout(onNext, 200);
  };

  return (
    <div className="wizard-step">
      <WizardRadioGroup
        options={REQUEST_SOURCE_OPTIONS}
        value={formData.request_source}
        onChange={handleChange}
      />
    </div>
  );
};
