/**
 * ExternalRideFormPage Tests
 *
 * Tests for the public external ride registration page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Driver } from '@/features/external-rides/types';
import type { Timestamp } from 'firebase/firestore';

// Mock Firebase config first
vi.mock('@/core/firebase/config', () => ({
  firebaseApp: {},
}));

vi.mock('@/core/firebase/firestore', () => ({
  db: {},
}));

// Mock the hooks and components
const mockUseDriverBySlug = vi.hoisted(() =>
  vi.fn(() => ({
    driver: null,
    isLoading: true,
    error: null,
    refetch: vi.fn(),
  }))
);

vi.mock('@/features/external-rides', () => ({
  useDriverBySlug: mockUseDriverBySlug,
  ExternalRideWizard: ({ driver }: { driver: Driver }) => (
    <div data-testid="external-ride-wizard">Wizard for {driver.name}</div>
  ),
  PublicFormLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="public-form-layout">{children}</div>
  ),
  MESSAGES: {
    LOADING_DRIVER: 'Cargando informacion...',
    DRIVER_NOT_FOUND: 'Este enlace no es valido o el conductor no esta activo.',
  },
}));

// Import after mocks
import { ExternalRideFormPage } from '@/pages/ExternalRideFormPage';

// Helper to render with router
const renderWithRouter = (driverSlug: string = 'test-driver') => {
  return render(
    <MemoryRouter initialEntries={[`/registrar-viaje/${driverSlug}`]}>
      <Routes>
        <Route path="/registrar-viaje/:driverSlug" element={<ExternalRideFormPage />} />
      </Routes>
    </MemoryRouter>
  );
};

// Mock driver data
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

describe('ExternalRideFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDriverBySlug.mockReturnValue({
      driver: null,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner while fetching driver', () => {
      mockUseDriverBySlug.mockReturnValue({
        driver: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      renderWithRouter('juan-perez');

      expect(screen.getByTestId('public-form-layout')).toBeInTheDocument();
      expect(screen.getByText('Cargando informacion...')).toBeInTheDocument();
    });

    it('shows loading spinner with proper CSS class', () => {
      mockUseDriverBySlug.mockReturnValue({
        driver: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      renderWithRouter('test-driver');

      const loadingContainer = document.querySelector('.public-form-loading');
      expect(loadingContainer).toBeInTheDocument();

      const spinner = document.querySelector('.public-form-loading-spinner');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error message when driver not found', () => {
      mockUseDriverBySlug.mockReturnValue({
        driver: null,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderWithRouter('invalid-slug');

      expect(screen.getByText('Enlace no valido')).toBeInTheDocument();
      expect(
        screen.getByText('Este enlace no es valido o el conductor no esta activo.')
      ).toBeInTheDocument();
    });

    it('shows custom error message from hook', () => {
      const customError = 'Error de conexion. Intenta de nuevo.';
      mockUseDriverBySlug.mockReturnValue({
        driver: null,
        isLoading: false,
        error: customError,
        refetch: vi.fn(),
      });

      renderWithRouter('test-driver');

      expect(screen.getByText('Enlace no valido')).toBeInTheDocument();
      expect(screen.getByText(customError)).toBeInTheDocument();
    });

    it('shows sad emoji in error state', () => {
      mockUseDriverBySlug.mockReturnValue({
        driver: null,
        isLoading: false,
        error: 'Some error',
        refetch: vi.fn(),
      });

      renderWithRouter('test-driver');

      const errorIcon = document.querySelector('.public-form-error-icon');
      expect(errorIcon).toBeInTheDocument();
      expect(errorIcon?.textContent).toBe('😕');
    });

    it('uses proper CSS classes for error display', () => {
      mockUseDriverBySlug.mockReturnValue({
        driver: null,
        isLoading: false,
        error: 'Error',
        refetch: vi.fn(),
      });

      renderWithRouter('test-driver');

      expect(document.querySelector('.public-form-error')).toBeInTheDocument();
      expect(document.querySelector('.public-form-error-title')).toBeInTheDocument();
      expect(document.querySelector('.public-form-error-message')).toBeInTheDocument();
    });
  });

  describe('Success State (Driver Found)', () => {
    it('renders wizard when driver is loaded', async () => {
      const mockDriver = createMockDriver();
      mockUseDriverBySlug.mockReturnValue({
        driver: mockDriver,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderWithRouter('juan-perez');

      await waitFor(() => {
        expect(screen.getByTestId('external-ride-wizard')).toBeInTheDocument();
      });
      expect(screen.getByText('Wizard for Juan Pérez')).toBeInTheDocument();
    });

    it('passes correct driver to wizard', async () => {
      const mockDriver = createMockDriver({ name: 'María García' });
      mockUseDriverBySlug.mockReturnValue({
        driver: mockDriver,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderWithRouter('maria-garcia');

      await waitFor(() => {
        expect(screen.getByText('Wizard for María García')).toBeInTheDocument();
      });
    });

    it('renders within PublicFormLayout', async () => {
      const mockDriver = createMockDriver();
      mockUseDriverBySlug.mockReturnValue({
        driver: mockDriver,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderWithRouter('test-driver');

      await waitFor(() => {
        expect(screen.getByTestId('public-form-layout')).toBeInTheDocument();
        expect(screen.getByTestId('external-ride-wizard')).toBeInTheDocument();
      });
    });
  });

  describe('URL Parameter Handling', () => {
    it('extracts driver slug from URL parameters', () => {
      mockUseDriverBySlug.mockReturnValue({
        driver: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      renderWithRouter('custom-slug-123');

      expect(mockUseDriverBySlug).toHaveBeenCalledWith('custom-slug-123');
    });

    it('handles slug with special characters', () => {
      mockUseDriverBySlug.mockReturnValue({
        driver: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      renderWithRouter('juan-pablo-iii');

      expect(mockUseDriverBySlug).toHaveBeenCalledWith('juan-pablo-iii');
    });

    it('handles numeric slugs', () => {
      mockUseDriverBySlug.mockReturnValue({
        driver: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      renderWithRouter('driver12345');

      expect(mockUseDriverBySlug).toHaveBeenCalledWith('driver12345');
    });
  });

  describe('State Transitions', () => {
    it('transitions from loading to success', async () => {
      // Start with loading
      mockUseDriverBySlug.mockReturnValue({
        driver: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      const { rerender } = renderWithRouter('test-driver');
      expect(screen.getByText('Cargando informacion...')).toBeInTheDocument();

      // Update to success
      const mockDriver = createMockDriver();
      mockUseDriverBySlug.mockReturnValue({
        driver: mockDriver,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      rerender(
        <MemoryRouter initialEntries={['/registrar-viaje/test-driver']}>
          <Routes>
            <Route path="/registrar-viaje/:driverSlug" element={<ExternalRideFormPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.queryByText('Cargando informacion...')).not.toBeInTheDocument();
        expect(screen.getByTestId('external-ride-wizard')).toBeInTheDocument();
      });
    });

    it('transitions from loading to error', async () => {
      // Start with loading
      mockUseDriverBySlug.mockReturnValue({
        driver: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      const { rerender } = renderWithRouter('invalid');
      expect(screen.getByText('Cargando informacion...')).toBeInTheDocument();

      // Update to error
      mockUseDriverBySlug.mockReturnValue({
        driver: null,
        isLoading: false,
        error: 'Connection failed',
        refetch: vi.fn(),
      });

      rerender(
        <MemoryRouter initialEntries={['/registrar-viaje/invalid']}>
          <Routes>
            <Route path="/registrar-viaje/:driverSlug" element={<ExternalRideFormPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.queryByText('Cargando informacion...')).not.toBeInTheDocument();
        expect(screen.getByText('Enlace no valido')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles driver with minimal data', async () => {
      const minimalDriver = createMockDriver({
        name: 'A',
        email: 'a@b.c',
        phone: '1',
      });
      mockUseDriverBySlug.mockReturnValue({
        driver: minimalDriver,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderWithRouter('minimal');

      await waitFor(() => {
        expect(screen.getByText('Wizard for A')).toBeInTheDocument();
      });
    });

    it('handles driver with long name', async () => {
      const longNameDriver = createMockDriver({
        name: 'Juan Carlos Antonio María de los Ángeles Rodríguez López',
      });
      mockUseDriverBySlug.mockReturnValue({
        driver: longNameDriver,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderWithRouter('long-name');

      await waitFor(() => {
        expect(
          screen.getByText('Wizard for Juan Carlos Antonio María de los Ángeles Rodríguez López')
        ).toBeInTheDocument();
      });
    });

    it('handles empty error string', () => {
      mockUseDriverBySlug.mockReturnValue({
        driver: null,
        isLoading: false,
        error: '',
        refetch: vi.fn(),
      });

      renderWithRouter('test');

      // Should use default error message
      expect(
        screen.getByText('Este enlace no es valido o el conductor no esta activo.')
      ).toBeInTheDocument();
    });
  });
});
