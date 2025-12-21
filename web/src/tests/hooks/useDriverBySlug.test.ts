/**
 * useDriverBySlug Hook Tests
 *
 * Tests for driver lookup by unique slug
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDriverBySlug } from '@/features/external-rides/hooks/useDriverBySlug';
import type { Driver } from '@/features/external-rides/types';
import type { Timestamp } from 'firebase/firestore';

// Mock the service
const mockGetDriverBySlug = vi.hoisted(() => vi.fn());

vi.mock('@/features/external-rides/services', () => ({
  getDriverBySlug: mockGetDriverBySlug,
}));

// Mock driver factory
const createMockDriver = (overrides: Partial<Driver> = {}): Driver => ({
  id: 'driver-001',
  user_id: 'user-001',
  name: 'Juan Pérez',
  email: 'juan@example.com',
  is_active: true,
  created_at: { toDate: () => new Date('2024-01-01') } as Timestamp,
  phone: '+57 310 123 4567',
  unique_slug: 'juan-perez',
  ...overrides,
});

describe('useDriverBySlug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('starts with loading state', () => {
      mockGetDriverBySlug.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useDriverBySlug('test-slug'));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.driver).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('Successful Fetch', () => {
    it('fetches driver by slug successfully', async () => {
      const mockDriver = createMockDriver();
      mockGetDriverBySlug.mockResolvedValue(mockDriver);

      const { result } = renderHook(() => useDriverBySlug('juan-perez'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.driver).toEqual(mockDriver);
      expect(result.current.error).toBeNull();
      expect(mockGetDriverBySlug).toHaveBeenCalledWith('juan-perez');
    });

    it('fetches different driver for different slugs', async () => {
      const mockDriver1 = createMockDriver({ name: 'Driver One' });
      const mockDriver2 = createMockDriver({ name: 'Driver Two', unique_slug: 'driver-two' });

      mockGetDriverBySlug.mockResolvedValueOnce(mockDriver1);
      const { result: result1 } = renderHook(() => useDriverBySlug('driver-one'));

      await waitFor(() => {
        expect(result1.current.driver?.name).toBe('Driver One');
      });

      mockGetDriverBySlug.mockResolvedValueOnce(mockDriver2);
      const { result: result2 } = renderHook(() => useDriverBySlug('driver-two'));

      await waitFor(() => {
        expect(result2.current.driver?.name).toBe('Driver Two');
      });
    });

    it('clears loading state after successful fetch', async () => {
      mockGetDriverBySlug.mockResolvedValue(createMockDriver());

      const { result } = renderHook(() => useDriverBySlug('test'));

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Driver Not Found', () => {
    it('sets error when driver not found (null returned)', async () => {
      mockGetDriverBySlug.mockResolvedValue(null);

      const { result } = renderHook(() => useDriverBySlug('nonexistent'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.driver).toBeNull();
      expect(result.current.error).toBe('Este enlace no es valido o el conductor no esta activo.');
    });

    it('sets loading to false when driver not found', async () => {
      mockGetDriverBySlug.mockResolvedValue(null);

      const { result } = renderHook(() => useDriverBySlug('invalid'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).not.toBeNull();
      });
    });
  });

  describe('No Slug Provided', () => {
    it('sets error when slug is undefined', async () => {
      const { result } = renderHook(() => useDriverBySlug(undefined));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.driver).toBeNull();
      expect(result.current.error).toBe('No se proporciono un enlace valido');
      expect(mockGetDriverBySlug).not.toHaveBeenCalled();
    });

    it('sets error when slug is empty string', async () => {
      const { result } = renderHook(() => useDriverBySlug(''));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Empty string is falsy, so should trigger the same error
      expect(result.current.error).toBe('No se proporciono un enlace valido');
    });
  });

  describe('API Errors', () => {
    it('handles network error', async () => {
      mockGetDriverBySlug.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useDriverBySlug('test-slug'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.driver).toBeNull();
      expect(result.current.error).toBe('Error de conexion. Intenta de nuevo.');
    });

    it('handles Firestore error', async () => {
      mockGetDriverBySlug.mockRejectedValue(new Error('permission-denied'));

      const { result } = renderHook(() => useDriverBySlug('test'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Error de conexion. Intenta de nuevo.');
    });

    it('handles timeout error', async () => {
      mockGetDriverBySlug.mockRejectedValue(new Error('Request timeout'));

      const { result } = renderHook(() => useDriverBySlug('test'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe('Error de conexion. Intenta de nuevo.');
      });
    });
  });

  describe('Refetch', () => {
    it('provides refetch function', async () => {
      mockGetDriverBySlug.mockResolvedValue(createMockDriver());

      const { result } = renderHook(() => useDriverBySlug('test'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refetch).toBe('function');
    });

    it('refetch triggers new API call', async () => {
      const mockDriver = createMockDriver();
      mockGetDriverBySlug.mockResolvedValue(mockDriver);

      const { result } = renderHook(() => useDriverBySlug('test'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetDriverBySlug).toHaveBeenCalledTimes(1);

      // Trigger refetch
      await act(async () => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(mockGetDriverBySlug).toHaveBeenCalledTimes(2);
      });
    });

    it('refetch updates driver data', async () => {
      const oldDriver = createMockDriver({ name: 'Old Name' });
      const newDriver = createMockDriver({ name: 'New Name' });

      mockGetDriverBySlug.mockResolvedValueOnce(oldDriver);

      const { result } = renderHook(() => useDriverBySlug('test'));

      await waitFor(() => {
        expect(result.current.driver?.name).toBe('Old Name');
      });

      mockGetDriverBySlug.mockResolvedValueOnce(newDriver);

      await act(async () => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.driver?.name).toBe('New Name');
      });
    });

    it('refetch clears previous error', async () => {
      // First call fails
      mockGetDriverBySlug.mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useDriverBySlug('test'));

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Second call succeeds
      mockGetDriverBySlug.mockResolvedValueOnce(createMockDriver());

      await act(async () => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.driver).not.toBeNull();
      });
    });
  });

  describe('Slug Changes', () => {
    it('refetches when slug changes', async () => {
      const driver1 = createMockDriver({ name: 'Driver 1', unique_slug: 'slug-1' });
      const driver2 = createMockDriver({ name: 'Driver 2', unique_slug: 'slug-2' });

      mockGetDriverBySlug.mockResolvedValueOnce(driver1);

      const { result, rerender } = renderHook(
        ({ slug }) => useDriverBySlug(slug),
        { initialProps: { slug: 'slug-1' } }
      );

      await waitFor(() => {
        expect(result.current.driver?.name).toBe('Driver 1');
      });

      mockGetDriverBySlug.mockResolvedValueOnce(driver2);

      rerender({ slug: 'slug-2' });

      await waitFor(() => {
        expect(result.current.driver?.name).toBe('Driver 2');
      });

      expect(mockGetDriverBySlug).toHaveBeenCalledWith('slug-1');
      expect(mockGetDriverBySlug).toHaveBeenCalledWith('slug-2');
    });
  });

  describe('Driver Data Structure', () => {
    it('returns complete driver object', async () => {
      const fullDriver = createMockDriver({
        id: 'driver-xyz',
        user_id: 'user-abc',
        name: 'Complete Driver',
        email: 'complete@driver.com',
        is_active: true,
        phone: '+57 300 000 0000',
        unique_slug: 'complete-driver',
      });

      mockGetDriverBySlug.mockResolvedValue(fullDriver);

      const { result } = renderHook(() => useDriverBySlug('complete-driver'));

      await waitFor(() => {
        expect(result.current.driver).not.toBeNull();
      });

      expect(result.current.driver?.id).toBe('driver-xyz');
      expect(result.current.driver?.user_id).toBe('user-abc');
      expect(result.current.driver?.name).toBe('Complete Driver');
      expect(result.current.driver?.email).toBe('complete@driver.com');
      expect(result.current.driver?.is_active).toBe(true);
      expect(result.current.driver?.phone).toBe('+57 300 000 0000');
      expect(result.current.driver?.unique_slug).toBe('complete-driver');
    });

    it('handles driver with inactive status', async () => {
      // When driver is inactive, getDriverBySlug should return null
      mockGetDriverBySlug.mockResolvedValue(null);

      const { result } = renderHook(() => useDriverBySlug('inactive-driver'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.driver).toBeNull();
      expect(result.current.error).toBe('Este enlace no es valido o el conductor no esta activo.');
    });
  });
});
