/**
 * Tests for VehiclesTable Component
 *
 * Tests rendering, loading states, empty states, actions, and admin features.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { VehiclesTable } from '@/components/VehiclesTable/VehiclesTable';
import type { FirestoreVehicle, DriverWithUser } from '@/core/firebase';
import type { Timestamp } from 'firebase/firestore';

// Helper to create mock Firestore Timestamp
const createMockTimestamp = (date: Date): Timestamp => ({ toDate: () => date }) as Timestamp;

// Mock vehicle data
const createMockVehicle = (overrides: Partial<FirestoreVehicle> = {}): FirestoreVehicle => ({
  id: 'vehicle-001',
  plate: 'ABC123',
  brand: 'Toyota',
  model: 'Corolla',
  year: 2020,
  color: 'Blanco',
  vehicle_type: 'car',
  fuel_type: 'gasoline',
  passenger_capacity: 4,
  luggage_capacity: 2,
  accepts_pets: false,
  accepts_wheelchairs: false,
  has_child_seat: false,
  has_air_conditioning: true,
  status: 'active',
  is_primary: false,
  owner_id: 'owner-001',
  created_at: createMockTimestamp(new Date('2024-01-01')),
  updated_at: createMockTimestamp(new Date('2024-01-01')),
  soat_expiry: createMockTimestamp(new Date('2025-06-15')),
  tecnomecanica_expiry: createMockTimestamp(new Date('2025-08-20')),
  ...overrides,
});

// Mock driver data
const createMockDriver = (overrides: Partial<DriverWithUser> = {}): DriverWithUser => ({
  id: 'driver-001',
  user_id: 'user-001',
  name: 'Juan Pérez',
  email: 'juan@example.com',
  is_active: true,
  created_at: createMockTimestamp(new Date('2024-01-01')),
  phone: '3001234567',
  unique_slug: 'juan-perez',
  ...overrides,
});

describe('VehiclesTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('shows loading spinner when isLoading is true', () => {
      render(<VehiclesTable vehicles={[]} isLoading={true} />);

      expect(screen.getByText(/cargando vehículos/i)).toBeInTheDocument();
    });

    it('shows spinner element during loading', () => {
      const { container } = render(<VehiclesTable vehicles={[]} isLoading={true} />);

      expect(container.querySelector('.spinner')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no vehicles', () => {
      render(<VehiclesTable vehicles={[]} isLoading={false} />);

      expect(screen.getByText(/no hay vehículos registrados/i)).toBeInTheDocument();
      expect(screen.getByText(/agrega tu primer vehículo/i)).toBeInTheDocument();
    });

    it('shows car emoji in empty state', () => {
      render(<VehiclesTable vehicles={[]} isLoading={false} />);

      expect(screen.getByText('🚙')).toBeInTheDocument();
    });

    it('shows add button in empty state when onAddClick provided', () => {
      const onAddClick = vi.fn();
      render(<VehiclesTable vehicles={[]} isLoading={false} onAddClick={onAddClick} />);

      const addButton = screen.getByRole('button', { name: /agregar vehículo/i });
      expect(addButton).toBeInTheDocument();
    });

    it('calls onAddClick when add button clicked', () => {
      const onAddClick = vi.fn();
      render(<VehiclesTable vehicles={[]} isLoading={false} onAddClick={onAddClick} />);

      fireEvent.click(screen.getByRole('button', { name: /agregar vehículo/i }));
      expect(onAddClick).toHaveBeenCalledTimes(1);
    });

    it('hides add button when onAddClick not provided', () => {
      render(<VehiclesTable vehicles={[]} isLoading={false} />);

      expect(screen.queryByRole('button', { name: /agregar vehículo/i })).not.toBeInTheDocument();
    });
  });

  describe('Table Rendering', () => {
    it('renders table with vehicles', () => {
      const vehicles = [createMockVehicle()];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('displays vehicle plate', () => {
      const vehicles = [createMockVehicle({ plate: 'XYZ789' })];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} />);

      expect(screen.getByText('XYZ789')).toBeInTheDocument();
    });

    it('displays vehicle brand and model', () => {
      const vehicles = [createMockVehicle({ brand: 'Honda', model: 'Civic' })];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} />);

      expect(screen.getByText('Honda')).toBeInTheDocument();
      expect(screen.getByText('Civic')).toBeInTheDocument();
    });

    it('displays vehicle year', () => {
      const vehicles = [createMockVehicle({ year: 2022 })];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} />);

      expect(screen.getByText('2022')).toBeInTheDocument();
    });

    it('displays vehicle color', () => {
      const vehicles = [createMockVehicle({ color: 'Rojo' })];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} />);

      expect(screen.getByText('Rojo')).toBeInTheDocument();
    });

    it('displays passenger capacity', () => {
      const vehicles = [createMockVehicle({ passenger_capacity: 5 })];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} />);

      expect(screen.getByText(/5 pasajeros/i)).toBeInTheDocument();
    });

    it('displays multiple vehicles', () => {
      const vehicles = [
        createMockVehicle({ id: 'v1', plate: 'AAA111' }),
        createMockVehicle({ id: 'v2', plate: 'BBB222' }),
        createMockVehicle({ id: 'v3', plate: 'CCC333' }),
      ];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} />);

      expect(screen.getByText('AAA111')).toBeInTheDocument();
      expect(screen.getByText('BBB222')).toBeInTheDocument();
      expect(screen.getByText('CCC333')).toBeInTheDocument();
    });
  });

  describe('Summary Bar', () => {
    it('shows total vehicle count', () => {
      const vehicles = [
        createMockVehicle({ id: 'v1', status: 'active' }),
        createMockVehicle({ id: 'v2', status: 'inactive' }),
      ];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} />);

      // Check summary bar has counts
      const summaryBar = document.querySelector('.summary-bar');
      expect(summaryBar).toBeInTheDocument();

      // Should show 2 vehicles total
      const summaryItems = document.querySelectorAll('.summary-item');
      expect(summaryItems.length).toBeGreaterThanOrEqual(2);

      // Check that 'Vehículos' label exists
      expect(screen.getByText(/vehículos/i)).toBeInTheDocument();
    });

    it('shows active vehicle count', () => {
      const vehicles = [
        createMockVehicle({ id: 'v1', status: 'active' }),
        createMockVehicle({ id: 'v2', status: 'inactive' }),
        createMockVehicle({ id: 'v3', status: 'active' }),
      ];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} />);

      // Should show 2 active
      const summaryItems = screen.getAllByText('2');
      expect(summaryItems.length).toBeGreaterThanOrEqual(1);
    });

    it('uses singular form for one vehicle', () => {
      const vehicles = [createMockVehicle()];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} />);

      // "Vehículo" appears in header and summary - look in summary specifically
      const summaryLabel = document.querySelector('.summary-label');
      expect(summaryLabel).toBeInTheDocument();
      expect(summaryLabel?.textContent).toBe('Vehículo');
    });
  });

  describe('Status Display', () => {
    it('shows active status badge', () => {
      const vehicles = [createMockVehicle({ status: 'active' })];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} />);

      // "Activo" appears in both summary and badge - check for status-badge class
      const statusBadge = document.querySelector('.status-badge.status-success');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge?.textContent).toBe('Activo');
    });

    it('shows inactive status badge', () => {
      const vehicles = [createMockVehicle({ status: 'inactive' })];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} />);

      const statusBadge = document.querySelector('.status-badge.status-warning');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge?.textContent).toBe('Inactivo');
    });

    it('shows maintenance status badge', () => {
      const vehicles = [createMockVehicle({ status: 'maintenance' })];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} />);

      const statusBadge = document.querySelector('.status-badge.status-info');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge?.textContent).toBe('En mantenimiento');
    });

    it('shows pending approval status badge', () => {
      const vehicles = [createMockVehicle({ status: 'pending_approval' })];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} />);

      const statusBadge = document.querySelector('.status-badge.status-pending');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge?.textContent).toBe('Pendiente');
    });
  });

  describe('Vehicle Type Display', () => {
    it('shows car type in Spanish', () => {
      const vehicles = [createMockVehicle({ vehicle_type: 'car' })];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} />);

      expect(screen.getByText('Automóvil')).toBeInTheDocument();
    });

    it('shows SUV type in Spanish', () => {
      const vehicles = [createMockVehicle({ vehicle_type: 'suv' })];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} />);

      expect(screen.getByText('Camioneta')).toBeInTheDocument();
    });

    it('shows van type in Spanish', () => {
      const vehicles = [createMockVehicle({ vehicle_type: 'van' })];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} />);

      expect(screen.getByText('Van')).toBeInTheDocument();
    });

    it('shows motorcycle type in Spanish', () => {
      const vehicles = [createMockVehicle({ vehicle_type: 'motorcycle' })];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} />);

      expect(screen.getByText('Motocicleta')).toBeInTheDocument();
    });
  });

  describe('Primary Vehicle', () => {
    it('shows primary badge for primary vehicle', () => {
      const vehicles = [createMockVehicle({ is_primary: true })];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} />);

      expect(screen.getByText('Principal')).toBeInTheDocument();
    });

    it('does not show primary badge for non-primary vehicle', () => {
      const vehicles = [createMockVehicle({ is_primary: false })];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} />);

      expect(screen.queryByText('Principal')).not.toBeInTheDocument();
    });

    it('hides set primary button for already primary vehicle', () => {
      const onSetPrimary = vi.fn();
      const vehicles = [createMockVehicle({ is_primary: true })];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} onSetPrimary={onSetPrimary} />);

      // Star button for set primary should not be visible
      const starButtons = screen.queryAllByTitle(/establecer como principal/i);
      expect(starButtons).toHaveLength(0);
    });

    it('shows set primary button for non-primary vehicle', () => {
      const onSetPrimary = vi.fn();
      const vehicles = [createMockVehicle({ is_primary: false })];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} onSetPrimary={onSetPrimary} />);

      expect(screen.getByTitle(/establecer como principal/i)).toBeInTheDocument();
    });

    it('calls onSetPrimary when star button clicked', () => {
      const onSetPrimary = vi.fn();
      const vehicles = [createMockVehicle({ id: 'test-vehicle', is_primary: false })];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} onSetPrimary={onSetPrimary} />);

      fireEvent.click(screen.getByTitle(/establecer como principal/i));
      expect(onSetPrimary).toHaveBeenCalledWith('test-vehicle');
    });
  });

  describe('Document Expiry', () => {
    it('shows SOAT expiry date', () => {
      const vehicles = [
        createMockVehicle({
          soat_expiry: createMockTimestamp(new Date('2025-06-15')),
        }),
      ];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} />);

      // Date formatted in Spanish - look for document cells containing date info
      const documentCells = document.querySelectorAll('.document-date');
      expect(documentCells.length).toBeGreaterThan(0);

      // At least one cell should contain date text with "2025"
      const hasDateText = Array.from(documentCells).some(
        (cell) => cell.textContent && cell.textContent.includes('2025')
      );
      expect(hasDateText).toBe(true);
    });

    it('shows expired tag for expired SOAT', () => {
      const vehicles = [
        createMockVehicle({
          soat_expiry: createMockTimestamp(new Date('2020-01-01')),
          tecnomecanica_expiry: createMockTimestamp(new Date('2030-01-01')), // Not expired
        }),
      ];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} />);

      // At least one "Vencido" tag should appear
      expect(screen.getAllByText('Vencido').length).toBeGreaterThanOrEqual(1);
    });

    it('shows warning tag for soon-to-expire SOAT', () => {
      // Create a date 15 days from now
      const soon = new Date();
      soon.setDate(soon.getDate() + 15);

      const vehicles = [
        createMockVehicle({
          soat_expiry: createMockTimestamp(soon),
          tecnomecanica_expiry: createMockTimestamp(new Date('2030-01-01')), // Not expiring
        }),
      ];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} />);

      // At least one "Por vencer" tag should appear
      expect(screen.getAllByText('Por vencer').length).toBeGreaterThanOrEqual(1);
    });

    it('shows dash for null expiry date', () => {
      const vehicles = [
        createMockVehicle({
          soat_expiry: null as unknown as Timestamp,
        }),
      ];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} />);

      // Should show dash for missing date
      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThan(0);
    });
  });

  describe('Vehicle Actions', () => {
    it('shows edit button when onEditVehicle provided', () => {
      const onEditVehicle = vi.fn();
      const vehicles = [createMockVehicle()];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} onEditVehicle={onEditVehicle} />);

      expect(screen.getByTitle(/editar vehículo/i)).toBeInTheDocument();
    });

    it('calls onEditVehicle with vehicle when edit clicked', () => {
      const onEditVehicle = vi.fn();
      const vehicle = createMockVehicle({ id: 'test-123' });
      render(
        <VehiclesTable vehicles={[vehicle]} isLoading={false} onEditVehicle={onEditVehicle} />
      );

      fireEvent.click(screen.getByTitle(/editar vehículo/i));
      expect(onEditVehicle).toHaveBeenCalledWith(vehicle);
    });

    it('shows delete button when onDeleteVehicle provided', () => {
      const onDeleteVehicle = vi.fn();
      const vehicles = [createMockVehicle()];
      render(
        <VehiclesTable vehicles={vehicles} isLoading={false} onDeleteVehicle={onDeleteVehicle} />
      );

      expect(screen.getByTitle(/eliminar vehículo/i)).toBeInTheDocument();
    });

    it('calls onDeleteVehicle after confirmation', () => {
      const onDeleteVehicle = vi.fn();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      const vehicles = [createMockVehicle({ id: 'test-123' })];
      render(
        <VehiclesTable vehicles={vehicles} isLoading={false} onDeleteVehicle={onDeleteVehicle} />
      );

      fireEvent.click(screen.getByTitle(/eliminar vehículo/i));

      expect(confirmSpy).toHaveBeenCalled();
      expect(onDeleteVehicle).toHaveBeenCalledWith('test-123');

      confirmSpy.mockRestore();
    });

    it('does not call onDeleteVehicle when confirmation cancelled', () => {
      const onDeleteVehicle = vi.fn();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      const vehicles = [createMockVehicle()];
      render(
        <VehiclesTable vehicles={vehicles} isLoading={false} onDeleteVehicle={onDeleteVehicle} />
      );

      fireEvent.click(screen.getByTitle(/eliminar vehículo/i));

      expect(confirmSpy).toHaveBeenCalled();
      expect(onDeleteVehicle).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });
  });

  describe('Admin View', () => {
    it('shows driver column in admin view', () => {
      const vehicles = [createMockVehicle()];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} isAdminView={true} />);

      expect(screen.getByText('Conductor')).toBeInTheDocument();
    });

    it('hides driver column in non-admin view', () => {
      const vehicles = [createMockVehicle()];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} isAdminView={false} />);

      expect(screen.queryByText('Conductor')).not.toBeInTheDocument();
    });

    it('shows driver select when onAssignDriver provided', () => {
      const onAssignDriver = vi.fn();
      const drivers = [createMockDriver()];
      const vehicles = [createMockVehicle()];

      render(
        <VehiclesTable
          vehicles={vehicles}
          isLoading={false}
          isAdminView={true}
          drivers={drivers}
          onAssignDriver={onAssignDriver}
        />
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('shows driver options in select', () => {
      const onAssignDriver = vi.fn();
      const drivers = [
        createMockDriver({ id: 'd1', name: 'Juan' }),
        createMockDriver({ id: 'd2', name: 'María' }),
      ];
      const vehicles = [createMockVehicle()];

      render(
        <VehiclesTable
          vehicles={vehicles}
          isLoading={false}
          isAdminView={true}
          drivers={drivers}
          onAssignDriver={onAssignDriver}
        />
      );

      const select = screen.getByRole('combobox');
      expect(within(select).getByText('Juan')).toBeInTheDocument();
      expect(within(select).getByText('María')).toBeInTheDocument();
    });

    it('calls onAssignDriver when driver selected', () => {
      const onAssignDriver = vi.fn();
      const drivers = [createMockDriver({ id: 'driver-123', name: 'Juan' })];
      const vehicles = [createMockVehicle({ id: 'vehicle-456' })];

      render(
        <VehiclesTable
          vehicles={vehicles}
          isLoading={false}
          isAdminView={true}
          drivers={drivers}
          onAssignDriver={onAssignDriver}
        />
      );

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'driver-123' } });

      expect(onAssignDriver).toHaveBeenCalledWith('vehicle-456', 'driver-123');
    });

    it('calls onUnassignDriver when "Sin asignar" selected', () => {
      const onUnassignDriver = vi.fn();
      const onAssignDriver = vi.fn();
      const drivers = [createMockDriver({ id: 'driver-123' })];
      const vehicles = [createMockVehicle({ id: 'vehicle-456', assigned_driver_id: 'driver-123' })];

      render(
        <VehiclesTable
          vehicles={vehicles}
          isLoading={false}
          isAdminView={true}
          drivers={drivers}
          onAssignDriver={onAssignDriver}
          onUnassignDriver={onUnassignDriver}
        />
      );

      fireEvent.change(screen.getByRole('combobox'), { target: { value: '' } });

      expect(onUnassignDriver).toHaveBeenCalledWith('vehicle-456');
    });

    it('shows "Sin asignar" text when no driver assigned and no onAssignDriver', () => {
      const vehicles = [createMockVehicle({ assigned_driver_id: undefined })];

      render(
        <VehiclesTable vehicles={vehicles} isLoading={false} isAdminView={true} drivers={[]} />
      );

      expect(screen.getByText('Sin asignar')).toBeInTheDocument();
    });
  });

  describe('Vehicle Photo', () => {
    it('shows vehicle photo when URL provided', () => {
      const vehicles = [
        createMockVehicle({
          photo_url: 'https://example.com/car.jpg',
          brand: 'Toyota',
          model: 'Corolla',
        }),
      ];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} />);

      const img = screen.getByAltText(/toyota corolla/i);
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/car.jpg');
    });

    it('shows placeholder when no photo URL', () => {
      const vehicles = [createMockVehicle({ photo_url: undefined })];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} />);

      expect(screen.getByText('🚗')).toBeInTheDocument();
    });
  });

  describe('Document Links', () => {
    it('shows SOAT document link when URL provided', () => {
      const vehicles = [
        createMockVehicle({
          soat_document_url: 'https://example.com/soat.pdf',
        }),
      ];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} />);

      const link = screen.getByTitle(/ver documento soat/i);
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://example.com/soat.pdf');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('shows tecnomecanica document link when URL provided', () => {
      const vehicles = [
        createMockVehicle({
          tecnomecanica_document_url: 'https://example.com/tecno.pdf',
        }),
      ];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} />);

      const link = screen.getByTitle(/ver documento tecnomecánica/i);
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://example.com/tecno.pdf');
    });
  });

  describe('Table Headers', () => {
    it('has all required column headers', () => {
      const vehicles = [createMockVehicle()];
      render(<VehiclesTable vehicles={vehicles} isLoading={false} />);

      // Use getAllByRole to find table header cells
      const headers = screen.getAllByRole('columnheader');

      // Check header count (should have at least 10 columns)
      expect(headers.length).toBeGreaterThanOrEqual(10);

      // Check specific headers exist in the table head
      const headerTexts = headers.map((h) => h.textContent);
      expect(headerTexts).toContain('Foto');
      expect(headerTexts).toContain('Placa');
      expect(headerTexts).toContain('Vehículo');
      expect(headerTexts).toContain('Tipo');
      expect(headerTexts).toContain('Color');
    });
  });
});
