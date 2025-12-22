# WeGo Testing Strategy

> **Goal:** Achieve reliable deployments with confidence through comprehensive automated testing.

---

## Current State Analysis

### What Exists

| Layer | Framework | Tests | CI Status |
|-------|-----------|-------|-----------|
| Backend (Python) | pytest + asyncio | 11 tests (8 unit, 3 integration) | **DISABLED** |
| Frontend (React) | Vitest + Testing Library | **0 tests** | **DISABLED** |
| Mobile (React Native) | Jest (available) | **0 tests** | Not configured |
| E2E | None | **0 tests** | Not configured |

### Critical Gaps

1. **Frontend has zero tests** despite Vitest being configured
2. **CI/CD test steps are commented out** - tests don't run on PRs
3. **No E2E testing** for critical user flows
4. **InDriver OCR** has no test coverage despite complexity
5. **Firebase operations** untested on frontend
6. **Missing test setup file** (`web/src/tests/setup.ts`)

---

## Testing Pyramid Strategy

```
                    ┌─────────────┐
                    │    E2E      │  5-10 tests
                    │  (Playwright)│  Critical flows only
                   ┌┴─────────────┴┐
                   │  Integration   │  30-50 tests
                   │ (API + Firebase)│  Feature boundaries
                  ┌┴───────────────┴┐
                  │      Unit        │  100+ tests
                  │ (Functions/Logic)│  Business logic
                 └───────────────────┘
```

---

## Phase 1: Foundation (Week 1-2)

### 1.1 Enable CI/CD Testing

**Priority: CRITICAL**

Uncomment and enable test steps in GitHub Actions:

```yaml
# .github/workflows/web-ci.yml
- name: Run tests
  run: npm test -- --passWithNoTests

# .github/workflows/backend-ci.yml
- name: Run tests
  run: |
    cd backend
    pytest --cov=src --cov-report=xml
```

### 1.2 Create Frontend Test Setup

**File: `web/src/tests/setup.ts`**

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Firebase
vi.mock('../core/firebase/config', () => ({
  auth: {},
  db: {},
  storage: {},
}));

// Mock environment variables
vi.stubGlobal('import.meta', {
  env: {
    VITE_FIREBASE_PROJECT_ID: 'test-project',
    VITE_API_URL: 'http://localhost:8000',
  },
});
```

### 1.3 Create Test Utilities

**File: `web/src/tests/test-utils.tsx`**

```typescript
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ReactElement, ReactNode } from 'react';

const AllProviders = ({ children }: { children: ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

---

## Phase 2: Unit Tests (Week 2-4)

### 2.1 Backend Unit Tests

**Target: 50+ unit tests**

#### User Entity (Existing - Expand)

```
backend/tests/unit/
├── test_user_entity.py          # ✅ Exists (8 tests)
├── test_security.py             # JWT token creation/verification
├── test_dtos.py                 # DTO validation
└── test_text_parser.py          # InDriver text parsing
```

**Priority tests to add:**

| File | Tests Needed |
|------|--------------|
| `test_security.py` | `test_create_access_token`, `test_create_refresh_token`, `test_verify_token_valid`, `test_verify_token_expired`, `test_verify_token_invalid` |
| `test_text_parser.py` | `test_parse_ride_amount`, `test_parse_driver_name`, `test_parse_date`, `test_parse_malformed_text` |

### 2.2 Frontend Unit Tests

**Target: 60+ unit tests**

#### Utility Functions

```
web/src/tests/unit/
├── utils/
│   ├── formatCurrency.test.ts
│   ├── formatDate.test.ts
│   └── plateValidation.test.ts
├── validation/
│   └── vehicleSchema.test.ts
└── hooks/
    └── useDriverVehicles.test.ts
```

**Example: Currency Formatting**

```typescript
// web/src/tests/unit/utils/formatCurrency.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency } from '@/utils/formatCurrency';

describe('formatCurrency', () => {
  it('formats positive amounts in Colombian pesos', () => {
    expect(formatCurrency(125000)).toBe('$125.000 COP');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0 COP');
  });

  it('formats large amounts with thousands separator', () => {
    expect(formatCurrency(1500000)).toBe('$1.500.000 COP');
  });
});
```

**Example: Vehicle Schema Validation**

```typescript
// web/src/tests/unit/validation/vehicleSchema.test.ts
import { describe, it, expect } from 'vitest';
import { vehicleSchema } from '@/components/VehicleForm/schema';

describe('vehicleSchema', () => {
  it('accepts valid Colombian plate format ABC123', () => {
    const result = vehicleSchema.safeParse({
      plate: 'ABC123',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2020,
      vehicle_type: 'car',
      fuel_type: 'gasoline',
      passenger_capacity: 4,
    });
    expect(result.success).toBe(true);
  });

  it('accepts plate format with hyphen ABC-123', () => {
    const result = vehicleSchema.safeParse({
      plate: 'ABC-123',
      // ... other fields
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid plate format', () => {
    const result = vehicleSchema.safeParse({
      plate: 'INVALID',
      // ... other fields
    });
    expect(result.success).toBe(false);
  });

  it('rejects year before 1990', () => {
    const result = vehicleSchema.safeParse({
      plate: 'ABC123',
      year: 1985,
      // ... other fields
    });
    expect(result.success).toBe(false);
  });
});
```

---

## Phase 3: Integration Tests (Week 4-6)

### 3.1 Backend Integration Tests

**Target: 20+ integration tests**

```
backend/tests/integration/
├── test_auth_api.py             # ✅ Exists (3 tests)
├── test_user_api.py             # User CRUD endpoints
├── test_indriver_api.py         # InDriver import endpoints
└── test_firebase_operations.py  # Firestore operations
```

**Priority tests:**

```python
# test_indriver_api.py
class TestInDriverExtraction:
    async def test_extract_from_valid_image(self, client):
        """Test OCR extraction from a valid InDriver screenshot."""

    async def test_extract_returns_structured_data(self, client):
        """Verify extracted data has expected fields."""

    async def test_extract_handles_corrupt_file(self, client):
        """Verify error handling for corrupt images."""
```

### 3.2 Frontend Integration Tests

**Target: 15+ integration tests**

```
web/src/tests/integration/
├── auth/
│   ├── login.test.tsx
│   └── logout.test.tsx
├── vehicles/
│   ├── createVehicle.test.tsx
│   └── vehicleList.test.tsx
└── api/
    └── apiClient.test.ts
```

**Example: Login Flow**

```typescript
// web/src/tests/integration/auth/login.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/tests/test-utils';
import { LoginForm } from '@/features/auth/components/LoginForm';

// Mock Firebase auth
vi.mock('@/core/firebase/auth', () => ({
  signInWithEmail: vi.fn(),
}));

describe('Login Flow', () => {
  it('shows error message on invalid credentials', async () => {
    const { signInWithEmail } = await import('@/core/firebase/auth');
    vi.mocked(signInWithEmail).mockRejectedValue(
      new Error('auth/invalid-credential')
    );

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'wrong@email.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument();
    });
  });

  it('redirects to dashboard on successful login', async () => {
    // ... test implementation
  });
});
```

---

## Phase 4: Component Tests (Week 5-7)

### 4.1 Critical Component Tests

**Target: 25+ component tests**

```
web/src/tests/components/
├── VehicleForm.test.tsx
├── VehiclesTable.test.tsx
├── StatusFilter.test.tsx
├── DateFilter.test.tsx
├── DashboardLayout.test.tsx
└── InDriverUploader.test.tsx
```

**Example: VehicleForm**

```typescript
// web/src/tests/components/VehicleForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/tests/test-utils';
import { VehicleForm } from '@/components/VehicleForm';

describe('VehicleForm', () => {
  it('renders all required fields', () => {
    render(<VehicleForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/placa/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/marca/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/modelo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/año/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields', async () => {
    render(<VehicleForm onSubmit={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(screen.getByText(/placa es requerida/i)).toBeInTheDocument();
    });
  });

  it('normalizes plate to uppercase on submit', async () => {
    const onSubmit = vi.fn();
    render(<VehicleForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/placa/i), {
      target: { value: 'abc123' },
    });
    // ... fill other fields
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ plate: 'ABC123' })
      );
    });
  });
});
```

---

## Phase 5: E2E Tests (Week 7-8)

### 5.1 Setup Playwright

**Install:**
```bash
cd web
npm install -D @playwright/test
npx playwright install
```

**Configuration: `web/playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 5.2 Critical E2E Flows

**Target: 5-10 E2E tests for critical paths**

```
web/e2e/
├── auth.spec.ts           # Login/logout flows
├── vehicles.spec.ts       # Vehicle CRUD
└── indriver-import.spec.ts # Import flow
```

**Example: Authentication E2E**

```typescript
// web/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can login and see dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('user can logout', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Logout
    await page.click('[data-testid="logout-button"]');

    await expect(page).toHaveURL('/login');
  });
});
```

**Example: Vehicle CRUD E2E**

```typescript
// web/e2e/vehicles.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Vehicle Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('user can add a new vehicle', async ({ page }) => {
    await page.goto('/vehicles');
    await page.click('button:has-text("Agregar vehículo")');

    await page.fill('[name="plate"]', 'XYZ789');
    await page.fill('[name="brand"]', 'Toyota');
    await page.fill('[name="model"]', 'Corolla');
    await page.fill('[name="year"]', '2022');
    await page.selectOption('[name="vehicle_type"]', 'car');
    await page.selectOption('[name="fuel_type"]', 'gasoline');
    await page.fill('[name="passenger_capacity"]', '4');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=XYZ789')).toBeVisible();
    await expect(page.locator('text=Vehículo guardado')).toBeVisible();
  });
});
```

---

## Phase 6: CI/CD Integration (Week 8)

### 6.1 Updated Web CI Workflow

```yaml
# .github/workflows/web-ci.yml
name: Web CI

on:
  push:
    branches: [main, develop]
    paths: ['web/**']
  pull_request:
    branches: [main, develop]
    paths: ['web/**']

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: web/package-lock.json

      - name: Install dependencies
        run: cd web && npm ci

      - name: Lint
        run: cd web && npm run lint

      - name: Type check
        run: cd web && npm run type-check

      - name: Run unit & integration tests
        run: cd web && npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./web/coverage/lcov.info
          flags: frontend
          fail_ci_if_error: false

  e2e:
    runs-on: ubuntu-latest
    needs: test

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: web/package-lock.json

      - name: Install dependencies
        run: cd web && npm ci

      - name: Install Playwright browsers
        run: cd web && npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: cd web && npm run test:e2e
        env:
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.DEV_FIREBASE_PROJECT_ID }}

      - name: Upload Playwright report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: web/playwright-report/
```

### 6.2 Updated Backend CI Workflow

```yaml
# .github/workflows/backend-ci.yml
name: Backend CI

on:
  push:
    branches: [main, develop]
    paths: ['backend/**']
  pull_request:
    branches: [main, develop]
    paths: ['backend/**']

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      firebase-emulator:
        image: firebase/emulators
        ports:
          - 8080:8080

    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'
          cache-dependency-path: backend/requirements.txt

      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install -r requirements-dev.txt

      - name: Lint with ruff
        run: cd backend && ruff check src tests

      - name: Type check with mypy
        run: cd backend && mypy src --ignore-missing-imports

      - name: Run tests
        run: |
          cd backend
          pytest --cov=src --cov-report=xml --cov-report=term-missing
        env:
          USE_FIREBASE_EMULATOR: "true"
          FIRESTORE_EMULATOR_HOST: localhost:8080

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage.xml
          flags: backend
          fail_ci_if_error: false
```

---

## Coverage Targets

### Minimum Coverage Requirements

| Layer | Target | Current |
|-------|--------|---------|
| Backend Unit | 80% | ~15% |
| Backend Integration | 60% | ~5% |
| Frontend Unit | 70% | 0% |
| Frontend Components | 60% | 0% |
| E2E Critical Paths | 100% | 0% |

### Coverage Configuration

**Backend (`pytest.ini`):**
```ini
[coverage:run]
source = src
omit =
    */tests/*
    */migrations/*

[coverage:report]
fail_under = 60
show_missing = true
```

**Frontend (`vitest.config.ts`):**
```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: ['node_modules', 'src/tests'],
      thresholds: {
        statements: 60,
        branches: 50,
        functions: 60,
        lines: 60,
      },
    },
  },
});
```

---

## Test File Structure Summary

```
wego/
├── backend/
│   └── tests/
│       ├── conftest.py              # ✅ Exists
│       ├── unit/
│       │   ├── test_user_entity.py  # ✅ Exists (8 tests)
│       │   ├── test_security.py     # 🆕 Create
│       │   ├── test_dtos.py         # 🆕 Create
│       │   └── test_text_parser.py  # 🆕 Create
│       └── integration/
│           ├── test_auth_api.py     # ✅ Exists (3 tests)
│           ├── test_user_api.py     # 🆕 Create
│           └── test_indriver_api.py # 🆕 Create
│
└── web/
    ├── src/tests/
    │   ├── setup.ts                 # 🆕 Create
    │   ├── test-utils.tsx           # 🆕 Create
    │   ├── unit/
    │   │   ├── utils/               # 🆕 Create
    │   │   ├── validation/          # 🆕 Create
    │   │   └── hooks/               # 🆕 Create
    │   ├── integration/
    │   │   ├── auth/                # 🆕 Create
    │   │   ├── vehicles/            # 🆕 Create
    │   │   └── api/                 # 🆕 Create
    │   └── components/
    │       ├── VehicleForm.test.tsx # 🆕 Create
    │       └── VehiclesTable.test.tsx # 🆕 Create
    ├── e2e/
    │   ├── auth.spec.ts             # 🆕 Create
    │   └── vehicles.spec.ts         # 🆕 Create
    └── playwright.config.ts         # 🆕 Create
```

---

## Priority Order for Implementation

### Immediate Actions (This Week)

1. **Enable CI tests** - Uncomment test steps in GitHub Actions
2. **Create test setup file** - `web/src/tests/setup.ts`
3. **Write first frontend test** - Simple utility function test
4. **Add test npm scripts** - Ensure `npm test` works

### Short-term (Next 2 Weeks)

1. **Unit tests for validation schemas** - Zod vehicle schema
2. **Unit tests for utility functions** - Currency, date formatting
3. **Backend security tests** - JWT token creation/verification
4. **Component tests** - VehicleForm, StatusFilter

### Medium-term (Month 1-2)

1. **Integration tests** - Auth flows, API client
2. **Hook tests** - useDriverVehicles with mocked Firebase
3. **InDriver parser tests** - Text extraction logic
4. **E2E setup** - Playwright configuration

### Long-term (Month 2-3)

1. **E2E critical flows** - Login, vehicle CRUD
2. **Coverage reporting** - Codecov integration
3. **Visual regression** - Playwright screenshots
4. **Performance tests** - API response times

---

## Quick Start Commands

```bash
# Run all frontend tests
cd web && npm test

# Run frontend tests with UI
cd web && npm run test:ui

# Run frontend tests with coverage
cd web && npm run test:coverage

# Run backend tests
cd backend && pytest

# Run backend tests with coverage
cd backend && pytest --cov=src --cov-report=html

# Run E2E tests (after Playwright setup)
cd web && npm run test:e2e
```

---

## Summary

| Metric | Current | Target (3 months) |
|--------|---------|-------------------|
| Frontend Tests | 0 | 80+ |
| Backend Tests | 11 | 70+ |
| E2E Tests | 0 | 10+ |
| CI Tests Enabled | No | Yes |
| Coverage | ~5% | 60%+ |
| Deployment Confidence | Low | High |

This strategy prioritizes **reliability over quantity**. Focus on testing:
1. Authentication (security-critical)
2. Vehicle CRUD (core business)
3. InDriver import (revenue feature)
4. Form validations (data integrity)

Each test should justify its existence by catching real bugs or preventing regressions.
