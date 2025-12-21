/**
 * Custom Test Utilities
 *
 * Provides a custom render function that wraps components with necessary providers.
 */

import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ReactElement, ReactNode } from 'react';

/**
 * Custom wrapper that includes all necessary providers for testing.
 * Add more providers here as needed (e.g., theme, auth context).
 */
interface AllProvidersProps {
  children: ReactNode;
}

function AllProviders({ children }: AllProvidersProps) {
  return <BrowserRouter>{children}</BrowserRouter>;
}

/**
 * Custom render function that wraps the component with all providers.
 * Use this instead of the default render from @testing-library/react.
 *
 * @example
 * import { render, screen } from '@/tests/test-utils';
 *
 * test('renders component', () => {
 *   render(<MyComponent />);
 *   expect(screen.getByText('Hello')).toBeInTheDocument();
 * });
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Override render with custom render
export { customRender as render };

/**
 * Helper to create a mock for Firebase user
 */
export function createMockFirebaseUser(overrides = {}) {
  return {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: true,
    getIdToken: vi.fn().mockResolvedValue('mock-token'),
    ...overrides,
  };
}

/**
 * Helper to create a mock vehicle
 */
export function createMockVehicle(overrides = {}) {
  return {
    id: 'vehicle-1',
    driver_id: 'driver-1',
    plate: 'ABC123',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2022,
    vehicle_type: 'car' as const,
    fuel_type: 'gasoline' as const,
    passenger_capacity: 4,
    accepts_pets: true,
    accepts_wheelchairs: false,
    soat_expiry: null,
    tecnomecanica_expiry: null,
    status: 'active' as const,
    is_primary: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

/**
 * Helper to wait for async operations
 */
export async function waitForLoadingToFinish() {
  const { waitFor, screen } = await import('@testing-library/react');
  await waitFor(() => {
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });
}

// Import vi for mock functions
import { vi } from 'vitest';
