/**
 * Tests for VehicleForm Component
 *
 * Tests form rendering, validation, and submission.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Firebase module before importing component
vi.mock('@/core/firebase', () => ({
  firebaseApp: {},
  firebaseAuth: { config: { authDomain: 'test.firebaseapp.com' } },
  firebaseStorage: {},
}));

import { VehicleForm } from '@/components/VehicleForm';

describe('VehicleForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the form with all required fields', () => {
      render(<VehicleForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Check for required field labels
      expect(screen.getByLabelText(/placa/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/año/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/marca/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/modelo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/color/i)).toBeInTheDocument();
    });

    it('renders form title for adding new vehicle', () => {
      render(<VehicleForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Check for heading specifically
      expect(screen.getByRole('heading', { name: /agregar vehículo/i })).toBeInTheDocument();
    });

    it('renders form title for editing existing vehicle', () => {
      const existingVehicle = {
        id: 'vehicle-1',
        plate: 'ABC123',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2022,
        color: 'Blanco',
        vehicle_type: 'car' as const,
        fuel_type: 'gasoline' as const,
        passenger_capacity: 4,
        luggage_capacity: 2,
        accepts_pets: false,
        accepts_wheelchairs: false,
        has_child_seat: false,
        has_air_conditioning: true,
        soat_expiry: null,
        tecnomecanica_expiry: null,
        status: 'active' as const,
        is_primary: true,
        photo_url: null,
        notes: null,
        created_at: { toDate: () => new Date() },
        updated_at: { toDate: () => new Date() },
      };

      render(
        <VehicleForm
          vehicle={existingVehicle as any}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/editar vehículo/i)).toBeInTheDocument();
    });

    it('renders vehicle type dropdown with options', () => {
      render(<VehicleForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const vehicleTypeSelect = screen.getByLabelText(/tipo de vehículo/i);
      expect(vehicleTypeSelect).toBeInTheDocument();

      // Check options
      expect(screen.getByRole('option', { name: /automóvil/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /camioneta/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /van/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /motocicleta/i })).toBeInTheDocument();
    });

    it('renders fuel type dropdown with options', () => {
      render(<VehicleForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const fuelTypeSelect = screen.getByLabelText(/tipo de combustible/i);
      expect(fuelTypeSelect).toBeInTheDocument();

      // Check options
      expect(screen.getByRole('option', { name: /gasolina/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /diesel/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /eléctrico/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /híbrido/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /^gas$/i })).toBeInTheDocument();
    });

    it('renders capability checkboxes', () => {
      render(<VehicleForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByLabelText(/acepta mascotas/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/acepta sillas de ruedas/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tiene silla para niños/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tiene aire acondicionado/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/vehículo principal/i)).toBeInTheDocument();
    });

    it('renders submit and cancel buttons', () => {
      render(<VehicleForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByRole('button', { name: /agregar vehículo/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });

    it('shows "Guardando..." when submitting', () => {
      render(
        <VehicleForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={true} />
      );

      expect(screen.getByRole('button', { name: /guardando/i })).toBeInTheDocument();
    });
  });

  describe('Form Actions', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<VehicleForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await user.click(screen.getByRole('button', { name: /cancelar/i }));

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<VehicleForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Close button is the × in the header
      await user.click(screen.getByRole('button', { name: /cerrar/i }));

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Validation', () => {
    it('shows error for empty plate', async () => {
      const user = userEvent.setup();
      render(<VehicleForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Try to submit empty form
      await user.click(screen.getByRole('button', { name: /agregar vehículo/i }));

      await waitFor(() => {
        expect(screen.getByText(/al menos 6 caracteres/i)).toBeInTheDocument();
      });
    });

    it('does not submit form with validation errors', async () => {
      const user = userEvent.setup();
      render(<VehicleForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Try to submit form without filling required fields
      await user.click(screen.getByRole('button', { name: /agregar vehículo/i }));

      // Form should not be submitted
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Default Values', () => {
    it('sets default vehicle type to car', () => {
      render(<VehicleForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const vehicleTypeSelect = screen.getByLabelText(
        /tipo de vehículo/i
      ) as HTMLSelectElement;
      expect(vehicleTypeSelect.value).toBe('car');
    });

    it('sets default fuel type to gasoline', () => {
      render(<VehicleForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const fuelTypeSelect = screen.getByLabelText(
        /tipo de combustible/i
      ) as HTMLSelectElement;
      expect(fuelTypeSelect.value).toBe('gasoline');
    });

    it('sets default passenger capacity to 4', () => {
      render(<VehicleForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const passengerInput = screen.getByLabelText(
        /capacidad de pasajeros/i
      ) as HTMLInputElement;
      expect(passengerInput.value).toBe('4');
    });
  });

  describe('Pre-populated Values', () => {
    const existingVehicle = {
      id: 'vehicle-1',
      driver_id: 'driver-1',
      plate: 'XYZ789',
      brand: 'Honda',
      model: 'Civic',
      year: 2023,
      color: 'Azul',
      vehicle_type: 'suv' as const,
      fuel_type: 'hybrid' as const,
      passenger_capacity: 5,
      luggage_capacity: 3,
      accepts_pets: true,
      accepts_wheelchairs: true,
      has_child_seat: true,
      has_air_conditioning: true,
      soat_expiry: null,
      tecnomecanica_expiry: null,
      status: 'active' as const,
      is_primary: false,
      photo_url: null,
      notes: 'Test notes',
      created_at: { toDate: () => new Date() },
      updated_at: { toDate: () => new Date() },
    };

    it('pre-populates plate field', () => {
      render(
        <VehicleForm
          vehicle={existingVehicle as any}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const plateInput = screen.getByLabelText(/placa/i) as HTMLInputElement;
      expect(plateInput.value).toBe('XYZ789');
    });

    it('pre-populates brand field', () => {
      render(
        <VehicleForm
          vehicle={existingVehicle as any}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const brandInput = screen.getByLabelText(/marca/i) as HTMLInputElement;
      expect(brandInput.value).toBe('Honda');
    });

    it('pre-populates vehicle type dropdown', () => {
      render(
        <VehicleForm
          vehicle={existingVehicle as any}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const vehicleTypeSelect = screen.getByLabelText(
        /tipo de vehículo/i
      ) as HTMLSelectElement;
      expect(vehicleTypeSelect.value).toBe('suv');
    });

    it('pre-populates checkboxes', () => {
      render(
        <VehicleForm
          vehicle={existingVehicle as any}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(
        (screen.getByLabelText(/acepta mascotas/i) as HTMLInputElement).checked
      ).toBe(true);
      expect(
        (screen.getByLabelText(/acepta sillas de ruedas/i) as HTMLInputElement).checked
      ).toBe(true);
    });
  });
});
