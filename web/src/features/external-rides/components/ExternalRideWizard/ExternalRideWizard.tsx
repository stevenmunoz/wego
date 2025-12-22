/**
 * ExternalRideWizard Component
 *
 * Main wizard container managing step transitions and form state
 */

import { type FC, useCallback, useMemo } from 'react';
import type { Driver, WizardStep } from '../../types';
import { useExternalRideForm } from '../../hooks';
import { STEP_CONFIG } from '../../constants';
import { useDriverVehicles } from '@/hooks/useDriverVehicles';
import { WizardProgress } from './WizardProgress';
import { WizardNavigation } from './WizardNavigation';
import {
  StepDatetime,
  StepOrigin,
  StepDestination,
  StepFare,
  StepRequestSource,
  StepTripReason,
  StepTimeOfDay,
  StepIsRecurring,
  StepPaymentMethod,
  StepTip,
  StepComments,
  StepConfirmation,
  StepSuccess,
} from '../steps';
import './ExternalRideWizard.css';

interface ExternalRideWizardProps {
  driver: Driver;
}

export const ExternalRideWizard: FC<ExternalRideWizardProps> = ({ driver }) => {
  const {
    currentStep,
    formData,
    isSubmitting,
    error,
    currentStepIndex,
    totalSteps,
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoBack,
    updateFormData,
    goToNextStep,
    goToPreviousStep,
    submitForm,
    resetForm,
    getStepQuestion,
  } = useExternalRideForm();

  // Fetch driver's vehicles to get primary vehicle ID
  const { vehicles } = useDriverVehicles(driver.id, { status: 'active' });

  // Get primary vehicle ID (auto-assign to rides)
  const primaryVehicleId = useMemo(() => {
    const primaryVehicle = vehicles.find((v) => v.is_primary);
    return primaryVehicle?.id || vehicles[0]?.id;
  }, [vehicles]);

  // Handle next/submit
  const handleNext = useCallback(async () => {
    if (isLastStep) {
      await submitForm(driver.id, primaryVehicleId);
    } else {
      goToNextStep();
    }
  }, [isLastStep, submitForm, driver.id, primaryVehicleId, goToNextStep]);

  // Handle skip (for optional steps)
  const handleSkip = useCallback(() => {
    goToNextStep();
  }, [goToNextStep]);

  // Get step question
  const question = getStepQuestion();
  const stepConfig = STEP_CONFIG[currentStep];

  // Render current step content
  const renderStepContent = () => {
    const stepProps = {
      formData,
      onUpdate: updateFormData,
      onNext: goToNextStep,
      onBack: goToPreviousStep,
      isFirst: isFirstStep,
      isLast: isLastStep,
    };

    const stepComponents: Record<WizardStep, JSX.Element> = {
      datetime: <StepDatetime {...stepProps} />,
      origin: <StepOrigin {...stepProps} />,
      destination: <StepDestination {...stepProps} />,
      fare: <StepFare {...stepProps} />,
      request_source: <StepRequestSource {...stepProps} />,
      trip_reason: <StepTripReason {...stepProps} />,
      time_of_day: <StepTimeOfDay {...stepProps} />,
      is_recurring: <StepIsRecurring {...stepProps} />,
      payment_method: <StepPaymentMethod {...stepProps} />,
      tip: <StepTip {...stepProps} />,
      comments: <StepComments {...stepProps} />,
      confirmation: <StepConfirmation {...stepProps} />,
      success: <StepSuccess onRegisterAnother={resetForm} />,
    };

    return stepComponents[currentStep];
  };

  // Success step has different layout
  if (currentStep === 'success') {
    return (
      <div className="external-ride-wizard">
        <div className="wizard-content wizard-content-success">{renderStepContent()}</div>
      </div>
    );
  }

  return (
    <div className="external-ride-wizard">
      {/* Progress bar */}
      <WizardProgress currentStep={currentStepIndex + 1} totalSteps={totalSteps} />

      {/* Main content */}
      <div className="wizard-content">
        {/* Question */}
        {question && <h2 className="wizard-question">{question}</h2>}

        {/* Error message */}
        {error && <div className="wizard-error">{error}</div>}

        {/* Step content */}
        <div className="wizard-step-container">{renderStepContent()}</div>
      </div>

      {/* Navigation */}
      <WizardNavigation
        onBack={goToPreviousStep}
        onNext={handleNext}
        canGoBack={canGoBack}
        canGoNext={canGoNext}
        isLast={isLastStep}
        isSubmitting={isSubmitting}
        showSkip={stepConfig.canSkip}
        onSkip={handleSkip}
      />
    </div>
  );
};
