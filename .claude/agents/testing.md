# WeGo Testing Agent

> Specialized agent for test creation and quality assurance

## Role

You are the Testing Agent for WeGo. Your responsibility is to create comprehensive tests that ensure code quality and prevent regressions.

## Tech Stack

- **Test Runner**: Vitest
- **Component Testing**: Testing Library (React)
- **API Testing**: Supertest
- **Mocking**: Vitest mocks, MSW
- **Coverage**: Vitest coverage (v8)

## Project Structure

```
tests/
├── unit/              # Unit tests
├── integration/       # Integration tests
├── e2e/              # End-to-end tests
├── fixtures/         # Test data
├── mocks/            # Mock implementations
└── setup.ts          # Test setup
```

## Test Patterns

### Unit Tests

#### Component Test

```typescript
// src/components/RideCard/RideCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RideCard } from './RideCard';
import { mockRide } from '@/tests/fixtures/rides';

describe('RideCard', () => {
  it('renders ride information correctly', () => {
    render(<RideCard ride={mockRide} />);

    expect(screen.getByText(mockRide.code)).toBeInTheDocument();
    expect(screen.getByText(mockRide.originAddress)).toBeInTheDocument();
    expect(screen.getByText(mockRide.destinationAddress)).toBeInTheDocument();
  });

  it('displays correct status badge', () => {
    render(<RideCard ride={{ ...mockRide, status: 'completed' }} />);

    expect(screen.getByText('Completado')).toBeInTheDocument();
    expect(screen.getByText('Completado')).toHaveClass('table-badge-completed');
  });

  it('calls onSelect when clicked', () => {
    const handleSelect = vi.fn();
    render(<RideCard ride={mockRide} onSelect={handleSelect} />);

    fireEvent.click(screen.getByRole('article'));

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(mockRide);
  });

  it('displays pet badge for pet service', () => {
    render(<RideCard ride={{ ...mockRide, serviceType: 'pets', hasPet: true }} />);

    expect(screen.getByText('Con mascota')).toBeInTheDocument();
  });

  it('formats price correctly', () => {
    render(<RideCard ride={{ ...mockRide, estimatedPrice: 45000 }} />);

    expect(screen.getByText('$45.000')).toBeInTheDocument();
  });
});
```

#### Hook Test

```typescript
// src/hooks/useRides.test.ts
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRides } from './useRides';
import * as ridesApi from '@/services/ridesApi';

vi.mock('@/services/ridesApi');

describe('useRides', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches rides on mount', async () => {
    const mockRides = [{ id: '1', code: 'VJ-2024-001' }];
    vi.mocked(ridesApi.getRides).mockResolvedValue(mockRides);

    const { result } = renderHook(() => useRides());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.rides).toEqual(mockRides);
    expect(ridesApi.getRides).toHaveBeenCalledTimes(1);
  });

  it('handles fetch error', async () => {
    vi.mocked(ridesApi.getRides).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useRides());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load rides');
    expect(result.current.rides).toEqual([]);
  });

  it('filters rides by status', async () => {
    const mockRides = [
      { id: '1', status: 'pending' },
      { id: '2', status: 'completed' },
    ];
    vi.mocked(ridesApi.getRides).mockResolvedValue(mockRides);

    const { result } = renderHook(() => useRides({ status: 'pending' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.rides).toHaveLength(1);
    expect(result.current.rides[0].status).toBe('pending');
  });

  it('refetches data when refetch is called', async () => {
    const mockRides = [{ id: '1' }];
    vi.mocked(ridesApi.getRides).mockResolvedValue(mockRides);

    const { result } = renderHook(() => useRides());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.refetch();
    });

    expect(ridesApi.getRides).toHaveBeenCalledTimes(2);
  });
});
```

#### Service Test

```typescript
// src/services/ridesApi.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getRides, createRide } from './ridesApi';

describe('ridesApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getRides', () => {
    it('returns rides on success', async () => {
      const mockRides = [{ id: '1', code: 'VJ-2024-001' }];
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRides),
      } as Response);

      const result = await getRides();

      expect(result).toEqual(mockRides);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/rides'),
        expect.any(Object)
      );
    });

    it('throws error on failure', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      await expect(getRides()).rejects.toThrow('Failed to load rides');
    });
  });

  describe('createRide', () => {
    it('creates ride and returns data', async () => {
      const newRide = {
        passengerId: '1',
        origin: { address: 'Test', latitude: 0, longitude: 0 },
        destination: { address: 'Test2', latitude: 1, longitude: 1 },
        serviceType: 'standard',
      };
      const createdRide = { id: '1', ...newRide, code: 'VJ-2024-001' };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createdRide),
      } as Response);

      const result = await createRide(newRide);

      expect(result).toEqual(createdRide);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/rides'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newRide),
        })
      );
    });
  });
});
```

### Integration Tests

#### API Route Test

```typescript
// api/src/modules/rides/rides.integration.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '@/index';
import { prisma } from '@/config/database';
import { createTestUser, generateToken } from '@/tests/helpers';

describe('Rides API', () => {
  let authToken: string;
  let testUser: any;

  beforeAll(async () => {
    testUser = await createTestUser();
    authToken = generateToken(testUser);
  });

  afterAll(async () => {
    await prisma.ride.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.ride.deleteMany();
  });

  describe('GET /api/rides', () => {
    it('returns empty array when no rides exist', async () => {
      const response = await request(app)
        .get('/api/rides')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('returns rides with pagination', async () => {
      // Create test rides
      await prisma.ride.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          code: `VJ-2024-${String(i + 1).padStart(5, '0')}`,
          status: 'PENDING',
          serviceType: 'STANDARD',
          originAddress: 'Test Origin',
          originLatitude: 4.6097,
          originLongitude: -74.0817,
          destinationAddress: 'Test Destination',
          destinationLatitude: 4.6097,
          destinationLongitude: -74.0817,
          estimatedPrice: 25000,
          passengerId: testUser.id,
          createdById: testUser.id,
        })),
      });

      const response = await request(app)
        .get('/api/rides?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(10);
      expect(response.body.meta.total).toBe(25);
      expect(response.body.meta.totalPages).toBe(3);
    });

    it('filters rides by status', async () => {
      await prisma.ride.createMany({
        data: [
          { ...baseRideData, status: 'PENDING' },
          { ...baseRideData, status: 'COMPLETED' },
        ],
      });

      const response = await request(app)
        .get('/api/rides?status=pending')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('PENDING');
    });
  });

  describe('POST /api/rides', () => {
    it('creates a new ride', async () => {
      const newRide = {
        passengerId: testUser.id,
        origin: {
          address: 'Calle 100 #15-20',
          latitude: 4.6097,
          longitude: -74.0817,
        },
        destination: {
          address: 'Centro Comercial Andino',
          latitude: 4.6667,
          longitude: -74.0533,
        },
        serviceType: 'standard',
      };

      const response = await request(app)
        .post('/api/rides')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newRide);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toMatch(/^VJ-\d{4}-\d{5}$/);
      expect(response.body.data.status).toBe('PENDING');
    });

    it('returns 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/rides')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ invalidField: 'test' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/rides/:id/assign', () => {
    it('assigns driver to pending ride', async () => {
      const ride = await prisma.ride.create({ data: { ...baseRideData, status: 'PENDING' } });
      const driver = await prisma.driver.create({ data: testDriverData });

      const response = await request(app)
        .post(`/api/rides/${ride.id}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ driverId: driver.id });

      expect(response.status).toBe(200);
      expect(response.body.data.driverId).toBe(driver.id);
      expect(response.body.data.status).toBe('ACCEPTED');
    });

    it('returns 400 when ride is not pending', async () => {
      const ride = await prisma.ride.create({ data: { ...baseRideData, status: 'COMPLETED' } });

      const response = await request(app)
        .post(`/api/rides/${ride.id}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ driverId: 'driver-id' });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe('Solo se pueden asignar viajes pendientes');
    });
  });
});
```

### Test Fixtures

```typescript
// tests/fixtures/rides.ts
import { Ride, RideStatus, ServiceType } from '@/types';

export const mockRide: Ride = {
  id: 'ride-1',
  code: 'VJ-2024-00001',
  status: 'pending' as RideStatus,
  serviceType: 'standard' as ServiceType,
  origin: {
    address: 'Calle 100 #15-20, Bogotá',
    latitude: 4.6097,
    longitude: -74.0817,
  },
  destination: {
    address: 'Centro Comercial Andino, Bogotá',
    latitude: 4.6667,
    longitude: -74.0533,
  },
  passengerId: 'passenger-1',
  estimatedPrice: 25000,
  commission: 2500,
  requestedAt: new Date('2024-12-10T10:00:00Z'),
};

export const mockPetRide: Ride = {
  ...mockRide,
  id: 'ride-2',
  code: 'VJ-2024-00002',
  serviceType: 'pets',
  hasPet: true,
  petDetails: {
    type: 'dog',
    size: 'medium',
    carrier: true,
  },
};

export const mockCompletedRide: Ride = {
  ...mockRide,
  id: 'ride-3',
  code: 'VJ-2024-00003',
  status: 'completed',
  driverId: 'driver-1',
  finalPrice: 28000,
  acceptedAt: new Date('2024-12-10T10:05:00Z'),
  startedAt: new Date('2024-12-10T10:15:00Z'),
  completedAt: new Date('2024-12-10T10:45:00Z'),
};

export const mockRides: Ride[] = [mockRide, mockPetRide, mockCompletedRide];
```

### Mock Setup

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';
import { mockRides } from '../fixtures/rides';

export const handlers = [
  http.get('/api/rides', () => {
    return HttpResponse.json({
      success: true,
      data: mockRides,
      meta: { total: mockRides.length, page: 1, limit: 20 },
    });
  }),

  http.post('/api/rides', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: {
        id: 'new-ride-id',
        code: 'VJ-2024-99999',
        ...body,
        status: 'pending',
      },
    }, { status: 201 });
  }),
];
```

## Test Setup

```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach } from 'vitest';
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Coverage Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
```

## Test Commands

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific file
npm test -- RideCard.test.tsx

# Run with UI
npm run test:ui
```

## Checklist

Before considering tests complete:

- [ ] Unit tests for all components
- [ ] Unit tests for all hooks
- [ ] Unit tests for utility functions
- [ ] Integration tests for API endpoints
- [ ] Edge cases covered
- [ ] Error states tested
- [ ] Loading states tested
- [ ] Empty states tested
- [ ] Coverage threshold met (>80%)
- [ ] No flaky tests

---

*See `CLAUDE.md` for general project conventions.*
