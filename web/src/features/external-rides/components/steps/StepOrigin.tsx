/**
 * StepOrigin Component
 *
 * Origin address input step
 */

import { type FC } from 'react';
import type { StepProps } from '../../types';
import { WizardInput } from '../ui';
import { MESSAGES } from '../../constants';
import './Steps.css';

export const StepOrigin: FC<StepProps> = ({ formData, onUpdate, onNext }) => {
  const handleChange = (value: string) => {
    onUpdate({ origin_address: value });
  };

  const handleEnter = () => {
    if (formData.origin_address && formData.origin_address.length >= 3) {
      onNext();
    }
  };

  return (
    <div className="wizard-step">
      <WizardInput
        value={formData.origin_address || ''}
        onChange={handleChange}
        placeholder={MESSAGES.PLACEHOLDER_ORIGIN}
        onEnter={handleEnter}
        autoFocus
      />
    </div>
  );
};
