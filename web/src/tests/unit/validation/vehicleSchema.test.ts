/**
 * Tests for Vehicle Form Validation Schema
 *
 * Tests the Zod validation rules for the vehicle form.
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Recreate the schema for testing (matches VehicleForm.tsx)
const currentYear = new Date().getFullYear();

const vehicleSchema = z.object({
  plate: z
    .string()
    .min(6, 'La placa debe tener al menos 6 caracteres')
    .regex(/^[A-Za-z]{3}-?\d{3}$/, 'Formato de placa invalido (ej: ABC123 o ABC-123)'),
  brand: z.string().min(2, 'La marca es requerida'),
  model: z.string().min(1, 'El modelo es requerido'),
  year: z.coerce
    .number()
    .min(1990, 'El año debe ser mayor a 1990')
    .max(currentYear + 1, 'Año inválido'),
  color: z.string().min(2, 'El color es requerido'),
  vehicle_type: z.enum(['car', 'suv', 'van', 'motorcycle']),
  fuel_type: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'gas']),
  passenger_capacity: z.coerce.number().min(1, 'Mínimo 1 pasajero').max(15, 'Máximo 15 pasajeros'),
  luggage_capacity: z.coerce.number().min(0).max(10).optional(),
  accepts_pets: z.boolean().optional(),
  accepts_wheelchairs: z.boolean().optional(),
  has_child_seat: z.boolean().optional(),
  has_air_conditioning: z.boolean().optional(),
  soat_expiry: z.string().optional(),
  tecnomecanica_expiry: z.string().optional(),
  is_primary: z.boolean().optional(),
  notes: z.string().optional(),
});

// Helper to create a valid vehicle object for tests
const createValidVehicle = (overrides = {}) => ({
  plate: 'ABC123',
  brand: 'Toyota',
  model: 'Corolla',
  year: 2022,
  color: 'Blanco',
  vehicle_type: 'car' as const,
  fuel_type: 'gasoline' as const,
  passenger_capacity: 4,
  ...overrides,
});

describe('Vehicle Schema Validation', () => {
  describe('Plate Validation', () => {
    it('accepts valid plate format ABC123', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ plate: 'ABC123' }));
      expect(result.success).toBe(true);
    });

    it('accepts plate format with hyphen ABC-123', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ plate: 'ABC-123' }));
      expect(result.success).toBe(true);
    });

    it('accepts lowercase plate and validates', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ plate: 'abc123' }));
      expect(result.success).toBe(true);
    });

    it('accepts lowercase plate with hyphen', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ plate: 'xyz-789' }));
      expect(result.success).toBe(true);
    });

    it('rejects plate with too few characters', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ plate: 'AB12' }));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('6 caracteres');
      }
    });

    it('rejects plate with invalid format (numbers first)', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ plate: '123ABC' }));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Formato de placa invalido');
      }
    });

    it('rejects plate with only letters', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ plate: 'ABCDEF' }));
      expect(result.success).toBe(false);
    });

    it('rejects plate with only numbers', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ plate: '123456' }));
      expect(result.success).toBe(false);
    });

    it('rejects empty plate', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ plate: '' }));
      expect(result.success).toBe(false);
    });

    it('rejects plate with special characters', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ plate: 'ABC@123' }));
      expect(result.success).toBe(false);
    });
  });

  describe('Brand Validation', () => {
    it('accepts valid brand name', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ brand: 'Toyota' }));
      expect(result.success).toBe(true);
    });

    it('accepts brand with minimum 2 characters', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ brand: 'KI' }));
      expect(result.success).toBe(true);
    });

    it('rejects brand with less than 2 characters', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ brand: 'T' }));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('marca es requerida');
      }
    });

    it('rejects empty brand', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ brand: '' }));
      expect(result.success).toBe(false);
    });
  });

  describe('Model Validation', () => {
    it('accepts valid model name', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ model: 'Corolla' }));
      expect(result.success).toBe(true);
    });

    it('accepts model with minimum 1 character', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ model: 'X' }));
      expect(result.success).toBe(true);
    });

    it('rejects empty model', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ model: '' }));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('modelo es requerido');
      }
    });
  });

  describe('Year Validation', () => {
    it('accepts valid year', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ year: 2022 }));
      expect(result.success).toBe(true);
    });

    it('accepts year 1990 (minimum)', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ year: 1990 }));
      expect(result.success).toBe(true);
    });

    it('accepts next year (for new models)', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ year: currentYear + 1 }));
      expect(result.success).toBe(true);
    });

    it('coerces string year to number', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ year: '2022' }));
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.year).toBe(2022);
      }
    });

    it('rejects year before 1990', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ year: 1985 }));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('mayor a 1990');
      }
    });

    it('rejects year too far in the future', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ year: currentYear + 5 }));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Año inválido');
      }
    });
  });

  describe('Color Validation', () => {
    it('accepts valid color', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ color: 'Blanco' }));
      expect(result.success).toBe(true);
    });

    it('rejects color with less than 2 characters', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ color: 'R' }));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('color es requerido');
      }
    });
  });

  describe('Vehicle Type Validation', () => {
    it('accepts "car" type', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ vehicle_type: 'car' }));
      expect(result.success).toBe(true);
    });

    it('accepts "suv" type', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ vehicle_type: 'suv' }));
      expect(result.success).toBe(true);
    });

    it('accepts "van" type', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ vehicle_type: 'van' }));
      expect(result.success).toBe(true);
    });

    it('accepts "motorcycle" type', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ vehicle_type: 'motorcycle' }));
      expect(result.success).toBe(true);
    });

    it('rejects invalid vehicle type', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ vehicle_type: 'truck' }));
      expect(result.success).toBe(false);
    });
  });

  describe('Fuel Type Validation', () => {
    const fuelTypes = ['gasoline', 'diesel', 'electric', 'hybrid', 'gas'] as const;

    fuelTypes.forEach((fuelType) => {
      it(`accepts "${fuelType}" fuel type`, () => {
        const result = vehicleSchema.safeParse(createValidVehicle({ fuel_type: fuelType }));
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid fuel type', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ fuel_type: 'hydrogen' }));
      expect(result.success).toBe(false);
    });
  });

  describe('Passenger Capacity Validation', () => {
    it('accepts valid passenger capacity', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ passenger_capacity: 4 }));
      expect(result.success).toBe(true);
    });

    it('accepts minimum capacity of 1', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ passenger_capacity: 1 }));
      expect(result.success).toBe(true);
    });

    it('accepts maximum capacity of 15', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ passenger_capacity: 15 }));
      expect(result.success).toBe(true);
    });

    it('coerces string capacity to number', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ passenger_capacity: '5' }));
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.passenger_capacity).toBe(5);
      }
    });

    it('rejects capacity less than 1', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ passenger_capacity: 0 }));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Mínimo 1 pasajero');
      }
    });

    it('rejects capacity greater than 15', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ passenger_capacity: 20 }));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Máximo 15 pasajeros');
      }
    });
  });

  describe('Optional Fields', () => {
    it('accepts vehicle without optional fields', () => {
      const result = vehicleSchema.safeParse({
        plate: 'ABC123',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2022,
        color: 'Blanco',
        vehicle_type: 'car',
        fuel_type: 'gasoline',
        passenger_capacity: 4,
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid luggage capacity', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ luggage_capacity: 3 }));
      expect(result.success).toBe(true);
    });

    it('rejects luggage capacity greater than 10', () => {
      const result = vehicleSchema.safeParse(createValidVehicle({ luggage_capacity: 15 }));
      expect(result.success).toBe(false);
    });

    it('accepts boolean flags', () => {
      const result = vehicleSchema.safeParse(
        createValidVehicle({
          accepts_pets: true,
          accepts_wheelchairs: true,
          has_child_seat: true,
          has_air_conditioning: true,
          is_primary: true,
        })
      );
      expect(result.success).toBe(true);
    });

    it('accepts date strings for document expiry', () => {
      const result = vehicleSchema.safeParse(
        createValidVehicle({
          soat_expiry: '2025-06-15',
          tecnomecanica_expiry: '2025-12-31',
        })
      );
      expect(result.success).toBe(true);
    });

    it('accepts notes field', () => {
      const result = vehicleSchema.safeParse(
        createValidVehicle({
          notes: 'Vehicle has leather seats and premium audio system',
        })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('Complete Form Validation', () => {
    it('validates a complete valid vehicle form', () => {
      const completeVehicle = {
        plate: 'XYZ-789',
        brand: 'Chevrolet',
        model: 'Spark',
        year: 2023,
        color: 'Rojo',
        vehicle_type: 'car' as const,
        fuel_type: 'gasoline' as const,
        passenger_capacity: 4,
        luggage_capacity: 2,
        accepts_pets: true,
        accepts_wheelchairs: false,
        has_child_seat: false,
        has_air_conditioning: true,
        soat_expiry: '2025-06-15',
        tecnomecanica_expiry: '2025-12-31',
        is_primary: true,
        notes: 'Vehículo principal del conductor',
      };

      const result = vehicleSchema.safeParse(completeVehicle);
      expect(result.success).toBe(true);
    });

    it('returns all validation errors for invalid form', () => {
      const invalidVehicle = {
        plate: '', // Invalid
        brand: '', // Invalid
        model: '', // Invalid
        year: 1980, // Invalid
        color: '', // Invalid
        vehicle_type: 'invalid', // Invalid
        fuel_type: 'invalid', // Invalid
        passenger_capacity: 0, // Invalid
      };

      const result = vehicleSchema.safeParse(invalidVehicle);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Should have multiple validation errors
        expect(result.error.issues.length).toBeGreaterThan(5);
      }
    });
  });
});
