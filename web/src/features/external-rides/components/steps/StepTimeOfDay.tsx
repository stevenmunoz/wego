/**
 * StepTimeOfDay Component
 *
 * Time of day category for the trip
 */

import { type FC } from 'react';
import type { StepProps, TimeOfDay } from '../../types';
import { WizardRadioGroup } from '../ui';
import { TIME_OF_DAY_OPTIONS } from '../../constants';
import './Steps.css';

export const StepTimeOfDay: FC<StepProps> = ({ formData, onUpdate, onNext }) => {
  const handleChange = (value: string) => {
    onUpdate({ time_of_day: value as TimeOfDay });
    // Auto-advance after selection
    setTimeout(onNext, 200);
  };

  return (
    <div className="wizard-step">
      <WizardRadioGroup
        options={TIME_OF_DAY_OPTIONS}
        value={formData.time_of_day}
        onChange={handleChange}
        columns={2}
      />
    </div>
  );
};
