# Ride Management

> Central dashboard for tracking and managing all transportation rides across the platform

## Overview

The Ride Management feature is the core operational hub of WeGo, providing real-time visibility into all rides across the platform. Administrators can view rides from all drivers, while drivers see only their own ride history.

The dashboard supports multiple data sources (InDriver imports, external registrations, independent rides) and provides filtering, sorting, and status management capabilities. Financial data including fares, commissions, and net earnings are displayed for each ride.

**Key Capabilities:**
- Real-time ride tracking with Firestore subscriptions
- Role-based access (admin sees all, driver sees own)
- Date range filtering with presets (today, this week, this month, last 30 days)
- Status filtering (completed, cancelled, pending)
- Source filtering (InDriver, external, independent)
- Driver filtering (admin only)
- Delete ride functionality (admin only, with confirmation)
- Delete all rides (dev environment only)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   RIDE MANAGEMENT ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend (React/TypeScript)                                    │
│  ├─ Page: DashboardPage.tsx                                    │
│  ├─ Components:                                                 │
│  │   ├─ RidesTable (sortable, filterable table)                │
│  │   ├─ DateRangePicker (date filtering)                       │
│  │   └─ FilterDropdowns (status, source, driver)               │
│  ├─ Hooks:                                                      │
│  │   ├─ useAdminRides (all rides for admins)                   │
│  │   └─ useDriverRides (driver's own rides)                    │
│  └─ Services: firestore.ts (subscriptions and CRUD)            │
│                                                                 │
│  Firebase/Firestore                                             │
│  ├─ Collection: drivers/{driverId}/driver_rides/{rideId}       │
│  └─ Collection Group Query: driver_rides (for admin view)      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## User Stories

1. **As an admin**, I can view all rides from all drivers so that I can monitor platform activity
2. **As a driver**, I can view my own ride history so that I can track my earnings
3. **As an admin**, I can filter rides by date range so that I can analyze specific periods
4. **As an admin**, I can filter rides by status so that I can focus on completed or cancelled rides
5. **As an admin**, I can filter rides by source so that I can see InDriver vs external rides
6. **As an admin**, I can delete individual rides (with confirmation) so that I can remove test data
7. **As an admin in dev environment**, I can delete all rides for testing purposes

## Key Files

### Frontend

| File | Purpose |
|------|---------|
| `web/src/pages/DashboardPage.tsx` | Main dashboard page with filters and table |
| `web/src/pages/DashboardPage.css` | Dashboard-specific styles |
| `web/src/components/RidesTable/RidesTable.tsx` | Sortable rides table with actions |
| `web/src/components/RidesTable/RidesTable.css` | Table styles including badges |
| `web/src/hooks/useAdminRides.ts` | Hook for admin ride data with delete functions |
| `web/src/hooks/useDriverRides.ts` | Hook for driver's own ride data |
| `web/src/core/firebase/firestore.ts` | Firestore operations (subscribe, delete) |

## Data Model

### Firestore Collection: `drivers/{driverId}/driver_rides`

```typescript
interface DriverRide {
  id: string;
  driver_id: string;
  vehicle_id?: string;

  // Ride details
  date: Timestamp;
  time: string;                    // "14:30"
  destination_address: string;
  duration_value?: number;
  duration_unit?: 'min' | 'hr';
  distance_value?: number;
  distance_unit?: 'km' | 'metro';

  // Passenger
  passenger_name?: string;
  rating_given?: number;           // 1-5

  // Status
  status: 'completed' | 'cancelled_by_passenger' | 'cancelled_by_driver';
  cancellation_reason?: string;

  // Financial
  tarifa: number;                  // Base fare in COP
  total_recibido: number;          // Total received
  comision_servicio: number;       // Platform commission
  comision_porcentaje: number;     // Commission % (typically 9.5)
  iva_pago_servicio: number;       // IVA tax
  total_pagado: number;            // Total paid to platform
  mis_ingresos: number;            // Net driver earnings

  // Payment
  payment_method: 'cash' | 'nequi' | 'other';
  payment_method_label: string;

  // Source tracking
  category: 'indriver' | 'external' | 'independent' | 'other';

  // Metadata
  extracted_at?: Timestamp;
  imported_at?: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### Admin Ride View (Aggregated)

```typescript
interface AdminRide extends DriverRide {
  // Additional fields for admin view
  driverName: string;
  driverEmail: string;
  docPath: string;                 // Full Firestore path for deletion
}
```

## Configuration

### Environment-Based Features

| Feature | DEV | PROD |
|---------|-----|------|
| Delete individual rides | Admin only | Admin only |
| Delete all rides button | Visible | Hidden |

Detection logic:
```typescript
const isDev = import.meta.env.VITE_FIREBASE_PROJECT_ID?.includes('dev');
```

## Common Issues and Solutions

### Issue: Rides not appearing in real-time

**Symptoms:** New rides don't show until page refresh

**Root Cause:** Firestore subscription not set up correctly

**Solution:** Ensure `onSnapshot` is used with proper cleanup:
```typescript
useEffect(() => {
  const unsubscribe = onSnapshot(query, (snapshot) => {
    setRides(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
  return () => unsubscribe();
}, []);
```

### Issue: Admin sees no rides

**Symptoms:** Admin dashboard shows empty table

**Root Cause:** Collection group query requires composite index

**Solution:** Deploy Firestore indexes:
```bash
firebase deploy --only firestore:indexes
```

### Issue: Delete button not appearing

**Symptoms:** No delete option visible for admin

**Root Cause:** `showDeleteButton` prop not passed to RidesTable

**Solution:** Ensure admin role check and prop passing:
```typescript
<RidesTable
  rides={rides}
  showDeleteButton={isAdmin}
  onDeleteRide={handleDeleteRide}
/>
```

## Related Documentation

- [InDriver Import](./INDRIVER_IMPORT.md) - How rides are imported from InDriver
- [External Rides](./EXTERNAL_RIDES.md) - Manual ride registration
- [Reporting Dashboard](./REPORTING_DASHBOARD.md) - Analytics on ride data

---

**Last Updated**: January 2025
