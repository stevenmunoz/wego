# External Rides

> Public form wizard for drivers to register rides from non-platform sources

## Overview

The External Rides feature provides a multi-step wizard form that drivers can use to register rides obtained from external sources like WhatsApp, phone calls, or referrals. The form is accessible via a public URL using the driver's unique slug.

The wizard guides users through capturing ride details, payment information, and optional tip data. Upon submission, rides are saved to the driver's Firestore collection and trigger admin notifications.

**Key Capabilities:**
- Public URL access via driver slug (`/registrar-viaje/{slug}`)
- 13-step wizard with back/next navigation
- Context-aware form validation
- Automatic commission calculation (9.5%)
- Financial breakdown display
- Mobile-optimized design
- Firestore trigger for admin notifications

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 EXTERNAL RIDES ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend (React/TypeScript)                                    │
│  ├─ Page: ExternalRideFormPage.tsx                             │
│  ├─ Components:                                                 │
│  │   └─ ExternalRideWizard (multi-step form)                   │
│  │       ├─ Step components (1-13)                             │
│  │       ├─ ProgressBar                                        │
│  │       └─ NavigationButtons                                  │
│  ├─ Services: externalRidesApi.ts                              │
│  └─ Types: external-ride.types.ts                              │
│                                                                 │
│  URL Routing                                                     │
│  └─ /registrar-viaje/:driverSlug → ExternalRideFormPage        │
│                                                                 │
│  Cloud Functions                                                 │
│  └─ Trigger: onExternalRideCreated (notification)              │
│                                                                 │
│  Firebase/Firestore                                             │
│  └─ Collection: drivers/{driverId}/driver_rides                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## User Stories

1. **As a driver**, I can access my personal form link so that I can register rides from any device
2. **As a driver**, I can enter ride details step by step so that the process is simple
3. **As a driver**, I can record tip information so that my total earnings are accurate
4. **As a driver**, I can see commission calculations so that I understand my net income
5. **As an admin**, I receive notifications when drivers register external rides

## Wizard Steps

| Step | Field | Input Type |
|------|-------|------------|
| 1 | Date & Time | Date picker + Time input |
| 2 | Origin Address | Text input |
| 3 | Destination Address | Text input |
| 4 | Fare Amount | Currency input (COP) |
| 5 | Request Source | Select (WhatsApp, phone, referral, other) |
| 6 | Trip Reason | Select (personal, work, emergency, other) |
| 7 | Time of Day | Select (morning, afternoon, evening, night) |
| 8 | Recurring | Toggle (yes/no) |
| 9 | Payment Method | Select (cash, Nequi, DaviPlata, Bancolombia, other) |
| 10 | Tip Received | Toggle (yes/no) |
| 11 | Tip Amount | Currency input (if tip received) |
| 12 | Comments | Text area (optional) |
| 13 | Confirmation | Review all data + Submit |

## Key Files

### Frontend

| File | Purpose |
|------|---------|
| `web/src/pages/ExternalRideFormPage.tsx` | Main public page |
| `web/src/features/external-rides/components/ExternalRideWizard/` | Wizard components |
| `web/src/features/external-rides/services/externalRidesApi.ts` | API client |
| `web/src/features/external-rides/types/external-ride.types.ts` | TypeScript types |

### Cloud Functions

| File | Purpose |
|------|---------|
| `web/functions/src/triggers/onExternalRideCreated.ts` | Notification trigger |

## Data Model

### Form Data

```typescript
interface ExternalRideFormData {
  // Required fields
  date: string;                    // ISO date
  time: string;                    // HH:MM
  origin_address: string;
  destination_address: string;
  tarifa: number;                  // Fare in COP

  // Context fields
  request_source: 'whatsapp' | 'phone' | 'referral' | 'other';
  trip_reason: 'personal' | 'work' | 'emergency' | 'other';
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
  is_recurring: boolean;

  // Payment
  payment_method: 'cash' | 'nequi' | 'daviplata' | 'bancolombia' | 'other';

  // Tip
  has_tip: boolean;
  tip_amount?: number;

  // Optional
  comments?: string;
}
```

### Saved Ride (Firestore)

```typescript
interface ExternalRide {
  id: string;
  driver_id: string;

  // From form
  date: Timestamp;
  time: string;
  origin_address: string;
  destination_address: string;

  // Financial (calculated)
  tarifa: number;
  comision_servicio: number;       // tarifa * 0.095
  comision_porcentaje: number;     // 9.5
  tip_amount: number;
  mis_ingresos: number;            // tarifa - comision + tip

  // Metadata
  category: 'external';
  request_source: string;
  trip_reason: string;
  payment_method: string;
  comments?: string;

  // Status
  status: 'completed';

  // Timestamps
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

## Commission Calculation

```typescript
const COMMISSION_RATE = 0.095;  // 9.5%

function calculateFinancials(tarifa: number, tipAmount: number = 0) {
  const commission = Math.round(tarifa * COMMISSION_RATE);
  const netEarnings = tarifa - commission + tipAmount;

  return {
    tarifa,
    comision_servicio: commission,
    comision_porcentaje: 9.5,
    tip_amount: tipAmount,
    mis_ingresos: netEarnings,
  };
}
```

## Public URL Access

The form is accessible without authentication using driver slugs:

```
https://app.wegocol.com/registrar-viaje/juan-perez
                                        └── driver slug
```

The page resolves the slug to a driver ID:

```typescript
useEffect(() => {
  async function resolveDriver() {
    const q = query(
      collection(db, 'drivers'),
      where('slug', '==', driverSlug)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      setError('Conductor no encontrado');
      return;
    }

    setDriverId(snapshot.docs[0].id);
  }
  resolveDriver();
}, [driverSlug]);
```

## Notification Trigger

When an external ride is created, a Cloud Function triggers:

```typescript
export const onExternalRideCreated = onDocumentCreated(
  'drivers/{driverId}/driver_rides/{rideId}',
  async (event) => {
    const ride = event.data?.data();

    // Only trigger for external rides
    if (ride?.category !== 'external') return;

    // Create admin notification
    await createNotification({
      type: 'external_driver_ride',
      title: 'Nuevo viaje registrado',
      message: `${driverName} registró un viaje a ${ride.destination_address}`,
      source_collection: 'driver_rides',
      source_document_id: event.params.rideId,
    });
  }
);
```

## Common Issues and Solutions

### Issue: Form not loading for slug

**Symptoms:** "Conductor no encontrado" error

**Root Cause:** Slug doesn't exist or has typo

**Solution:** Verify slug in Firestore Console:
```
Firestore > drivers > [document] > slug field
```

### Issue: Ride not appearing in dashboard

**Symptoms:** External ride saved but not showing

**Root Cause:** `category` field not set to 'external' or date filter excluding it

**Solution:** Check ride document has correct category:
```typescript
{
  category: 'external',  // Must be exactly this
  date: Timestamp,       // Must be within filter range
}
```

### Issue: Commission calculation wrong

**Symptoms:** Net earnings don't match expected

**Root Cause:** Using incorrect commission rate or not rounding

**Solution:** Use consistent calculation:
```typescript
const commission = Math.round(tarifa * 0.095);  // Round to avoid decimals
```

## Related Documentation

- [User Management](./USER_MANAGEMENT.md) - Driver slug management
- [Ride Management](./RIDE_MANAGEMENT.md) - Where external rides appear
- [Notifications](./NOTIFICATIONS.md) - Admin notification system

---

**Last Updated**: January 2025
