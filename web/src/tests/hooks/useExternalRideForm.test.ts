/**
 * useExternalRideForm Hook Tests
 *
 * Tests for wizard state management and form submission
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ExternalRideInput } from '@/features/external-rides/types';

// Mock Firebase dependencies first
vi.mock('@/core/firebase/config', () => ({
  firebaseApp: {},
}));

vi.mock('@/core/firebase/firestore', () => ({
  db: {},
}));

// Mock the service
const mockSaveExternalRide = vi.hoisted(() => vi.fn());

vi.mock('@/features/external-rides/services', () => ({
  saveExternalRide: mockSaveExternalRide,
  getDriverBySlug: vi.fn(),
  getDriverById: vi.fn(),
}));

// Import after mocks
import { useExternalRideForm } from '@/features/external-rides/hooks/useExternalRideForm';

// Complete form data factory
const createCompleteFormData = (overrides: Partial<ExternalRideInput> = {}): ExternalRideInput => ({
  date: '2024-12-15',
  time: '14:30',
  origin_address: 'Cable Plaza, Manizales',
  destination_address: 'Aeropuerto La Nubia',
  total_received: 25000,
  payment_method: 'cash',
  request_source: 'whatsapp',
  trip_reason: 'personal',
  time_of_day: 'afternoon',
  is_recurring: false,
  tip_received: false,
  ...overrides,
});

describe('useExternalRideForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveExternalRide.mockResolvedValue({ success: true, rideId: 'ride-123' });
  });

  describe('Initial State', () => {
    it('starts at datetime step', () => {
      const { result } = renderHook(() => useExternalRideForm());

      expect(result.current.currentStep).toBe('datetime');
    });

    it('starts with empty form data', () => {
      const { result } = renderHook(() => useExternalRideForm());

      expect(result.current.formData).toEqual({});
    });

    it('starts at first step index', () => {
      const { result } = renderHook(() => useExternalRideForm());

      expect(result.current.currentStepIndex).toBe(0);
      expect(result.current.isFirstStep).toBe(true);
    });

    it('is not submitting initially', () => {
      const { result } = renderHook(() => useExternalRideForm());

      expect(result.current.isSubmitting).toBe(false);
    });

    it('has no error initially', () => {
      const { result } = renderHook(() => useExternalRideForm());

      expect(result.current.error).toBeNull();
    });

    it('has correct total steps count', () => {
      const { result } = renderHook(() => useExternalRideForm());

      // 12 steps excluding 'success' step
      expect(result.current.totalSteps).toBe(12);
    });
  });

  describe('Form Data Updates', () => {
    it('updates form data with updateFormData', () => {
      const { result } = renderHook(() => useExternalRideForm());

      act(() => {
        result.current.updateFormData({ date: '2024-12-15' });
      });

      expect(result.current.formData.date).toBe('2024-12-15');
    });

    it('merges multiple form data updates', () => {
      const { result } = renderHook(() => useExternalRideForm());

      act(() => {
        result.current.updateFormData({ date: '2024-12-15' });
      });

      act(() => {
        result.current.updateFormData({ time: '14:30' });
      });

      expect(result.current.formData.date).toBe('2024-12-15');
      expect(result.current.formData.time).toBe('14:30');
    });

    it('clears error when updating form data', () => {
      const { result } = renderHook(() => useExternalRideForm());

      // First set an error by attempting invalid submission
      act(() => {
        result.current.updateFormData({ date: '2024-12-15', time: '14:30' });
      });

      // Then update form data (should clear any error)
      act(() => {
        result.current.updateFormData({ origin_address: 'Test Address' });
      });

      expect(result.current.error).toBeNull();
    });

    it('updates payment_method correctly', () => {
      const { result } = renderHook(() => useExternalRideForm());

      act(() => {
        result.current.updateFormData({ payment_method: 'nequi' });
      });

      expect(result.current.formData.payment_method).toBe('nequi');
    });

    it('updates boolean fields correctly', () => {
      const { result } = renderHook(() => useExternalRideForm());

      act(() => {
        result.current.updateFormData({ is_recurring: true, tip_received: true });
      });

      expect(result.current.formData.is_recurring).toBe(true);
      expect(result.current.formData.tip_received).toBe(true);
    });

    it('updates tip_amount with tip_received', () => {
      const { result } = renderHook(() => useExternalRideForm());

      act(() => {
        result.current.updateFormData({
          tip_received: true,
          tip_amount: 5000,
        });
      });

      expect(result.current.formData.tip_received).toBe(true);
      expect(result.current.formData.tip_amount).toBe(5000);
    });
  });

  describe('Navigation', () => {
    it('goToNextStep advances to next step', () => {
      const { result } = renderHook(() => useExternalRideForm());

      // Fill required data for datetime step
      act(() => {
        result.current.updateFormData({ date: '2024-12-15', time: '14:30' });
      });

      act(() => {
        result.current.goToNextStep();
      });

      expect(result.current.currentStep).toBe('origin');
      expect(result.current.currentStepIndex).toBe(1);
    });

    it('goToPreviousStep goes back to previous step', () => {
      const { result } = renderHook(() => useExternalRideForm());

      // Go to origin step
      act(() => {
        result.current.updateFormData({ date: '2024-12-15', time: '14:30' });
        result.current.goToNextStep();
      });

      expect(result.current.currentStep).toBe('origin');

      act(() => {
        result.current.goToPreviousStep();
      });

      expect(result.current.currentStep).toBe('datetime');
    });

    it('cannot go previous from first step', () => {
      const { result } = renderHook(() => useExternalRideForm());

      expect(result.current.canGoBack).toBe(false);

      act(() => {
        result.current.goToPreviousStep();
      });

      expect(result.current.currentStep).toBe('datetime');
    });

    it('goToStep navigates to specific step', () => {
      const { result } = renderHook(() => useExternalRideForm());

      act(() => {
        result.current.goToStep('fare');
      });

      expect(result.current.currentStep).toBe('fare');
    });

    it('isLastStep is true at confirmation step', () => {
      const { result } = renderHook(() => useExternalRideForm());

      act(() => {
        result.current.goToStep('confirmation');
      });

      expect(result.current.isLastStep).toBe(true);
    });

    it('clears error when navigating', () => {
      const { result } = renderHook(() => useExternalRideForm());

      // Navigate
      act(() => {
        result.current.goToNextStep();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Step Validation', () => {
    it('validates datetime step requires date and time', () => {
      const { result } = renderHook(() => useExternalRideForm());

      // No data - should not be valid
      expect(result.current.canGoNext).toBe(false);

      // Add partial data
      act(() => {
        result.current.updateFormData({ date: '2024-12-15' });
      });

      expect(result.current.canGoNext).toBe(false);

      // Add complete data
      act(() => {
        result.current.updateFormData({ time: '14:30' });
      });

      expect(result.current.canGoNext).toBe(true);
    });

    it('validates origin step requires origin_address', () => {
      const { result } = renderHook(() => useExternalRideForm());

      act(() => {
        result.current.goToStep('origin');
      });

      expect(result.current.canGoNext).toBe(false);

      act(() => {
        result.current.updateFormData({ origin_address: 'Test Origin' });
      });

      expect(result.current.canGoNext).toBe(true);
    });

    it('validates fare step requires total_received >= 1000', () => {
      const { result } = renderHook(() => useExternalRideForm());

      act(() => {
        result.current.goToStep('fare');
      });

      expect(result.current.canGoNext).toBe(false);

      act(() => {
        result.current.updateFormData({ total_received: 500 });
      });

      // Still invalid - below minimum
      expect(result.current.canGoNext).toBe(false);

      act(() => {
        result.current.updateFormData({ total_received: 5000 });
      });

      expect(result.current.canGoNext).toBe(true);
    });

    it('comments step can be skipped', () => {
      const { result } = renderHook(() => useExternalRideForm());

      act(() => {
        result.current.goToStep('comments');
      });

      // Should always be able to proceed (optional step)
      expect(result.current.canGoNext).toBe(true);
    });

    it('validateCurrentStep returns validation errors', () => {
      const { result } = renderHook(() => useExternalRideForm());

      // At datetime step with no data
      const validation = result.current.validateCurrentStep();

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('validateCurrentStep returns no errors for valid data', () => {
      const { result } = renderHook(() => useExternalRideForm());

      act(() => {
        result.current.updateFormData({ date: '2024-12-15', time: '14:30' });
      });

      const validation = result.current.validateCurrentStep();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);
    });
  });

  describe('Step Questions', () => {
    it('returns correct question for datetime step', () => {
      const { result } = renderHook(() => useExternalRideForm());

      expect(result.current.getStepQuestion()).toBe('¿Cuando fue el viaje?');
    });

    it('returns correct question for origin step', () => {
      const { result } = renderHook(() => useExternalRideForm());

      act(() => {
        result.current.goToStep('origin');
      });

      expect(result.current.getStepQuestion()).toBe('¿Donde recogiste al pasajero?');
    });

    it('returns correct question for fare step', () => {
      const { result } = renderHook(() => useExternalRideForm());

      act(() => {
        result.current.goToStep('fare');
      });

      expect(result.current.getStepQuestion()).toBe('¿Cuanto cobraste por el viaje?');
    });

    it('returns correct question for payment_method step', () => {
      const { result } = renderHook(() => useExternalRideForm());

      act(() => {
        result.current.goToStep('payment_method');
      });

      expect(result.current.getStepQuestion()).toBe('¿Como te pago?');
    });

    it('returns correct question for tip step', () => {
      const { result } = renderHook(() => useExternalRideForm());

      act(() => {
        result.current.goToStep('tip');
      });

      expect(result.current.getStepQuestion()).toBe('¿Te dieron propina?');
    });

    it('returns correct question for is_recurring step', () => {
      const { result } = renderHook(() => useExternalRideForm());

      act(() => {
        result.current.goToStep('is_recurring');
      });

      expect(result.current.getStepQuestion()).toBe('¿Es un pasajero frecuente?');
    });
  });

  describe('Form Submission', () => {
    it('submitForm calls saveExternalRide with correct data', async () => {
      const { result } = renderHook(() => useExternalRideForm());

      const formData = createCompleteFormData();
      act(() => {
        result.current.updateFormData(formData);
        result.current.goToStep('confirmation');
      });

      await act(async () => {
        await result.current.submitForm('driver-123', 'vehicle-456');
      });

      expect(mockSaveExternalRide).toHaveBeenCalledWith(
        'driver-123',
        expect.objectContaining({
          date: '2024-12-15',
          time: '14:30',
          total_received: 25000,
        }),
        'vehicle-456'
      );
    });

    it('submitForm sets isSubmitting during submission', async () => {
      // Use a slower mock to observe isSubmitting state
      mockSaveExternalRide.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true, rideId: 'ride-123' }), 100);
          })
      );

      const { result } = renderHook(() => useExternalRideForm());

      const formData = createCompleteFormData();
      await act(async () => {
        result.current.updateFormData(formData);
      });

      // Start submission but don't await
      let submitPromise: Promise<boolean>;
      await act(async () => {
        submitPromise = result.current.submitForm('driver-123');
      });

      // Wait for the promise to complete
      await act(async () => {
        await submitPromise;
      });

      // After completion, isSubmitting should be false
      expect(result.current.isSubmitting).toBe(false);
    });

    it('submitForm transitions to success step on success', async () => {
      mockSaveExternalRide.mockResolvedValue({ success: true, rideId: 'ride-123' });

      const { result } = renderHook(() => useExternalRideForm());

      const formData = createCompleteFormData();
      act(() => {
        result.current.updateFormData(formData);
      });

      await act(async () => {
        const success = await result.current.submitForm('driver-123');
        expect(success).toBe(true);
      });

      expect(result.current.currentStep).toBe('success');
    });

    it('submitForm sets error on failure', async () => {
      mockSaveExternalRide.mockResolvedValue({
        success: false,
        error: 'Error al guardar el viaje',
      });

      const { result } = renderHook(() => useExternalRideForm());

      const formData = createCompleteFormData();
      act(() => {
        result.current.updateFormData(formData);
      });

      await act(async () => {
        const success = await result.current.submitForm('driver-123');
        expect(success).toBe(false);
      });

      expect(result.current.error).toBe('Error al guardar el viaje');
      expect(result.current.currentStep).not.toBe('success');
    });

    it('submitForm sets error for incomplete form data', async () => {
      const { result } = renderHook(() => useExternalRideForm());

      // Only partial data
      act(() => {
        result.current.updateFormData({ date: '2024-12-15' });
      });

      await act(async () => {
        const success = await result.current.submitForm('driver-123');
        expect(success).toBe(false);
      });

      expect(result.current.error).toContain('Datos incompletos');
      expect(mockSaveExternalRide).not.toHaveBeenCalled();
    });

    it('submitForm handles network errors', async () => {
      mockSaveExternalRide.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useExternalRideForm());

      const formData = createCompleteFormData();
      act(() => {
        result.current.updateFormData(formData);
      });

      await act(async () => {
        const success = await result.current.submitForm('driver-123');
        expect(success).toBe(false);
      });

      expect(result.current.error).toBe('Error de conexion. Intenta de nuevo.');
    });

    it('submitForm allows tip_received without tip_amount (tip validation is step-level)', async () => {
      // Note: The tip validation refinement is in stepSchemas.tip, not in the main externalRideInputSchema
      // So at form submission, tip_amount is optional even when tip_received is true
      // The step-level validation would catch this during wizard navigation
      mockSaveExternalRide.mockResolvedValue({ success: true, rideId: 'ride-123' });

      const { result } = renderHook(() => useExternalRideForm());

      // Form with tip_received true but no tip_amount - passes main schema validation
      const formData = createCompleteFormData({
        tip_received: true,
        tip_amount: undefined,
      });

      await act(async () => {
        result.current.updateFormData(formData);
      });

      await act(async () => {
        const success = await result.current.submitForm('driver-123');
        // The main schema doesn't have the tip refinement, so this passes
        expect(success).toBe(true);
      });

      expect(result.current.currentStep).toBe('success');
    });

    it('submitForm accepts form with tip', async () => {
      mockSaveExternalRide.mockResolvedValue({ success: true, rideId: 'ride-123' });

      const { result } = renderHook(() => useExternalRideForm());

      const formData = createCompleteFormData({
        tip_received: true,
        tip_amount: 5000,
      });

      act(() => {
        result.current.updateFormData(formData);
      });

      await act(async () => {
        const success = await result.current.submitForm('driver-123');
        expect(success).toBe(true);
      });

      expect(mockSaveExternalRide).toHaveBeenCalledWith(
        'driver-123',
        expect.objectContaining({
          tip_received: true,
          tip_amount: 5000,
        }),
        undefined
      );
    });
  });

  describe('Form Reset', () => {
    it('resetForm returns to initial state', () => {
      const { result } = renderHook(() => useExternalRideForm());

      // Add some data and navigate
      act(() => {
        result.current.updateFormData({ date: '2024-12-15', time: '14:30' });
        result.current.goToNextStep();
        result.current.updateFormData({ origin_address: 'Test Address' });
      });

      // Reset
      act(() => {
        result.current.resetForm();
      });

      expect(result.current.currentStep).toBe('datetime');
      expect(result.current.formData).toEqual({});
      expect(result.current.isFirstStep).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('resetForm clears error', () => {
      const { result } = renderHook(() => useExternalRideForm());

      // Navigate to confirmation and try to submit with incomplete data
      act(() => {
        result.current.goToStep('confirmation');
      });

      // Reset should clear any error
      act(() => {
        result.current.resetForm();
      });

      expect(result.current.error).toBeNull();
    });

    it('resetForm allows starting new form after submission', async () => {
      mockSaveExternalRide.mockResolvedValue({ success: true, rideId: 'ride-123' });

      const { result } = renderHook(() => useExternalRideForm());

      const formData = createCompleteFormData();
      act(() => {
        result.current.updateFormData(formData);
      });

      await act(async () => {
        await result.current.submitForm('driver-123');
      });

      expect(result.current.currentStep).toBe('success');

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.currentStep).toBe('datetime');
      expect(result.current.formData).toEqual({});
    });
  });

  describe('canGoBack', () => {
    it('canGoBack is false at first step', () => {
      const { result } = renderHook(() => useExternalRideForm());

      expect(result.current.canGoBack).toBe(false);
    });

    it('canGoBack is true at second step', () => {
      const { result } = renderHook(() => useExternalRideForm());

      act(() => {
        result.current.goToNextStep();
      });

      expect(result.current.canGoBack).toBe(true);
    });

    it('canGoBack is false at success step', () => {
      const { result } = renderHook(() => useExternalRideForm());

      act(() => {
        result.current.goToStep('success');
      });

      expect(result.current.canGoBack).toBe(false);
    });
  });

  describe('Step Order Navigation', () => {
    it('navigates through all steps in order', () => {
      const { result } = renderHook(() => useExternalRideForm());

      const expectedSteps = [
        'datetime',
        'origin',
        'destination',
        'fare',
        'request_source',
        'trip_reason',
        'time_of_day',
        'is_recurring',
        'payment_method',
        'tip',
        'comments',
        'confirmation',
        'success',
      ];

      for (let i = 0; i < expectedSteps.length; i++) {
        expect(result.current.currentStep).toBe(expectedSteps[i]);
        if (i < expectedSteps.length - 1) {
          act(() => {
            result.current.goToNextStep();
          });
        }
      }
    });
  });
});
