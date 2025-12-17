/**
 * useExternalRideForm Hook
 *
 * Manages wizard state and form data for external ride registration
 */

import { useState, useCallback, useMemo } from 'react';
import type { WizardStep, WizardState, ExternalRideInput } from '../types';
import { STEP_ORDER, STEP_CONFIG } from '../constants';
import { saveExternalRide } from '../services';
import { stepSchemas, externalRideInputSchema } from '../schemas';

interface UseExternalRideFormReturn {
  // State
  currentStep: WizardStep;
  formData: Partial<ExternalRideInput>;
  isSubmitting: boolean;
  error: string | null;

  // Navigation
  currentStepIndex: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  canGoNext: boolean;
  canGoBack: boolean;

  // Actions
  updateFormData: (data: Partial<ExternalRideInput>) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (step: WizardStep) => void;
  submitForm: (driverId: string, vehicleId?: string) => Promise<boolean>;
  resetForm: () => void;

  // Validation
  validateCurrentStep: () => { isValid: boolean; errors: string[] };
  getStepQuestion: () => string;
}

const INITIAL_STATE: WizardState = {
  currentStep: 'datetime',
  stepHistory: ['datetime'],
  formData: {},
  isSubmitting: false,
  error: null,
};

export function useExternalRideForm(): UseExternalRideFormReturn {
  const [state, setState] = useState<WizardState>(INITIAL_STATE);

  // Derived state
  const currentStepIndex = useMemo(
    () => STEP_ORDER.indexOf(state.currentStep),
    [state.currentStep]
  );

  // Exclude 'success' from total steps count for progress calculation
  const totalSteps = STEP_ORDER.length - 1;

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = state.currentStep === 'confirmation';

  // Update form data
  const updateFormData = useCallback((data: Partial<ExternalRideInput>) => {
    setState((prev) => ({
      ...prev,
      formData: { ...prev.formData, ...data },
      error: null,
    }));
  }, []);

  // Validate current step
  const validateCurrentStep = useCallback((): { isValid: boolean; errors: string[] } => {
    const step = state.currentStep;
    const schema = stepSchemas[step as keyof typeof stepSchemas];

    if (!schema) {
      // No validation for this step (e.g., confirmation, success)
      return { isValid: true, errors: [] };
    }

    try {
      schema.parse(state.formData);
      return { isValid: true, errors: [] };
    } catch (err) {
      if (err instanceof Error && 'errors' in err) {
        const zodError = err as { errors: Array<{ message: string }> };
        return {
          isValid: false,
          errors: zodError.errors.map((e) => e.message),
        };
      }
      return { isValid: false, errors: ['Error de validacion'] };
    }
  }, [state.currentStep, state.formData]);

  // Check if can proceed to next step
  const canGoNext = useMemo(() => {
    const config = STEP_CONFIG[state.currentStep];

    // If step can be skipped, always allow
    if (config.canSkip) {
      return true;
    }

    // Validate based on step
    const { isValid } = validateCurrentStep();
    return isValid;
  }, [state.currentStep, validateCurrentStep]);

  const canGoBack = !isFirstStep && state.currentStep !== 'success';

  // Navigation
  const goToNextStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(state.currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      const nextStep = STEP_ORDER[currentIndex + 1];
      setState((prev) => ({
        ...prev,
        currentStep: nextStep,
        stepHistory: [...prev.stepHistory, nextStep],
        error: null,
      }));
    }
  }, [state.currentStep]);

  const goToPreviousStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(state.currentStep);
    if (currentIndex > 0) {
      const prevStep = STEP_ORDER[currentIndex - 1];
      setState((prev) => ({
        ...prev,
        currentStep: prevStep,
        stepHistory: prev.stepHistory.slice(0, -1),
        error: null,
      }));
    }
  }, [state.currentStep]);

  const goToStep = useCallback((step: WizardStep) => {
    setState((prev) => ({
      ...prev,
      currentStep: step,
      error: null,
    }));
  }, []);

  // Submit form
  const submitForm = useCallback(
    async (driverId: string, vehicleId?: string): Promise<boolean> => {
      setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

      try {
        // Validate all required fields
        const result = externalRideInputSchema.safeParse(state.formData);

        if (!result.success) {
          const errorMessages = result.error.errors.map((e) => e.message).join(', ');
          setState((prev) => ({
            ...prev,
            isSubmitting: false,
            error: `Datos incompletos: ${errorMessages}`,
          }));
          return false;
        }

        // Save to Firestore (with optional vehicle ID)
        const saveResult = await saveExternalRide(driverId, result.data, vehicleId);

        if (saveResult.success) {
          setState((prev) => ({
            ...prev,
            currentStep: 'success',
            isSubmitting: false,
          }));
          return true;
        } else {
          setState((prev) => ({
            ...prev,
            isSubmitting: false,
            error: saveResult.error || 'Error al guardar el viaje',
          }));
          return false;
        }
      } catch (err) {
        console.error('[useExternalRideForm] Submit error:', err);
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          error: 'Error de conexion. Intenta de nuevo.',
        }));
        return false;
      }
    },
    [state.formData]
  );

  // Reset form
  const resetForm = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  // Get step question
  const getStepQuestion = useCallback(() => {
    return STEP_CONFIG[state.currentStep].question;
  }, [state.currentStep]);

  return {
    // State
    currentStep: state.currentStep,
    formData: state.formData,
    isSubmitting: state.isSubmitting,
    error: state.error,

    // Navigation info
    currentStepIndex,
    totalSteps,
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoBack,

    // Actions
    updateFormData,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    submitForm,
    resetForm,

    // Helpers
    validateCurrentStep,
    getStepQuestion,
  };
}
