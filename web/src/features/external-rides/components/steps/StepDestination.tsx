/**
 * StepDestination Component
 *
 * Destination address input step
 */

import { type FC } from 'react';
import type { StepProps } from '../../types';
import { WizardInput } from '../ui';
import { MESSAGES } from '../../constants';
import './Steps.css';

export const StepDestination: FC<StepProps> = ({ formData, onUpdate, onNext }) => {
  const handleChange = (value: string) => {
    onUpdate({ destination_address: value });
  };

  const handleEnter = () => {
    if (formData.destination_address && formData.destination_address.length >= 3) {
      onNext();
    }
  };

  return (
    <div className="wizard-step">
      <WizardInput
        value={formData.destination_address || ''}
        onChange={handleChange}
        placeholder={MESSAGES.PLACEHOLDER_DESTINATION}
        onEnter={handleEnter}
        autoFocus
      />
    </div>
  );
};
