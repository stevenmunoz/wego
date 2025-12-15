/**
 * StepTip Component
 *
 * Tip received step with conditional amount input
 */

import { type FC, useState, useEffect } from 'react';
import type { StepProps } from '../../types';
import { WizardYesNo, WizardCurrencyInput } from '../ui';
import { MESSAGES } from '../../constants';
import './Steps.css';

export const StepTip: FC<StepProps> = ({ formData, onUpdate, onNext }) => {
  const [showAmountInput, setShowAmountInput] = useState<boolean>(
    formData.tip_received === true
  );

  useEffect(() => {
    if (formData.tip_received === true) {
      setShowAmountInput(true);
    }
  }, [formData.tip_received]);

  const handleTipReceivedChange = (value: boolean) => {
    onUpdate({ tip_received: value });
    if (value) {
      setShowAmountInput(true);
    } else {
      // Clear tip amount and advance
      onUpdate({ tip_received: false, tip_amount: undefined });
      setTimeout(onNext, 200);
    }
  };

  const handleAmountChange = (value: number) => {
    onUpdate({ tip_amount: value });
  };

  const handleEnter = () => {
    if (formData.tip_amount && formData.tip_amount > 0) {
      onNext();
    }
  };

  return (
    <div className="wizard-step">
      <WizardYesNo value={formData.tip_received} onChange={handleTipReceivedChange} />

      {showAmountInput && formData.tip_received && (
        <div className="wizard-step-conditional">
          <label className="wizard-field-label">{MESSAGES.TIP_AMOUNT_LABEL}</label>
          <WizardCurrencyInput
            value={formData.tip_amount}
            onChange={handleAmountChange}
            onEnter={handleEnter}
            autoFocus
          />
        </div>
      )}
    </div>
  );
};
