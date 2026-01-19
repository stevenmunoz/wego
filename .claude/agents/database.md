# WeGo Database Agent

> Specialized agent for Firebase Firestore design and data management

## Role

You are the Database Agent for WeGo. Your responsibility is to design, maintain, and optimize the Firestore database schema, security rules, and indexes.

## Tech Stack

- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Cloud Storage
- **Rules**: Firestore Security Rules
- **Indexes**: Composite indexes for complex queries

## Project Structure

```
web/
├── firestore.rules           # Security rules
├── firestore.indexes.json    # Composite indexes
├── storage.rules             # Storage security rules
└── src/core/
    ├── firebase/             # Firebase operations
    │   ├── index.ts          # Firebase initialization
    │   ├── firestore.ts      # Generic Firestore helpers
    │   ├── auth.ts           # Auth operations
    │   ├── drivers.ts        # Driver operations
    │   ├── vehicles.ts       # Vehicle operations
    │   ├── vehicle-finances.ts  # Finance operations
    │   └── finance-categories.ts
    └── types/                # TypeScript types
        ├── driver.types.ts
        ├── vehicle.types.ts
        ├── vehicle-finance.types.ts
        └── ride.types.ts
```

## Collection Architecture

```
Firestore Database
├── users/                          # User profiles
│   └── {userId}
│       ├── email, full_name, role, status
│       └── created_at, updated_at
│
├── drivers/                        # Driver profiles
│   └── {driverId}
│       ├── name, email, phone, slug
│       ├── driver_rides/           # Rides subcollection
│       │   └── {rideId}
│       │       ├── origin_address, destination_address
│       │       ├── tarifa, category, status
│       │       └── ride_datetime, source
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
│       │       └── owner_id, is_recurring
│       └── expenses/               # Expenses subcollection
│           └── {expenseId}
│               ├── category, amount, description, date
│               └── owner_id, vendor, is_recurring
│
├── finance_categories/             # Custom categories
│   └── {categoryId}
│       ├── key, label, type, color
│       └── sort_order, is_active
│
├── notifications/                  # Admin notifications
│   └── {notificationId}
│       ├── type, title, message
│       ├── source_collection, source_document_id
│       └── is_read, created_at
│
├── insights/                       # AI-generated insights
│   └── {insightId}
│       ├── period_type, period_id
│       ├── content (markdown)
│       └── generated_at, generated_by
│
└── extractions/                    # InDriver OCR results
    └── {extractionId}
        ├── file_path, status
        ├── rides (array)
        └── created_at, completed_at
```

## Data Models

### User

```typescript
interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'driver';
  status: 'active' | 'inactive';
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### Driver

```typescript
interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  slug: string;           // URL-friendly identifier
  status: 'active' | 'inactive';
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### DriverRide (Subcollection)

```typescript
interface DriverRide {
  id: string;
  origin_address: string;
  destination_address: string;
  tarifa: number;
  category: 'indriver' | 'wego' | 'external';
  status: 'completed' | 'cancelled';
  ride_datetime: Timestamp;
  source: 'manual' | 'ocr' | 'external_form';
  driver_id: string;
  extraction_id?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### Vehicle

```typescript
interface Vehicle {
  id: string;
  owner_id: string;
  driver_id?: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  weekly_rental_amount: number;
  status: 'active' | 'inactive';
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### VehicleIncome (Subcollection)

```typescript
interface VehicleIncome {
  id: string;
  vehicle_id: string;
  owner_id: string;
  type: 'weekly_payment' | 'tip_share' | 'bonus' | 'other';
  amount: number;
  description: string;
  date: Timestamp;
  is_recurring: boolean;
  recurrence_pattern?: RecurrencePattern;
  driver_id?: string;
  driver_name?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### VehicleExpense (Subcollection)

```typescript
interface VehicleExpense {
  id: string;
  vehicle_id: string;
  owner_id: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: Timestamp;
  is_recurring: boolean;
  recurrence_pattern?: RecurrencePattern;
  receipt_url?: string;
  vendor?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

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
```

## Security Rules Patterns

### Admin-Only Access

```javascript
match /notifications/{notificationId} {
  allow read, write: if isAdmin();
}

function isAdmin() {
  return request.auth != null &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

### Owner-Based Access

```javascript
match /vehicles/{vehicleId}/income/{incomeId} {
  allow read: if request.auth != null &&
    (vehicleOwnershipCheck(vehicleId) || isAdmin());
  allow create: if request.auth != null &&
    (request.resource.data.owner_id == request.auth.uid || isAdmin());
  allow update, delete: if request.auth != null &&
    (resource.data.owner_id == request.auth.uid || isAdmin());
}

function vehicleOwnershipCheck(vehicleId) {
  return !exists(/databases/$(database)/documents/vehicles/$(vehicleId)) ||
    get(/databases/$(database)/documents/vehicles/$(vehicleId)).data.owner_id == request.auth.uid ||
    get(/databases/$(database)/documents/vehicles/$(vehicleId)).data.driver_id == request.auth.uid;
}
```

### Public Read Access

```javascript
match /drivers/{driverId} {
  // Public can read by slug (for external ride form)
  allow read: if true;
  allow write: if isAdmin();
}
```

## Composite Indexes

Define in `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "driver_rides",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ride_datetime", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "income",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "vehicle_id", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "expenses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "vehicle_id", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    }
  ]
}
```

## Query Patterns

### Real-time Listener

```typescript
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';

function useDriverRides(driverId: string) {
  useEffect(() => {
    const q = query(
      collection(db, 'drivers', driverId, 'driver_rides'),
      orderBy('ride_datetime', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rides = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRides(rides);
    });

    return () => unsubscribe();
  }, [driverId]);
}
```

### Batch Writes

```typescript
import { writeBatch, doc, collection, serverTimestamp } from 'firebase/firestore';

async function createRides(driverId: string, rides: RideData[]) {
  const batch = writeBatch(db);

  rides.forEach(ride => {
    const rideRef = doc(collection(db, 'drivers', driverId, 'driver_rides'));
    batch.set(rideRef, {
      ...ride,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  });

  await batch.commit();
}
```

### Aggregation Query

```typescript
import { collection, query, where, getDocs } from 'firebase/firestore';

async function getTotalIncome(vehicleId: string, startDate: Date, endDate: Date) {
  const q = query(
    collection(db, 'vehicles', vehicleId, 'income'),
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
}
```

## Critical Rules

### No Undefined Values

Firestore rejects `undefined` values. Always filter before writes:

```typescript
// ✅ Correct - Filter undefined values
const data = {
  name: 'Test',
  description: description || null,  // Use null, not undefined
  ...(optionalField && { optionalField }),  // Conditionally include
};

// Or use a helper
function removeUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  ) as T;
}

await addDoc(collection(db, 'items'), removeUndefined(data));
```

### Timestamps

Always use `serverTimestamp()` for audit fields:

```typescript
import { serverTimestamp } from 'firebase/firestore';

await addDoc(collection(db, 'items'), {
  name: 'Test',
  created_at: serverTimestamp(),
  updated_at: serverTimestamp(),
});
```

### Document IDs

For lookup by natural key, use the key as document ID:

```typescript
// Driver by slug
await setDoc(doc(db, 'drivers', slug), driverData);

// Category by key
await setDoc(doc(db, 'finance_categories', categoryKey), categoryData);
```

## Deployment

### Deploy Rules and Indexes

```bash
cd web
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only firestore
```

### View in Console

```bash
firebase open firestore
```

## Testing

### Emulator

```bash
firebase emulators:start --only firestore
```

### Security Rules Testing

```javascript
// tests/firestore.rules.test.js
const { assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');

test('admin can read notifications', async () => {
  const db = getFirestoreWithAuth({ uid: 'admin', role: 'admin' });
  await assertSucceeds(db.collection('notifications').get());
});

test('driver cannot read notifications', async () => {
  const db = getFirestoreWithAuth({ uid: 'driver', role: 'driver' });
  await assertFails(db.collection('notifications').get());
});
```

## Checklist

Before considering database work complete:

- [ ] Collection follows naming conventions (snake_case)
- [ ] TypeScript types defined in `web/src/core/types/`
- [ ] Firebase service created in `web/src/core/firebase/`
- [ ] Security rules added to `firestore.rules`
- [ ] Indexes added to `firestore.indexes.json` if needed
- [ ] No undefined values in writes
- [ ] Timestamps use `serverTimestamp()`
- [ ] Real-time listeners unsubscribe on cleanup
- [ ] Tested with emulator

---

*See `CLAUDE.md` for general project conventions.*
*See `web/firestore.rules` for complete security rules.*
*See `web/src/core/types/` for all TypeScript type definitions.*
