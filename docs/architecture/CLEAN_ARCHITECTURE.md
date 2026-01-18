# WeGo Architecture

This document describes the architecture of WeGo, a transportation management platform built with React, Firebase, and Cloud Functions.

## Technology Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                      WEGO TECH STACK                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend (React 18 + TypeScript)                               │
│  ├─ Vite build system                                          │
│  ├─ React Router v6 (routing)                                  │
│  ├─ Zustand (state management)                                 │
│  ├─ React Hook Form + Zod (forms/validation)                   │
│  ├─ TanStack Table (data tables)                               │
│  ├─ Recharts (visualizations)                                  │
│  └─ CSS Modules + Design System tokens                         │
│                                                                 │
│  Backend (Firebase Cloud Functions)                             │
│  ├─ Node.js 20 + TypeScript                                    │
│  ├─ Storage triggers (file processing)                         │
│  ├─ Firestore triggers (event handling)                        │
│  ├─ Scheduled functions (cron jobs)                            │
│  └─ HTTP callable functions                                     │
│                                                                 │
│  Data & Storage                                                 │
│  ├─ Firebase Firestore (NoSQL database)                        │
│  ├─ Firebase Storage (file storage)                            │
│  └─ Firebase Authentication                                     │
│                                                                 │
│  External Services                                              │
│  ├─ Google Cloud Vision API (OCR)                              │
│  ├─ OpenAI GPT-4o (structured extraction)                      │
│  ├─ Anthropic Claude (AI insights)                             │
│  └─ Google Analytics 4 (tracking)                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

**Location:** `web/src/`

### Layer Organization

```
web/src/
├── pages/              # Route-level components (one per page)
├── features/           # Feature-based modules
│   └── [feature]/
│       ├── components/ # Feature-specific components
│       ├── hooks/      # Feature-specific hooks
│       ├── services/   # Feature-specific API calls
│       └── types/      # Feature-specific types
├── components/         # Shared UI components
├── hooks/              # Shared custom hooks
├── core/
│   ├── firebase/       # Firebase service functions
│   ├── types/          # Shared TypeScript types
│   ├── store/          # Zustand stores
│   └── analytics/      # GA4 integration
└── tests/              # Test files
```

### Key Patterns

**Pages (Route Components)**
```typescript
// web/src/pages/DashboardPage.tsx
export const DashboardPage: FC = () => {
  const { rides, isLoading } = useAdminRides();

  return (
    <div className="dashboard">
      <RidesTable rides={rides} />
    </div>
  );
};
```

**Custom Hooks**
```typescript
// web/src/hooks/useAdminRides.ts
export function useAdminRides() {
  const [rides, setRides] = useState<AdminRide[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAllRides(setRides);
    return () => unsubscribe();
  }, []);

  return { rides, isLoading, deleteRide, refreshRides };
}
```

**Firebase Services**
```typescript
// web/src/core/firebase/firestore.ts
export async function saveInDriverRides(
  driverId: string,
  rides: ExtractedInDriverRide[],
  vehicleId?: string
): Promise<SaveResult> {
  const batch = writeBatch(db);
  // ... batch operations
  await batch.commit();
  return { success: true };
}
```

## Backend Architecture (Cloud Functions)

**Location:** `web/functions/src/`

### Function Organization

```
web/functions/src/
├── index.ts            # Function exports (entry point)
├── triggers/           # Firestore and Storage triggers
│   ├── processInDriverDocument.ts
│   └── onExternalRideCreated.ts
├── scheduled/          # Scheduled (cron) functions
│   └── generateInsights.ts
├── services/           # Business logic services
│   ├── aiAnalysisService.ts
│   ├── visionService.ts
│   ├── insightsService.ts
│   └── notificationService.ts
└── types/              # TypeScript type definitions
```

### Function Types

**Storage Trigger**
```typescript
// Triggered when file uploaded to Firebase Storage
export const processInDriverDocument = onObjectFinalized(
  {
    bucket: 'wego-dev-a5a13.appspot.com',
    region: 'us-central1',
    memory: '1GiB',
    timeoutSeconds: 540,
  },
  async (event) => {
    const filePath = event.data.name;
    // Process uploaded document
  }
);
```

**Firestore Trigger**
```typescript
// Triggered when document created in Firestore
export const onExternalRideCreated = onDocumentCreated(
  'drivers/{driverId}/driver_rides/{rideId}',
  async (event) => {
    const rideData = event.data?.data();
    // Create notification for admins
  }
);
```

**Scheduled Function**
```typescript
// Runs on a schedule (cron expression)
export const generateWeeklyInsightsScheduled = onSchedule(
  {
    schedule: '0 6 * * 1', // Every Monday at 6 AM UTC
    timeZone: 'America/Bogota',
    memory: '512MiB',
  },
  async () => {
    // Generate weekly AI insights
  }
);
```

**HTTP Callable**
```typescript
// Called directly from frontend
export const generateInsightsForPeriod = onCall(
  { memory: '512MiB', timeoutSeconds: 300 },
  async (request) => {
    const { periodType, periodId } = request.data;
    return await generateInsights(periodType, periodId);
  }
);
```

## Firestore Data Architecture

### Collection Structure

```
Firestore Database
├── users/                          # User profiles & authentication
│   └── {userId}
│       ├── email, full_name, role, status
│       └── created_at, updated_at
│
├── drivers/                        # Driver profiles
│   └── {driverId}
│       ├── name, email, phone, slug
│       ├── driver_rides/           # Rides subcollection
│       │   └── {rideId}
│       │       ├── date, time, destination_address
│       │       ├── tarifa, total_recibido, mis_ingresos
│       │       ├── category (indriver/external/independent)
│       │       └── vehicle_id, status
│       └── vehicles/               # (Legacy) Vehicles subcollection
│
├── vehicles/                       # Top-level vehicles
│   └── {vehicleId}
│       ├── owner_id, assigned_driver_id
│       ├── plate, brand, model, year
│       ├── income/                 # Income subcollection
│       │   └── {incomeId}
│       └── expenses/               # Expenses subcollection
│           └── {expenseId}
│
├── notifications/                  # Admin notifications
│   └── {notificationId}
│
├── insights/                       # AI-generated insights
│   └── {insightId}
│
└── finance_categories/             # Custom categories
    └── {categoryId}
```

### Security Rules Pattern

```javascript
// Example: Owner-based access control
match /vehicles/{vehicleId} {
  // Only owner or assigned driver can read
  allow read: if request.auth != null &&
    (resource.data.owner_id == request.auth.uid ||
     resource.data.assigned_driver_id == request.auth.uid ||
     isAdmin());

  // Only owner or admin can write
  allow write: if request.auth != null &&
    (resource.data.owner_id == request.auth.uid || isAdmin());

  // Income subcollection
  match /income/{incomeId} {
    allow read: if vehicleOwnershipCheck(vehicleId);
    allow write: if request.resource.data.owner_id == request.auth.uid;
  }
}
```

## Data Flow Patterns

### Real-Time Updates

```
┌──────────┐    subscribe    ┌──────────┐    onSnapshot    ┌──────────┐
│  React   │ ──────────────→ │  Hook    │ ───────────────→ │ Firestore│
│Component │ ←────────────── │          │ ←─────────────── │          │
└──────────┘    state update └──────────┘    data change   └──────────┘
```

### File Processing Pipeline

```
┌──────────┐   upload    ┌──────────┐   trigger   ┌──────────┐
│  Upload  │ ──────────→ │  Storage │ ──────────→ │  Cloud   │
│   Page   │             │          │             │ Function │
└──────────┘             └──────────┘             └──────────┘
                                                       │
                         ┌──────────┐   API call  ┌────┴─────┐
                         │  Vision  │ ←────────── │   OCR    │
                         │   API    │ ──────────→ │ Extract  │
                         └──────────┘   text      └──────────┘
                                                       │
                         ┌──────────┐   API call  ┌────┴─────┐
                         │  OpenAI  │ ←────────── │   AI     │
                         │  GPT-4o  │ ──────────→ │ Parse    │
                         └──────────┘   struct    └──────────┘
                                                       │
     ┌──────────┐                                ┌─────┴────┐
     │ Firestore│ ←────────── save ──────────── │  Result  │
     │          │                               │          │
     └──────────┘                               └──────────┘
```

## Authentication & Authorization

### Role-Based Access Control

```typescript
type UserRole = 'admin' | 'driver';

// Route protection in React
const ProtectedRoute = ({ requiredRole, children }) => {
  const { user, role } = useAuth();

  if (!user) return <Navigate to="/login" />;
  if (requiredRole && role !== requiredRole) return <Navigate to="/dashboard" />;

  return children;
};

// Usage
<Route
  path="/reportes"
  element={
    <ProtectedRoute requiredRole="admin">
      <ReportingPage />
    </ProtectedRoute>
  }
/>
```

### Access Matrix

| Feature | Admin | Driver |
|---------|-------|--------|
| Dashboard | All rides | Own rides |
| Vehicles | All vehicles | Own vehicles |
| Vehicle Finances | All vehicles | Own vehicles |
| Reporting | Full access | No access |
| AI Insights | Full access | No access |
| User Management | Full access | No access |
| InDriver Import | Yes | Yes |
| External Ride Form | N/A | Own slug |

## Design System Integration

### Token Usage

```css
/* Using design system tokens */
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
}

.btn-primary {
  background: var(--color-accent-600);
  color: white;
}

.btn-primary:hover {
  background: var(--color-accent-500);
}
```

### Component Patterns

```tsx
// Table badge with semantic colors
<span className={`table-badge table-badge-${status}`}>
  {statusLabel}
</span>

// Status colors
// completed → --color-success-600
// pending → --color-warning-500
// cancelled → --color-error-500
// in_progress → --color-info-500
```

## Testing Approach

| Layer | Test Type | Tools |
|-------|-----------|-------|
| Components | Unit tests | Vitest + Testing Library |
| Hooks | Unit tests | Vitest + renderHook |
| Firebase services | Integration tests | Vitest + Firebase emulators |
| Cloud Functions | Integration tests | Firebase emulators |
| E2E flows | End-to-end | Playwright |

## Key Principles

1. **Feature-based organization**: Group related code by feature, not by type
2. **Real-time first**: Use Firestore real-time listeners where appropriate
3. **Role-based security**: Enforce access control at both UI and Firestore rules
4. **Type safety**: Full TypeScript coverage with strict mode
5. **Design system consistency**: Use tokens and components from design system
6. **Spanish UI, English code**: User-facing content in Spanish, code in English

---

**Last Updated**: January 2025
