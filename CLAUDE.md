# WeGo - AI Agent Instructions

> **Slogan (Spanish):** "Seguro para ti, cómodo para tu mascota"

---

## CRITICAL SAFETY RULES

**NEVER perform any of the following destructive operations:**

1. **NEVER DELETE DATA** from Firebase Firestore, Storage, or any database
2. **NEVER run `firebase firestore:delete`** or any delete commands
3. **NEVER run destructive CLI commands** (`rm -rf`, `drop`, `truncate`, etc.)
4. **NEVER modify production data** without explicit user confirmation
5. **NEVER run commands that could cause data loss**

If data needs to be deleted or modified, **ALWAYS ask the user to do it manually** and provide step-by-step instructions instead.

---

## Production Data Debugging Rules

When asked to investigate or debug **production data**:

1. **READ-ONLY ACCESS ONLY** - Never modify, update, or delete production data
2. **Use Firebase Console** - Direct the user to view data in Firebase Console
3. **Log Analysis** - Check Cloud Function logs via `firebase functions:log`
4. **No Direct Queries** - Avoid running scripts that could accidentally modify data
5. **Document Findings** - Report observations without making changes
6. **User Confirmation** - Any data fixes must be done manually by the user

**NEVER** when debugging production:
- Run any write/update/delete operations on production
- Use admin SDKs to modify production Firestore
- Execute migration scripts against production
- Make "quick fixes" to production data
- Switch to production project without explicit user permission

---

## Project Overview

WeGo is a transportation platform offering:
- People transportation
- Pet transportation
- Senior citizens with special needs
- Premium and customized services

This is the **internal management platform** for:
- Ride tracking and control
- Driver management
- Commission and payment administration
- Business reports and metrics

---

## Tech Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Styling**: CSS Modules or Tailwind CSS (using our tokens)
- **State**: Zustand or React Context
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **Tables**: TanStack Table
- **Charts**: Recharts or Chart.js

### Backend (Cloud Functions)
- **Runtime**: Node.js 20 with TypeScript
- **Platform**: Firebase Cloud Functions (2nd generation)
- **Triggers**: Storage, Firestore, Scheduled, HTTP Callable
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **OCR**: Google Cloud Vision API
- **AI**: OpenAI GPT-4o, Anthropic Claude
- **Deployment**: Firebase Functions

### Infrastructure
- **Monorepo**: Turborepo (if applicable)
- **Testing**: Vitest + Testing Library
- **Linting**: ESLint + Prettier
- **CI/CD**: GitHub Actions

---

## Project Structure

```
wego/
├── .claude/
│   ├── agents/           # Agent-specific instructions
│   └── commands/         # Custom slash commands
├── design-system/        # WeGo Design System
│   ├── assets/           # Logos and visual assets
│   ├── tokens/           # CSS variables (colors, typography, spacing)
│   ├── components/       # Base component styles
│   └── BRAND_GUIDELINES.md
├── docs/
│   ├── features/         # Feature documentation (11 files)
│   ├── setup/            # Development setup guides
│   ├── architecture/     # System architecture
│   └── deployment/       # Deployment procedures
├── web/
│   ├── src/
│   │   ├── components/   # Reusable React components
│   │   ├── pages/        # Application pages/views
│   │   ├── features/     # Feature-specific code
│   │   ├── hooks/        # Custom hooks
│   │   ├── core/
│   │   │   ├── firebase/ # Firestore operations
│   │   │   ├── store/    # Zustand stores
│   │   │   └── types/    # TypeScript types
│   │   └── utils/        # Utilities and helpers
│   ├── functions/
│   │   └── src/
│   │       ├── triggers/   # Event-driven functions
│   │       ├── scheduled/  # Cron-based functions
│   │       └── services/   # Business logic
│   ├── firestore.rules     # Security rules
│   └── firestore.indexes.json
├── CLAUDE.md             # This file
└── AGENTS.md             # Agent definitions
```

---

## Design System

### Primary Colors

```css
/* Primary - Navy (from logo) */
--color-primary-800: #1E2A3A;  /* Main text, sidebar */
--color-primary-700: #2C3E50;  /* Hover states */

/* Accent - Coral (from heart) */
--color-accent-600: #F05365;   /* CTAs, primary buttons */
--color-accent-500: #F47585;   /* CTA hover */

/* Semantic */
--color-success-600: #16A34A;  /* Completed rides */
--color-warning-500: #EAB308;  /* Pending */
--color-error-500: #EF4444;    /* Cancelled, errors */
--color-info-500: #0EA5E9;     /* In progress */
```

### Typography

```css
/* Headings */
font-family: 'Plus Jakarta Sans', sans-serif;

/* Body and UI */
font-family: 'Inter', sans-serif;

/* Numbers and data */
font-family: 'JetBrains Mono', monospace;
```

### Import Design System

```css
@import './design-system/index.css';
```

---

## Code Conventions

### Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `RideCard.tsx` |
| Hooks | camelCase with `use` | `useRides.ts` |
| Utilities | camelCase | `formatCurrency.ts` |
| Types | PascalCase with suffix | `RideType.ts`, `DriverInterface.ts` |
| CSS Modules | camelCase | `rideCard.module.css` |
| Constants | SCREAMING_SNAKE | `API_BASE_URL` |

### Component Structure

```tsx
// src/components/RideCard/RideCard.tsx
import { type FC } from 'react';
import styles from './RideCard.module.css';
import type { Ride } from '@/types';

interface RideCardProps {
  ride: Ride;
  onSelect?: (ride: Ride) => void;
}

export const RideCard: FC<RideCardProps> = ({ ride, onSelect }) => {
  // Component logic
};
```

### Feature-Based File Structure

```
src/features/rides/
├── components/
│   ├── RideCard/
│   │   ├── RideCard.tsx
│   │   ├── RideCard.module.css
│   │   ├── RideCard.test.tsx
│   │   └── index.ts
│   └── RideList/
├── hooks/
│   └── useRides.ts
├── services/
│   └── ridesApi.ts
├── stores/
│   └── ridesStore.ts
├── types/
│   └── ride.types.ts
└── index.ts
```

---

## Core Data Models

### Ride

```typescript
interface Ride {
  id: string;
  code: string;                    // "VJ-2024-001"
  status: RideStatus;
  serviceType: ServiceType;

  // Locations
  origin: Location;
  destination: Location;

  // Participants
  passengerId: string;
  driverId?: string;

  // Service details
  hasPet?: boolean;
  petDetails?: PetDetails;
  requiresAssistance?: boolean;
  assistanceNotes?: string;

  // Financial
  estimatedPrice: number;
  finalPrice?: number;
  commission: number;

  // Timestamps
  requestedAt: Date;
  acceptedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
}

type RideStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
type ServiceType = 'standard' | 'pets' | 'senior' | 'premium';
```

### Driver

```typescript
interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;

  // Vehicle
  vehicle: Vehicle;

  // Capabilities
  acceptsPets: boolean;
  acceptsSeniors: boolean;

  // Metrics
  rating: number;
  totalRides: number;
  completionRate: number;

  // Status
  status: DriverStatus;
  isOnline: boolean;
  currentLocation?: Location;

  // Financial
  balance: number;
  pendingCommissions: number;
}

type DriverStatus = 'active' | 'inactive' | 'suspended';
```

### Transaction

```typescript
interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: 'COP';

  rideId?: string;
  driverId?: string;

  status: TransactionStatus;

  createdAt: Date;
  processedAt?: Date;
}

type TransactionType = 'ride_payment' | 'commission' | 'payout' | 'refund';
type TransactionStatus = 'pending' | 'completed' | 'failed';
```

### Vehicle Finance (P/L Tracking)

The vehicle finance feature tracks income and expenses for vehicles, enabling Profit/Loss analysis.

```typescript
// Income types
type IncomeType = 'weekly_payment' | 'tip_share' | 'bonus' | 'other';

// Expense categories
type ExpenseCategory =
  | 'fuel'
  | 'maintenance'
  | 'insurance_soat'
  | 'tecnomecanica'
  | 'taxes'
  | 'fines'
  | 'parking'
  | 'car_wash'
  | 'accessories'
  | 'other';

// Recurrence frequency for recurring income/expenses
type RecurrenceFrequency = 'weekly' | 'biweekly' | 'monthly';

interface VehicleIncome {
  id: string;
  vehicle_id: string;
  owner_id: string;
  type: IncomeType;
  amount: number;
  description: string;
  date: Date;
  is_recurring: boolean;
  recurrence_pattern?: RecurrencePattern;
  driver_id?: string;
  driver_name?: string;
  created_at: Date;
  updated_at: Date;
  notes?: string;
}

interface VehicleExpense {
  id: string;
  vehicle_id: string;
  owner_id: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: Date;
  is_recurring: boolean;
  recurrence_pattern?: RecurrencePattern;
  receipt_url?: string;
  vendor?: string;
  created_at: Date;
  updated_at: Date;
  notes?: string;
}

interface VehiclePLSummary {
  vehicle_id: string;
  period: { start_date: Date; end_date: Date };
  total_income: number;
  total_expenses: number;
  net_profit: number;
  profit_margin: number;
  income_by_type: Record<IncomeType, number>;
  expenses_by_category: Record<ExpenseCategory, number>;
}
```

---

## Firestore Data Structure

### Collection Architecture

WeGo uses two vehicle collection structures for backward compatibility:

```
Firestore Database
├── users/                          # User profiles
│   └── {userId}
│       ├── email, full_name, role, status
│       └── ...
│
├── drivers/                        # Driver profiles (legacy)
│   └── {driverId}
│       ├── name, email, phone, slug
│       ├── driver_rides/           # Rides subcollection
│       │   └── {rideId}
│       └── vehicles/               # Legacy vehicles subcollection
│           └── {vehicleId}
│
├── vehicles/                       # Top-level vehicles (new structure)
│   └── {vehicleId}
│       ├── owner_id, driver_id, plate, brand, model
│       ├── weekly_rental_amount, status
│       ├── income/                 # Income subcollection
│       │   └── {incomeId}
│       │       ├── type, amount, description, date
│       │       ├── owner_id, vehicle_id
│       │       └── is_recurring, recurrence_pattern
│       └── expenses/               # Expenses subcollection
│           └── {expenseId}
│               ├── category, amount, description, date
│               ├── owner_id, vehicle_id, vendor
│               └── is_recurring, recurrence_pattern
```

### Firestore Security Rules

Income and expense subcollections use owner-based access control:

```javascript
// Vehicle income subcollection
match /income/{incomeId} {
  allow read: if request.auth != null &&
    (vehicleOwnershipCheck(vehicleId) || isAdmin());
  allow create: if request.auth != null &&
    (request.resource.data.owner_id == request.auth.uid || isAdmin());
  allow update, delete: if request.auth != null &&
    (resource.data.owner_id == request.auth.uid || isAdmin());
}

// Vehicle expenses subcollection
match /expenses/{expenseId} {
  allow read: if request.auth != null &&
    (vehicleOwnershipCheck(vehicleId) || isAdmin());
  allow create: if request.auth != null &&
    (request.resource.data.owner_id == request.auth.uid || isAdmin());
  allow update, delete: if request.auth != null &&
    (resource.data.owner_id == request.auth.uid || isAdmin());
}

// Helper: Check vehicle ownership (owner_id or driver_id)
function vehicleOwnershipCheck(vehicleId) {
  return !exists(/databases/$(database)/documents/vehicles/$(vehicleId)) ||
    get(/databases/$(database)/documents/vehicles/$(vehicleId)).data.owner_id == request.auth.uid ||
    get(/databases/$(database)/documents/vehicles/$(vehicleId)).data.driver_id == request.auth.uid;
}
```

### Important Data Decisions

1. **Top-level vehicles collection**: New vehicles are stored in `/vehicles/{vehicleId}` with `owner_id` field
2. **Subcollection pattern**: Income and expenses are subcollections under vehicles for data locality
3. **Owner-based permissions**: All finance data requires `owner_id` matching the authenticated user
4. **Admin access**: Admins can read/write all vehicle finance data
5. **No undefined values**: Firestore doesn't accept `undefined` - always filter out undefined fields before writes

---

## Language Rules

### User-Facing Copy
**All user-visible copy must be in Spanish (Colombia).**

**Use proper Spanish accent marks (tildes).** Words must include their correct accents:
- vehículo (not vehiculo)
- kilómetro (not kilometro)
- operación (not operacion)
- información (not informacion)
- número (not numero)
- día (not dia)
- más (not mas)
- están (not estan)

### Code and Documentation
**All code, comments, variable names, and documentation must be in English.**

### Data Formatting (Colombian Locale)

| Type | Format | Example |
|------|--------|---------|
| Currency | $XXX.XXX COP | $125.000 COP |
| Percentage | XX,X% | 12,5% |
| Long date | DD de MMMM de YYYY | 15 de diciembre de 2024 |
| Short date | DD/MM/YYYY | 15/12/2024 |
| Time | HH:MM (24h) | 14:30 |

### Common UI Messages (Spanish)

```typescript
const MESSAGES = {
  // Ride statuses
  RIDE_PENDING: 'Viaje pendiente de asignación',
  RIDE_ACCEPTED: 'Viaje aceptado por el conductor',
  RIDE_IN_PROGRESS: 'Viaje en curso',
  RIDE_COMPLETED: '¡Viaje completado!',
  RIDE_CANCELLED: 'Viaje cancelado',

  // Actions
  ASSIGN_DRIVER: 'Asignar conductor',
  VIEW_DETAILS: 'Ver detalles',
  CANCEL_RIDE: 'Cancelar viaje',

  // Confirmations
  CONFIRM_CANCEL: '¿Estás seguro de cancelar este viaje?',
  CONFIRM_DELETE: '¿Estás seguro de eliminar este registro?',

  // Success
  SUCCESS_SAVED: 'Cambios guardados correctamente',
  SUCCESS_ASSIGNED: 'Conductor asignado correctamente',

  // Errors
  ERROR_GENERIC: 'Ha ocurrido un error. Intenta de nuevo.',
  ERROR_CONNECTION: 'Error de conexión. Verifica tu internet.',
  ERROR_NOT_FOUND: 'El recurso solicitado no existe.',

  // Empty states
  EMPTY_RIDES: 'No hay viajes pendientes',
  EMPTY_DRIVERS: 'No hay conductores disponibles',
};
```

---

## Patterns and Best Practices

### API Calls

```typescript
// services/api.ts
import { z } from 'zod';

const rideSchema = z.object({
  id: z.string(),
  status: z.enum(['pending', 'accepted', 'in_progress', 'completed', 'cancelled']),
  // ...
});

export async function getRides(): Promise<Ride[]> {
  const response = await fetch(`${API_BASE_URL}/rides`);
  if (!response.ok) throw new Error('Failed to load rides');
  const data = await response.json();
  return z.array(rideSchema).parse(data);
}
```

### Global State (Zustand)

```typescript
// stores/ridesStore.ts
import { create } from 'zustand';

interface RidesState {
  rides: Ride[];
  isLoading: boolean;
  error: string | null;
  fetchRides: () => Promise<void>;
  updateRideStatus: (id: string, status: RideStatus) => void;
}

export const useRidesStore = create<RidesState>((set) => ({
  rides: [],
  isLoading: false,
  error: null,

  fetchRides: async () => {
    set({ isLoading: true, error: null });
    try {
      const rides = await getRides();
      set({ rides, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load rides', isLoading: false });
    }
  },

  updateRideStatus: (id, status) => {
    set((state) => ({
      rides: state.rides.map((ride) =>
        ride.id === id ? { ...ride, status } : ride
      ),
    }));
  },
}));
```

### Using Design System Components

```tsx
// Use design system classes
<button className="btn btn-primary">
  Asignar conductor
</button>

<div className="card">
  <div className="card-header">
    <h3 className="card-header-title">Viajes de Hoy</h3>
  </div>
  <div className="card-body">
    {/* content */}
  </div>
</div>

<span className="table-badge table-badge-completed">
  Completado
</span>
```

---

## Key Discovery Paths

When planning features or exploring the codebase, check these locations:

| Looking for... | Check these paths |
|----------------|-------------------|
| Existing pages | `web/src/pages/*.tsx` |
| Feature components | `web/src/features/*/` |
| Shared components | `web/src/components/*/` |
| Hooks | `web/src/hooks/*.ts` |
| Firebase operations | `web/src/core/firebase/*.ts` |
| Cloud Functions | `web/functions/src/` |
| Type definitions | `web/src/core/types/*.ts` |
| Feature documentation | `docs/features/*.md` |
| Design system | `design-system/` |
| Firestore rules | `web/firestore.rules` |
| State stores | `web/src/core/store/*.ts` |

---

## Reference Files

| File | Purpose |
|------|---------|
| `docs/features/README.md` | Feature documentation index |
| `docs/features/*.md` | Individual feature documentation |
| `docs/setup/DEVELOPMENT_SETUP.md` | Development environment setup |
| `docs/architecture/CLEAN_ARCHITECTURE.md` | System architecture overview |
| `design-system/BRAND_GUIDELINES.md` | Complete brand guide |
| `design-system/DATEPICKER_GUIDELINES.md` | Date picker components usage guide |
| `design-system/tokens/colors.css` | Color variables |
| `design-system/tokens/typography.css` | Typography system |
| `.claude/agents/cloud-functions.md` | Cloud Functions development patterns |
| `.claude/agents/database.md` | Firestore patterns and best practices |
| `.claude/agents/frontend.md` | React/TypeScript patterns |
| `web/src/core/types/*.ts` | TypeScript type definitions |
| `web/src/core/firebase/*.ts` | Firebase operations |
| `web/functions/src/` | Cloud Functions source |
| `web/firestore.rules` | Firestore security rules |
| `web/firestore.indexes.json` | Firestore composite indexes |
| `docs/SECURITY_AUDIT_REPORT.md` | Security audit findings and remediation status |
| `docs/TESTING_STRATEGY.md` | Testing patterns and best practices |

---

## Deployment & Environments

### Multi-Environment Architecture

WeGo uses Firebase + Cloud Run for a complete full-stack deployment:

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENVIRONMENT ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DEV Environment (branch: develop)                              │
│  ├─ Frontend: https://wego-dev-a5a13.web.app (Firebase)        │
│  ├─ Backend:  https://wego-backend-dev-xxx.run.app (Cloud Run) │
│  ├─ Database: Firestore (wego-dev-a5a13)                       │
│  └─ Badge: 🟠 DEV (orange)                                      │
│                                                                 │
│  PROD Environment (branch: main)                                │
│  ├─ Frontend: https://wego-bac88.web.app (Firebase)            │
│  ├─ Backend:  https://wego-backend-prod-xxx.run.app (Cloud Run)│
│  ├─ Database: Firestore (wego-bac88)                           │
│  └─ Badge: 🟢 PROD (green)                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Git Workflow

```
feature/xxx ──┬──► develop ──────► main
              │         │            │
              │         ▼            ▼
              │    Deploy DEV    Deploy PROD
              │         │            │
              │         ▼            ▼
              │   wego-dev-a5a13  wego-bac88
              │
              └──► Create PR to develop
```

1. Create feature branch from `develop`
2. Push changes and create PR to `develop`
3. Merge PR → Auto-deploys to DEV
4. Test on DEV site
5. Create PR from `develop` to `main`
6. Merge PR → Auto-deploys to PROD

### Environment Configuration

**Local Development** (`.env.development` - gitignored):
```bash
VITE_FIREBASE_API_KEY=<dev-api-key>
VITE_FIREBASE_AUTH_DOMAIN=wego-dev-a5a13.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=wego-dev-a5a13
VITE_FIREBASE_STORAGE_BUCKET=wego-dev-a5a13.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=<dev-sender-id>
VITE_FIREBASE_APP_ID=<dev-app-id>
```

**CI/CD**: Environment variables are injected via GitHub Secrets during deployment.

### GitHub Secrets Required

#### Frontend (Firebase Hosting)
| Secret | Description |
|--------|-------------|
| `DEV_FIREBASE_API_KEY` | Firebase API key for dev project |
| `DEV_FIREBASE_AUTH_DOMAIN` | Firebase auth domain for dev |
| `DEV_FIREBASE_PROJECT_ID` | Firebase project ID for dev |
| `DEV_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket for dev |
| `DEV_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID for dev |
| `DEV_FIREBASE_APP_ID` | Firebase app ID for dev |
| `DEV_GA4_MEASUREMENT_ID` | Google Analytics 4 measurement ID for dev (e.g., G-XXXXXXXXXX) |
| `PROD_FIREBASE_*` | Same variables for production |
| `PROD_GA4_MEASUREMENT_ID` | Google Analytics 4 measurement ID for prod |
| `FIREBASE_SERVICE_ACCOUNT_DEV` | Service account JSON for dev deployment |
| `FIREBASE_SERVICE_ACCOUNT_PROD` | Service account JSON for prod deployment |

#### Backend (Cloud Run)
| Secret | Description |
|--------|-------------|
| `GCP_PROJECT_ID_DEV` | GCP project ID for dev (same as Firebase) |
| `GCP_PROJECT_ID_PROD` | GCP project ID for prod (same as Firebase) |
| `GCP_SA_KEY_DEV` | Service account JSON with Cloud Run permissions (dev) |
| `GCP_SA_KEY_PROD` | Service account JSON with Cloud Run permissions (prod) |
| `DEV_API_URL` | Cloud Run URL for dev backend (set after first deploy) |
| `PROD_API_URL` | Cloud Run URL for prod backend (set after first deploy) |

#### Claude AI Code Review
| Secret | Description |
|--------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude code review |

### Service Account IAM Roles

The service accounts used in `FIREBASE_SERVICE_ACCOUNT_DEV` and `FIREBASE_SERVICE_ACCOUNT_PROD` must have the following IAM roles in their respective GCP projects:

| Role | Purpose |
|------|---------|
| **Service Usage Admin** | Check and enable API status during deployment |
| **Firebase Rules Admin** | Deploy Firestore security rules |
| **Cloud Datastore Index Admin** | Deploy Firestore indexes |
| **Cloud Storage for Firebase Admin** | Deploy Firebase Storage security rules |
| **Firebase Hosting Admin** | Deploy to Firebase Hosting |
| **Service Account User** | Act as the service account |

**To configure IAM roles:**
1. Go to [GCP IAM Console](https://console.cloud.google.com/iam-admin/iam)
2. Select the project (wego-dev-a5a13 for DEV, wego-bac88 for PROD)
3. Find the service account (e.g., `github-actions@wego-dev-a5a13.iam.gserviceaccount.com`)
4. Click "Edit" and add all required roles listed above
5. Save changes (IAM propagation may take a few minutes)

### Environment Badge

The dashboard displays an environment badge in the sidebar:
- **DEV**: Orange badge when `VITE_FIREBASE_PROJECT_ID` contains "dev"
- **PROD**: Green badge otherwise

```tsx
// Detection logic in DashboardLayout.tsx
const isDev = import.meta.env.VITE_FIREBASE_PROJECT_ID?.includes('dev');
const envLabel = isDev ? 'DEV' : 'PROD';
```

---

## CI/CD Pipeline

### Workflow Overview

```
PR Created/Updated
       │
       ▼
┌──────────────────────────────────────────────────────┐
│                    PARALLEL JOBS                      │
├──────────────────────────────────────────────────────┤
│  Web CI (web-ci.yml)     │  Backend CI (backend-ci.yml)
│  ├─ Lint (ESLint)        │  ├─ Lint (ruff)
│  ├─ Format (Prettier)    │  ├─ Type check (mypy)
│  ├─ Type check (tsc)     │  ├─ Unit tests (pytest)
│  ├─ Unit tests (Vitest)  │  └─ Integration tests
│  ├─ Build                │
│  └─ E2E tests (Playwright)
│                          │
├──────────────────────────────────────────────────────┤
│              Claude AI Code Review                    │
│  ├─ Code quality review (all PRs)                    │
│  └─ Security review (PRs to main only)               │
└──────────────────────────────────────────────────────┘
       │
       ▼ (on merge)
┌──────────────────────────────────────────────────────┐
│                   DEPLOYMENT                          │
├──────────────────────────────────────────────────────┤
│  develop → DEV environment                           │
│  main    → PROD environment                          │
└──────────────────────────────────────────────────────┘
```

### Claude AI Code Review

The pipeline includes automated AI code review using Claude:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `claude-review.yml` | PR opened/updated | Code quality, patterns, best practices |
| `claude-review.yml` (security) | PR to main | Security vulnerabilities, auth issues |

**Features:**
- Automatic review comments on PRs
- @claude mention support for interactive questions
- WeGo-specific context from CLAUDE.md
- Security-focused review for production deployments

**To enable:** Add `ANTHROPIC_API_KEY` to repository secrets.

---

## Useful Commands

```bash
# Development (run from web/)
npm run dev          # Start development server
npm run build        # Production build
npm run test         # Run tests
npm run lint         # Check linting
npm run type-check   # Check types

# Firebase
firebase use dev     # Switch to dev project
firebase use prod    # Switch to prod project
firebase deploy --only firestore:rules  # Deploy Firestore rules
firebase deploy --only firestore:indexes  # Deploy Firestore indexes

# Cloud Functions (run from web/functions/)
npm run build        # Build functions
firebase deploy --only functions  # Deploy all functions
firebase deploy --only functions:processInDriverDocument  # Deploy specific function
firebase functions:log  # View function logs

# Emulators
firebase emulators:start --only functions,firestore,storage
```

---

## AI Agent Guidelines

1. **Always** use the existing design system in `design-system/`
2. **Always** write user-facing copy in Spanish (Colombia)
3. **Always** write code and comments in English
4. **Prioritize** TypeScript with strict types
5. **Follow** established naming conventions
6. **Reuse** existing components and hooks before creating new ones
7. **Validate** data with Zod at boundaries (API, forms)
8. **Maintain** consistency with existing code
9. **Document** complex components with JSDoc comments
10. **Use date picker components** - For date selection, use `SingleDatePicker` (single dates with presets) or `DateRangePicker` (date ranges with presets). See `design-system/DATEPICKER_GUIDELINES.md`

---

*Last updated: January 2025 - Documentation overhaul, added Key Discovery Paths, updated tech stack to Cloud Functions*
