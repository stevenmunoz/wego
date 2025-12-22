/**
 * StepComments Component
 *
 * Optional comments/notes step
 */

import { type FC } from 'react';
import type { StepProps } from '../../types';
import { WizardInput } from '../ui';
import { MESSAGES } from '../../constants';
import './Steps.css';

export const StepComments: FC<StepProps> = ({ formData, onUpdate }) => {
  const handleChange = (value: string) => {
    onUpdate({ comments: value });
  };

  return (
    <div className="wizard-step">
      <div className="wizard-step-optional-badge">{MESSAGES.OPTIONAL}</div>
      <WizardInput
        value={formData.comments || ''}
        onChange={handleChange}
        placeholder={MESSAGES.PLACEHOLDER_COMMENTS}
        type="textarea"
        maxLength={1000}
        autoFocus
      />
    </div>
  );
};
