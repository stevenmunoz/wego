/**
 * WizardProgress Component
 *
 * Progress indicator showing current step position
 */

import { type FC } from 'react';
import './ExternalRideWizard.css';

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
}

export const WizardProgress: FC<WizardProgressProps> = ({ currentStep, totalSteps }) => {
  // Calculate progress percentage (cap at 100%)
  const progress = Math.min((currentStep / totalSteps) * 100, 100);

  return (
    <div className="wizard-progress">
      <div className="wizard-progress-bar">
        <div className="wizard-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <span className="wizard-progress-text">
        {currentStep} de {totalSteps}
      </span>
    </div>
  );
};
