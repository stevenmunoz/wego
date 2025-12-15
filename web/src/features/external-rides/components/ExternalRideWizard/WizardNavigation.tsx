/**
 * WizardNavigation Component
 *
 * Back/Next navigation buttons for wizard steps
 */

import { type FC } from 'react';
import { MESSAGES } from '../../constants';
import './ExternalRideWizard.css';

interface WizardNavigationProps {
  onBack: () => void;
  onNext: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
  isLast: boolean;
  isSubmitting: boolean;
  showSkip?: boolean;
  onSkip?: () => void;
}

export const WizardNavigation: FC<WizardNavigationProps> = ({
  onBack,
  onNext,
  canGoBack,
  canGoNext,
  isLast,
  isSubmitting,
  showSkip = false,
  onSkip,
}) => {
  return (
    <div className="wizard-navigation">
      <button
        type="button"
        className="wizard-nav-btn wizard-nav-back"
        onClick={onBack}
        disabled={!canGoBack || isSubmitting}
      >
        {MESSAGES.BACK}
      </button>

      <div className="wizard-nav-actions">
        {showSkip && onSkip && (
          <button
            type="button"
            className="wizard-nav-btn wizard-nav-skip"
            onClick={onSkip}
            disabled={isSubmitting}
          >
            {MESSAGES.SKIP}
          </button>
        )}

        <button
          type="button"
          className="wizard-nav-btn wizard-nav-next"
          onClick={onNext}
          disabled={!canGoNext || isSubmitting}
        >
          {isSubmitting ? (
            <span className="wizard-nav-loading">
              <span className="wizard-nav-spinner" />
              {MESSAGES.LOADING_SUBMIT}
            </span>
          ) : isLast ? (
            MESSAGES.CONFIRM_SUBMIT
          ) : (
            MESSAGES.NEXT
          )}
        </button>
      </div>
    </div>
  );
};
