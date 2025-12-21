/**
 * Tests for useDriverVehicles Hook
 *
 * Tests the vehicle management hook including CRUD operations and optimistic updates.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Use vi.hoisted to create mock functions before vi.mock is hoisted
const {
  mockGetOwnerVehicles,
  mockCreateVehicle,
  mockUpdateVehicle,
  mockDeleteVehicle,
  mockSetVehicleAsPrimary,
} = vi.hoisted(() => ({
  mockGetOwnerVehicles: vi.fn(),
  mockCreateVehicle: vi.fn(),
  mockUpdateVehicle: vi.fn(),
  mockDeleteVehicle: vi.fn(),
  mockSetVehicleAsPrimary: vi.fn(),
}));

// Mock the entire Firebase module to avoid config issues
vi.mock('@/core/firebase', () => ({
  getOwnerVehicles: mockGetOwnerVehicles,
  getDriverVehicles: mockGetOwnerVehicles, // Alias for backward compatibility
  getVehicle: vi.fn(),
  createVehicle: mockCreateVehicle,
  updateVehicle: mockUpdateVehicle,
  deleteVehicle: mockDeleteVehicle,
  setVehicleAsPrimary: mockSetVehicleAsPrimary,
  // Add other exports that might be needed
  firebaseApp: {},
  firebaseAuth: { config: { authDomain: 'test.firebaseapp.com' } },
  firebaseStorage: {},
  initAnalytics: vi.fn(),
  signUp: vi.fn(),
  signIn: vi.fn(),
  signInWithGoogle: vi.fn(),
  logOut: vi.fn(),
  resetPassword: vi.fn(),
  getCurrentUser: vi.fn(),
  onAuthChange: vi.fn(),
  mapFirebaseUser: vi.fn(),
  getIdToken: vi.fn(),
  db: {},
  saveInDriverRides: vi.fn(),
  getInDriverRides: vi.fn(),
  updateInDriverRide: vi.fn(),
  uploadVehicleImage: vi.fn(),
  deleteVehicleImage: vi.fn(),
  compressImage: vi.fn(),
}));

// Import the hook after mocking
import { useDriverVehicles } from '@/hooks/useDriverVehicles';

// Type for the mock vehicle
interface FirestoreVehicle {
  id: string;
  driver_id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  vehicle_type: 'car' | 'suv' | 'van' | 'motorcycle';
  fuel_type: 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'gas';
  passenger_capacity: number;
  luggage_capacity: number;
  accepts_pets: boolean;
  accepts_wheelchairs: boolean;
  has_child_seat: boolean;
  has_air_conditioning: boolean;
  soat_expiry: { toDate: () => Date } | null;
  tecnomecanica_expiry: { toDate: () => Date } | null;
  status: 'active' | 'inactive' | 'maintenance' | 'pending_approval';
  is_primary: boolean;
  photo_url: string | null;
  notes: string | null;
  created_at: { toDate: () => Date };
  updated_at: { toDate: () => Date };
}

// Helper to create mock vehicle data
const createMockVehicle = (overrides = {}): FirestoreVehicle => ({
  id: 'vehicle-1',
  driver_id: 'driver-1',
  plate: 'ABC123',
  brand: 'Toyota',
  model: 'Corolla',
  year: 2022,
  color: 'Blanco',
  vehicle_type: 'car',
  fuel_type: 'gasoline',
  passenger_capacity: 4,
  luggage_capacity: 2,
  accepts_pets: false,
  accepts_wheelchairs: false,
  has_child_seat: false,
  has_air_conditioning: true,
  soat_expiry: null,
  tecnomecanica_expiry: null,
  status: 'active',
  is_primary: true,
  photo_url: null,
  notes: null,
  created_at: { toDate: () => new Date() } as FirestoreVehicle['created_at'],
  updated_at: { toDate: () => new Date() } as FirestoreVehicle['updated_at'],
  ...overrides,
});

describe('useDriverVehicles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('starts with loading state true', () => {
      mockGetOwnerVehicles.mockResolvedValue([]);

      const { result } = renderHook(() => useDriverVehicles('driver-1'));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.vehicles).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('sets loading to false when no driverId provided', async () => {
      const { result } = renderHook(() => useDriverVehicles(undefined));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.vehicles).toEqual([]);
    });
  });

  describe('Fetching Vehicles', () => {
    it('fetches vehicles on mount', async () => {
      const mockVehicles = [createMockVehicle()];
      mockGetOwnerVehicles.mockResolvedValue(mockVehicles);

      const { result } = renderHook(() => useDriverVehicles('driver-1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetOwnerVehicles).toHaveBeenCalledWith('driver-1', undefined);
      expect(result.current.vehicles).toEqual(mockVehicles);
      expect(result.current.error).toBeNull();
    });

    it('passes options to getDriverVehicles', async () => {
      mockGetOwnerVehicles.mockResolvedValue([]);

      const { result } = renderHook(() => useDriverVehicles('driver-1', { status: 'active' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetOwnerVehicles).toHaveBeenCalledWith('driver-1', {
        status: 'active',
      });
    });

    it('sets error on fetch failure', async () => {
      mockGetOwnerVehicles.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useDriverVehicles('driver-1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.vehicles).toEqual([]);
    });

    it('refetches when refetch is called', async () => {
      mockGetOwnerVehicles.mockResolvedValue([]);

      const { result } = renderHook(() => useDriverVehicles('driver-1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetOwnerVehicles).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockGetOwnerVehicles).toHaveBeenCalledTimes(2);
    });
  });

  describe('Adding Vehicles', () => {
    it('adds a vehicle and refetches', async () => {
      mockGetOwnerVehicles.mockResolvedValue([]);
      mockCreateVehicle.mockResolvedValue({ success: true, vehicleId: 'new-vehicle' });

      const { result } = renderHook(() => useDriverVehicles('driver-1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const input = {
        plate: 'XYZ789',
        brand: 'Honda',
        model: 'Civic',
        year: 2023,
        color: 'Negro',
        vehicle_type: 'car' as const,
        fuel_type: 'gasoline' as const,
        passenger_capacity: 4,
      };

      let addResult;
      await act(async () => {
        addResult = await result.current.addVehicle(input);
      });

      expect(mockCreateVehicle).toHaveBeenCalledWith('driver-1', input);
      expect(addResult).toEqual({ success: true, vehicleId: 'new-vehicle' });
      // Should refetch after adding
      expect(mockGetOwnerVehicles).toHaveBeenCalledTimes(2);
    });

    it('returns error when adding vehicle without driverId', async () => {
      const { result } = renderHook(() => useDriverVehicles(undefined));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const input = {
        plate: 'XYZ789',
        brand: 'Honda',
        model: 'Civic',
        year: 2023,
        color: 'Negro',
        vehicle_type: 'car' as const,
        fuel_type: 'gasoline' as const,
        passenger_capacity: 4,
      };

      let addResult;
      await act(async () => {
        addResult = await result.current.addVehicle(input);
      });

      expect(addResult).toEqual({
        success: false,
        error: 'Usuario no autenticado',
      });
      expect(mockCreateVehicle).not.toHaveBeenCalled();
    });

    it('does not refetch when add fails', async () => {
      mockGetOwnerVehicles.mockResolvedValue([]);
      mockCreateVehicle.mockResolvedValue({ success: false, error: 'Failed to add' });

      const { result } = renderHook(() => useDriverVehicles('driver-1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const input = {
        plate: 'XYZ789',
        brand: 'Honda',
        model: 'Civic',
        year: 2023,
        color: 'Negro',
        vehicle_type: 'car' as const,
        fuel_type: 'gasoline' as const,
        passenger_capacity: 4,
      };

      await act(async () => {
        await result.current.addVehicle(input);
      });

      // Should only have the initial fetch, not a refetch
      expect(mockGetOwnerVehicles).toHaveBeenCalledTimes(1);
    });
  });

  describe('Updating Vehicles', () => {
    it('performs optimistic update', async () => {
      const initialVehicle = createMockVehicle({ brand: 'Toyota' });
      mockGetOwnerVehicles.mockResolvedValue([initialVehicle]);
      mockUpdateVehicle.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useDriverVehicles('driver-1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateVehicle('vehicle-1', { brand: 'Honda' });
      });

      // Should update optimistically
      expect(result.current.vehicles[0].brand).toBe('Honda');
    });

    it('reverts optimistic update on failure', async () => {
      const initialVehicle = createMockVehicle({ brand: 'Toyota' });
      mockGetOwnerVehicles
        .mockResolvedValueOnce([initialVehicle]) // Initial fetch
        .mockResolvedValueOnce([initialVehicle]); // Refetch after failure
      mockUpdateVehicle.mockResolvedValue({ success: false, error: 'Update failed' });

      const { result } = renderHook(() => useDriverVehicles('driver-1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateVehicle('vehicle-1', { brand: 'Honda' });
      });

      // Should revert to original after refetch
      await waitFor(() => {
        expect(result.current.vehicles[0].brand).toBe('Toyota');
      });
      // Note: error is cleared by the refetch
    });

    it('sets error when updating without driverId', async () => {
      const { result } = renderHook(() => useDriverVehicles(undefined));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateVehicle('vehicle-1', { brand: 'Honda' });
      });

      expect(result.current.error).toBe('Usuario no autenticado');
      expect(mockUpdateVehicle).not.toHaveBeenCalled();
    });
  });

  describe('Deleting Vehicles', () => {
    it('performs optimistic deletion', async () => {
      const vehicle1 = createMockVehicle({ id: 'vehicle-1' });
      const vehicle2 = createMockVehicle({ id: 'vehicle-2', plate: 'DEF456' });
      mockGetOwnerVehicles.mockResolvedValue([vehicle1, vehicle2]);
      mockDeleteVehicle.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useDriverVehicles('driver-1'));

      await waitFor(() => {
        expect(result.current.vehicles.length).toBe(2);
      });

      await act(async () => {
        await result.current.deleteVehicle('vehicle-1');
      });

      // Should remove optimistically
      expect(result.current.vehicles.length).toBe(1);
      expect(result.current.vehicles[0].id).toBe('vehicle-2');
    });

    it('reverts optimistic deletion on failure', async () => {
      const vehicle1 = createMockVehicle({ id: 'vehicle-1' });
      mockGetOwnerVehicles
        .mockResolvedValueOnce([vehicle1]) // Initial
        .mockResolvedValueOnce([vehicle1]); // Refetch after failure
      mockDeleteVehicle.mockResolvedValue({ success: false, error: 'Delete failed' });

      const { result } = renderHook(() => useDriverVehicles('driver-1'));

      await waitFor(() => {
        expect(result.current.vehicles.length).toBe(1);
      });

      await act(async () => {
        await result.current.deleteVehicle('vehicle-1');
      });

      // Should restore after refetch
      await waitFor(() => {
        expect(result.current.vehicles.length).toBe(1);
      });
      // Note: error is cleared by the refetch
    });

    it('sets error when deleting without driverId', async () => {
      const { result } = renderHook(() => useDriverVehicles(undefined));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteVehicle('vehicle-1');
      });

      expect(result.current.error).toBe('Usuario no autenticado');
      expect(mockDeleteVehicle).not.toHaveBeenCalled();
    });
  });

  describe('Setting Primary Vehicle', () => {
    it('performs optimistic primary update', async () => {
      const vehicle1 = createMockVehicle({ id: 'vehicle-1', is_primary: true });
      const vehicle2 = createMockVehicle({ id: 'vehicle-2', is_primary: false });
      mockGetOwnerVehicles.mockResolvedValue([vehicle1, vehicle2]);
      mockSetVehicleAsPrimary.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useDriverVehicles('driver-1'));

      await waitFor(() => {
        expect(result.current.vehicles.length).toBe(2);
      });

      await act(async () => {
        await result.current.setPrimaryVehicle('vehicle-2');
      });

      // Should update optimistically
      expect(result.current.vehicles[0].is_primary).toBe(false);
      expect(result.current.vehicles[1].is_primary).toBe(true);
    });

    it('reverts optimistic primary update on failure', async () => {
      const vehicle1 = createMockVehicle({ id: 'vehicle-1', is_primary: true });
      const vehicle2 = createMockVehicle({ id: 'vehicle-2', is_primary: false });
      mockGetOwnerVehicles
        .mockResolvedValueOnce([vehicle1, vehicle2])
        .mockResolvedValueOnce([vehicle1, vehicle2]);
      mockSetVehicleAsPrimary.mockResolvedValue({
        success: false,
        error: 'Set primary failed',
      });

      const { result } = renderHook(() => useDriverVehicles('driver-1'));

      await waitFor(() => {
        expect(result.current.vehicles.length).toBe(2);
      });

      await act(async () => {
        await result.current.setPrimaryVehicle('vehicle-2');
      });

      // Should restore after refetch
      await waitFor(() => {
        expect(result.current.vehicles[0].is_primary).toBe(true);
        expect(result.current.vehicles[1].is_primary).toBe(false);
      });
      // Note: error is cleared by the refetch
    });

    it('sets error when setting primary without driverId', async () => {
      const { result } = renderHook(() => useDriverVehicles(undefined));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setPrimaryVehicle('vehicle-1');
      });

      expect(result.current.error).toBe('Usuario no autenticado');
      expect(mockSetVehicleAsPrimary).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles non-Error exceptions during fetch', async () => {
      mockGetOwnerVehicles.mockRejectedValue('String error');

      const { result } = renderHook(() => useDriverVehicles('driver-1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Error al cargar los vehículos');
    });

    it('calls updateVehicle on Firebase when updating', async () => {
      const vehicle = createMockVehicle();
      mockGetOwnerVehicles.mockResolvedValue([vehicle]);
      mockUpdateVehicle.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useDriverVehicles('driver-1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateVehicle('vehicle-1', { brand: 'Honda' });
      });

      expect(mockUpdateVehicle).toHaveBeenCalledWith('vehicle-1', { brand: 'Honda' });
    });

    it('calls deleteVehicle on Firebase when deleting', async () => {
      const vehicle = createMockVehicle();
      mockGetOwnerVehicles.mockResolvedValue([vehicle]);
      mockDeleteVehicle.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useDriverVehicles('driver-1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteVehicle('vehicle-1');
      });

      expect(mockDeleteVehicle).toHaveBeenCalledWith('vehicle-1');
    });

    it('calls setVehicleAsPrimary on Firebase', async () => {
      const vehicle = createMockVehicle();
      mockGetOwnerVehicles.mockResolvedValue([vehicle]);
      mockSetVehicleAsPrimary.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useDriverVehicles('driver-1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setPrimaryVehicle('vehicle-1');
      });

      expect(mockSetVehicleAsPrimary).toHaveBeenCalledWith('driver-1', 'vehicle-1');
    });
  });

  describe('Driver ID Changes', () => {
    it('refetches when driverId changes', async () => {
      mockGetOwnerVehicles.mockResolvedValue([]);

      const { result, rerender } = renderHook(({ driverId }) => useDriverVehicles(driverId), {
        initialProps: { driverId: 'driver-1' },
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetOwnerVehicles).toHaveBeenCalledTimes(1);
      expect(mockGetOwnerVehicles).toHaveBeenCalledWith('driver-1', undefined);

      // Change driverId
      rerender({ driverId: 'driver-2' });

      await waitFor(() => {
        expect(mockGetOwnerVehicles).toHaveBeenCalledTimes(2);
      });

      expect(mockGetOwnerVehicles).toHaveBeenLastCalledWith('driver-2', undefined);
    });
  });
});
