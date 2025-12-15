/**
 * StepTripReason Component
 *
 * Purpose/reason for the trip
 */

import { type FC } from 'react';
import type { StepProps, TripReason } from '../../types';
import { WizardRadioGroup } from '../ui';
import { TRIP_REASON_OPTIONS } from '../../constants';
import './Steps.css';

export const StepTripReason: FC<StepProps> = ({ formData, onUpdate, onNext }) => {
  const handleChange = (value: string) => {
    onUpdate({ trip_reason: value as TripReason });
    // Auto-advance after selection
    setTimeout(onNext, 200);
  };

  return (
    <div className="wizard-step">
      <WizardRadioGroup
        options={TRIP_REASON_OPTIONS}
        value={formData.trip_reason}
        onChange={handleChange}
        columns={2}
      />
    </div>
  );
};
