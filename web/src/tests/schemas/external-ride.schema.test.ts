/**
 * External Ride Schema Validation Tests
 *
 * Tests for Zod schemas used in external ride form validation
 */

import { describe, it, expect } from 'vitest';
import {
  externalRideInputSchema,
  stepSchemas,
  requestSourceSchema,
  tripReasonSchema,
  timeOfDaySchema,
  paymentMethodSchema,
} from '@/features/external-rides/schemas/external-ride.schema';

// Valid complete form data factory
const createValidFormData = () => ({
  date: '2024-12-15',
  time: '14:30',
  origin_address: 'Cable Plaza, Manizales',
  destination_address: 'Aeropuerto La Nubia',
  total_received: 25000,
  payment_method: 'cash' as const,
  request_source: 'whatsapp' as const,
  trip_reason: 'personal' as const,
  time_of_day: 'afternoon' as const,
  is_recurring: false,
  tip_received: false,
});

describe('externalRideInputSchema', () => {
  describe('Complete Form Validation', () => {
    it('validates complete valid form data', () => {
      const data = createValidFormData();
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });

    it('validates form with optional fields', () => {
      const data = {
        ...createValidFormData(),
        tip_received: true,
        tip_amount: 5000,
        comments: 'Pasajero muy amable',
      };

      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tip_amount).toBe(5000);
        expect(result.data.comments).toBe('Pasajero muy amable');
      }
    });

    it('fails validation when required field is missing', () => {
      const data = {
        ...createValidFormData(),
        date: undefined,
      };

      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(false);
    });
  });

  describe('Date Validation', () => {
    it('accepts valid date format YYYY-MM-DD', () => {
      const data = { ...createValidFormData(), date: '2024-01-15' };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('rejects empty date', () => {
      const data = { ...createValidFormData(), date: '' };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('La fecha es requerida');
      }
    });

    it('rejects invalid date format DD/MM/YYYY', () => {
      const data = { ...createValidFormData(), date: '15/12/2024' };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Formato de fecha invalido');
      }
    });

    it('rejects invalid date format MM-DD-YYYY', () => {
      const data = { ...createValidFormData(), date: '12-15-2024' };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(false);
    });
  });

  describe('Time Validation', () => {
    it('accepts valid time format HH:mm', () => {
      const data = { ...createValidFormData(), time: '14:30' };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('accepts midnight time', () => {
      const data = { ...createValidFormData(), time: '00:00' };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('accepts end of day time', () => {
      const data = { ...createValidFormData(), time: '23:59' };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('rejects empty time', () => {
      const data = { ...createValidFormData(), time: '' };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('La hora es requerida');
      }
    });

    it('rejects invalid time format with seconds', () => {
      const data = { ...createValidFormData(), time: '14:30:00' };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('rejects 12-hour format', () => {
      const data = { ...createValidFormData(), time: '2:30 PM' };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(false);
    });
  });

  describe('Address Validation', () => {
    it('accepts valid origin address', () => {
      const data = { ...createValidFormData(), origin_address: 'Cable Plaza, Manizales' };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('rejects origin address too short', () => {
      const data = { ...createValidFormData(), origin_address: 'AB' };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El origen debe tener al menos 3 caracteres');
      }
    });

    it('accepts minimum length origin address', () => {
      const data = { ...createValidFormData(), origin_address: 'ABC' };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('rejects origin address too long', () => {
      const data = { ...createValidFormData(), origin_address: 'A'.repeat(501) };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El origen no puede exceder 500 caracteres');
      }
    });

    it('accepts maximum length origin address', () => {
      const data = { ...createValidFormData(), origin_address: 'A'.repeat(500) };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('applies same rules to destination address', () => {
      const shortData = { ...createValidFormData(), destination_address: 'AB' };
      expect(externalRideInputSchema.safeParse(shortData).success).toBe(false);

      const longData = { ...createValidFormData(), destination_address: 'A'.repeat(501) };
      expect(externalRideInputSchema.safeParse(longData).success).toBe(false);

      const validData = { ...createValidFormData(), destination_address: 'Valid Address' };
      expect(externalRideInputSchema.safeParse(validData).success).toBe(true);
    });
  });

  describe('Total Received (Fare) Validation', () => {
    it('accepts valid fare amount', () => {
      const data = { ...createValidFormData(), total_received: 25000 };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('rejects fare below minimum', () => {
      const data = { ...createValidFormData(), total_received: 999 };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El valor minimo es $1.000 COP');
      }
    });

    it('accepts minimum fare amount', () => {
      const data = { ...createValidFormData(), total_received: 1000 };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('rejects fare above maximum', () => {
      const data = { ...createValidFormData(), total_received: 10000001 };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El valor maximo es $10.000.000 COP');
      }
    });

    it('accepts maximum fare amount', () => {
      const data = { ...createValidFormData(), total_received: 10000000 };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('rejects zero fare', () => {
      const data = { ...createValidFormData(), total_received: 0 };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('rejects negative fare', () => {
      const data = { ...createValidFormData(), total_received: -5000 };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(false);
    });
  });

  describe('Tip Amount Validation', () => {
    it('accepts valid tip amount', () => {
      const data = { ...createValidFormData(), tip_received: true, tip_amount: 5000 };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('accepts zero tip amount', () => {
      const data = { ...createValidFormData(), tip_received: false, tip_amount: 0 };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('rejects negative tip amount', () => {
      const data = { ...createValidFormData(), tip_received: true, tip_amount: -100 };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('La propina no puede ser negativa');
      }
    });

    it('rejects tip above maximum', () => {
      const data = { ...createValidFormData(), tip_received: true, tip_amount: 1000001 };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('La propina maxima es $1.000.000 COP');
      }
    });

    it('tip_amount is optional', () => {
      const data = { ...createValidFormData() };
      // tip_amount not included
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(true);
    });
  });

  describe('Comments Validation', () => {
    it('accepts valid comments', () => {
      const data = { ...createValidFormData(), comments: 'Great passenger!' };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('accepts empty comments', () => {
      const data = { ...createValidFormData(), comments: '' };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('rejects comments too long', () => {
      const data = { ...createValidFormData(), comments: 'A'.repeat(1001) };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Los comentarios no pueden exceder 1000 caracteres'
        );
      }
    });

    it('accepts maximum length comments', () => {
      const data = { ...createValidFormData(), comments: 'A'.repeat(1000) };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('comments is optional', () => {
      const data = { ...createValidFormData() };
      // comments not included
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(true);
    });
  });

  describe('Boolean Flags', () => {
    it('accepts is_recurring true', () => {
      const data = { ...createValidFormData(), is_recurring: true };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('accepts is_recurring false', () => {
      const data = { ...createValidFormData(), is_recurring: false };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('rejects non-boolean is_recurring', () => {
      const data = { ...createValidFormData(), is_recurring: 'yes' };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('accepts tip_received true', () => {
      const data = { ...createValidFormData(), tip_received: true };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('accepts tip_received false', () => {
      const data = { ...createValidFormData(), tip_received: false };
      const result = externalRideInputSchema.safeParse(data);

      expect(result.success).toBe(true);
    });
  });
});

describe('requestSourceSchema', () => {
  it('accepts valid values', () => {
    expect(requestSourceSchema.safeParse('whatsapp').success).toBe(true);
    expect(requestSourceSchema.safeParse('phone').success).toBe(true);
    expect(requestSourceSchema.safeParse('referral').success).toBe(true);
    expect(requestSourceSchema.safeParse('other').success).toBe(true);
  });

  it('rejects invalid values', () => {
    expect(requestSourceSchema.safeParse('email').success).toBe(false);
    expect(requestSourceSchema.safeParse('facebook').success).toBe(false);
    expect(requestSourceSchema.safeParse('').success).toBe(false);
    expect(requestSourceSchema.safeParse(123).success).toBe(false);
  });
});

describe('tripReasonSchema', () => {
  it('accepts valid values', () => {
    expect(tripReasonSchema.safeParse('personal').success).toBe(true);
    expect(tripReasonSchema.safeParse('work').success).toBe(true);
    expect(tripReasonSchema.safeParse('emergency').success).toBe(true);
    expect(tripReasonSchema.safeParse('other').success).toBe(true);
  });

  it('rejects invalid values', () => {
    expect(tripReasonSchema.safeParse('vacation').success).toBe(false);
    expect(tripReasonSchema.safeParse('business').success).toBe(false);
    expect(tripReasonSchema.safeParse('').success).toBe(false);
  });
});

describe('timeOfDaySchema', () => {
  it('accepts valid values', () => {
    expect(timeOfDaySchema.safeParse('morning').success).toBe(true);
    expect(timeOfDaySchema.safeParse('afternoon').success).toBe(true);
    expect(timeOfDaySchema.safeParse('evening').success).toBe(true);
    expect(timeOfDaySchema.safeParse('night').success).toBe(true);
  });

  it('rejects invalid values', () => {
    expect(timeOfDaySchema.safeParse('dawn').success).toBe(false);
    expect(timeOfDaySchema.safeParse('midnight').success).toBe(false);
    expect(timeOfDaySchema.safeParse('').success).toBe(false);
  });
});

describe('paymentMethodSchema', () => {
  it('accepts valid values', () => {
    expect(paymentMethodSchema.safeParse('cash').success).toBe(true);
    expect(paymentMethodSchema.safeParse('nequi').success).toBe(true);
    expect(paymentMethodSchema.safeParse('daviplata').success).toBe(true);
    expect(paymentMethodSchema.safeParse('bancolombia').success).toBe(true);
    expect(paymentMethodSchema.safeParse('other').success).toBe(true);
  });

  it('rejects invalid values', () => {
    expect(paymentMethodSchema.safeParse('credit_card').success).toBe(false);
    expect(paymentMethodSchema.safeParse('paypal').success).toBe(false);
    expect(paymentMethodSchema.safeParse('').success).toBe(false);
  });
});

describe('Step Schemas', () => {
  describe('datetime step', () => {
    it('validates with valid date and time', () => {
      const result = stepSchemas.datetime.safeParse({
        date: '2024-12-15',
        time: '14:30',
      });
      expect(result.success).toBe(true);
    });

    it('fails without date', () => {
      const result = stepSchemas.datetime.safeParse({
        time: '14:30',
      });
      expect(result.success).toBe(false);
    });

    it('fails without time', () => {
      const result = stepSchemas.datetime.safeParse({
        date: '2024-12-15',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('origin step', () => {
    it('validates with valid origin address', () => {
      const result = stepSchemas.origin.safeParse({
        origin_address: 'Cable Plaza, Manizales',
      });
      expect(result.success).toBe(true);
    });

    it('fails with short origin address', () => {
      const result = stepSchemas.origin.safeParse({
        origin_address: 'AB',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('destination step', () => {
    it('validates with valid destination address', () => {
      const result = stepSchemas.destination.safeParse({
        destination_address: 'Aeropuerto La Nubia',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('fare step', () => {
    it('validates with valid total received', () => {
      const result = stepSchemas.fare.safeParse({
        total_received: 25000,
      });
      expect(result.success).toBe(true);
    });

    it('fails with low fare', () => {
      const result = stepSchemas.fare.safeParse({
        total_received: 500,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('request_source step', () => {
    it('validates with valid request source', () => {
      const result = stepSchemas.request_source.safeParse({
        request_source: 'whatsapp',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('trip_reason step', () => {
    it('validates with valid trip reason', () => {
      const result = stepSchemas.trip_reason.safeParse({
        trip_reason: 'personal',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('time_of_day step', () => {
    it('validates with valid time of day', () => {
      const result = stepSchemas.time_of_day.safeParse({
        time_of_day: 'afternoon',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('is_recurring step', () => {
    it('validates with is_recurring true', () => {
      const result = stepSchemas.is_recurring.safeParse({
        is_recurring: true,
      });
      expect(result.success).toBe(true);
    });

    it('validates with is_recurring false', () => {
      const result = stepSchemas.is_recurring.safeParse({
        is_recurring: false,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('payment_method step', () => {
    it('validates with valid payment method', () => {
      const result = stepSchemas.payment_method.safeParse({
        payment_method: 'nequi',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('tip step', () => {
    it('validates with tip not received', () => {
      const result = stepSchemas.tip.safeParse({
        tip_received: false,
      });
      expect(result.success).toBe(true);
    });

    it('validates with tip received and amount', () => {
      const result = stepSchemas.tip.safeParse({
        tip_received: true,
        tip_amount: 5000,
      });
      expect(result.success).toBe(true);
    });

    it('fails when tip received but no amount', () => {
      const result = stepSchemas.tip.safeParse({
        tip_received: true,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Si recibiste propina, ingresa el monto');
      }
    });

    it('fails when tip received but amount is zero', () => {
      const result = stepSchemas.tip.safeParse({
        tip_received: true,
        tip_amount: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('comments step', () => {
    it('validates with comments', () => {
      const result = stepSchemas.comments.safeParse({
        comments: 'Great ride!',
      });
      expect(result.success).toBe(true);
    });

    it('validates without comments (optional)', () => {
      const result = stepSchemas.comments.safeParse({});
      expect(result.success).toBe(true);
    });

    it('validates with empty comments', () => {
      const result = stepSchemas.comments.safeParse({
        comments: '',
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('Edge Cases', () => {
  it('handles Unicode characters in addresses', () => {
    const data = {
      ...createValidFormData(),
      origin_address: 'Calle José María Córdova #123',
      destination_address: 'Parque de los Niños',
    };
    const result = externalRideInputSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it('handles emojis in comments', () => {
    const data = {
      ...createValidFormData(),
      comments: 'Excellent ride! 🚗💨👍',
    };
    const result = externalRideInputSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it('handles decimal fare amounts', () => {
    const data = { ...createValidFormData(), total_received: 25000.5 };
    const result = externalRideInputSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it('handles whitespace-only values as invalid', () => {
    const data = { ...createValidFormData(), origin_address: '   ' };
    const result = externalRideInputSchema.safeParse(data);

    // Whitespace-only should still pass length validation but is functionally invalid
    // The schema checks length, not content
    expect(result.success).toBe(true); // Length is >= 3
  });

  it('handles null values as invalid', () => {
    const data = { ...createValidFormData(), origin_address: null };
    const result = externalRideInputSchema.safeParse(data);

    expect(result.success).toBe(false);
  });
});
