# Vehicle Management

> Fleet vehicle tracking with document uploads and driver assignment

## Overview

The Vehicle Management feature enables tracking of all fleet vehicles in the WeGo platform. Owners can register vehicles with details like plate number, brand, model, and year. The system supports document uploads for Colombian regulatory requirements (SOAT insurance, Tecnomecanica inspection) and vehicle photos.

Administrators can view all vehicles and assign drivers, while drivers can only see and manage their own assigned vehicles. Each vehicle can be marked as "primary" for a driver and includes image compression for efficient storage.

**Key Capabilities:**
- Vehicle CRUD operations with validation
- Image upload with automatic compression
- SOAT and Tecnomecanica document uploads
- Driver assignment (admin only)
- Primary vehicle designation
- Vehicle type categorization (car, motorcycle, van, truck)
- Firebase Storage integration for file management

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 VEHICLE MANAGEMENT ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend (React/TypeScript)                                    │
│  ├─ Page: VehiclesPage.tsx                                     │
│  ├─ Components:                                                 │
│  │   ├─ VehiclesTable (list with actions)                      │
│  │   ├─ VehicleForm (create/edit modal)                        │
│  │   └─ VehicleCard (detail view)                              │
│  ├─ Hooks:                                                      │
│  │   ├─ useDriverVehicles (driver's vehicles)                  │
│  │   └─ useAllVehicles (admin view)                            │
│  └─ Services: vehicles.ts (Firestore + Storage)                │
│                                                                 │
│  Firebase                                                        │
│  ├─ Firestore: vehicles/{vehicleId}                            │
│  └─ Storage: vehicles/{vehicleId}/*.{jpg,pdf}                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## User Stories

1. **As a vehicle owner**, I can register a new vehicle with its details so that it appears in the system
2. **As a vehicle owner**, I can upload vehicle photos so that the vehicle is visually identified
3. **As a vehicle owner**, I can upload SOAT and Tecnomecanica documents so that compliance is tracked
4. **As an admin**, I can assign a driver to a vehicle so that rides are attributed correctly
5. **As a driver**, I can set a vehicle as my primary vehicle so that it's used by default

## Key Files

### Frontend

| File | Purpose |
|------|---------|
| `web/src/pages/VehiclesPage.tsx` | Main vehicles page with table and modals |
| `web/src/components/VehicleForm/VehicleForm.tsx` | Create/edit vehicle form |
| `web/src/components/VehiclesTable/VehiclesTable.tsx` | Vehicle list table |
| `web/src/hooks/useDriverVehicles.ts` | Driver's vehicles hook |
| `web/src/hooks/useAllVehicles.ts` | All vehicles hook (admin) |
| `web/src/core/firebase/vehicles.ts` | Vehicle CRUD operations |

## Data Model

### Firestore Collection: `vehicles`

```typescript
interface Vehicle {
  id: string;
  owner_id: string;                // User who owns the vehicle
  assigned_driver_id?: string;     // Driver currently using the vehicle

  // Vehicle details
  plate: string;                   // License plate (e.g., "ABC123")
  brand: string;                   // Make (e.g., "Toyota")
  model: string;                   // Model (e.g., "Corolla")
  year: number;                    // Year (e.g., 2020)
  color: string;                   // Color (e.g., "Blanco")
  vehicle_type: VehicleType;       // Type category

  // Status
  is_primary: boolean;             // Primary vehicle for driver
  status: 'active' | 'inactive' | 'maintenance';

  // Documents (Storage URLs)
  photo_url?: string;              // Vehicle photo
  soat_url?: string;               // SOAT insurance document
  tecnomecanica_url?: string;      // Tecnomecanica certificate

  // Financial (for rentals)
  weekly_rental_amount?: number;   // Weekly rental cost in COP

  // Metadata
  created_at: Timestamp;
  updated_at: Timestamp;
}

type VehicleType = 'car' | 'motorcycle' | 'van' | 'truck' | 'suv' | 'other';
```

### Storage Structure

```
Firebase Storage
└── vehicles/
    └── {vehicleId}/
        ├── photo.jpg          # Compressed vehicle photo
        ├── soat.pdf           # SOAT insurance document
        └── tecnomecanica.pdf  # Tecnomecanica certificate
```

## Image Compression

Vehicle photos are automatically compressed before upload:

```typescript
// Compression settings
const options = {
  maxSizeMB: 0.5,           // Max 500KB
  maxWidthOrHeight: 1200,   // Max dimension
  useWebWorker: true,
};

const compressedFile = await imageCompression(file, options);
```

## Common Issues and Solutions

### Issue: Image upload fails silently

**Symptoms:** Photo doesn't appear after upload, no error shown

**Root Cause:** Storage rules may block upload or compression fails

**Solution:** Check Storage rules allow authenticated writes:
```javascript
match /vehicles/{vehicleId}/{allPaths=**} {
  allow read: if request.auth != null;
  allow write: if request.auth != null &&
    (isVehicleOwner(vehicleId) || isAdmin());
}
```

### Issue: Vehicle not appearing for driver

**Symptoms:** Driver can't see assigned vehicle

**Root Cause:** `assigned_driver_id` not matching user's UID

**Solution:** Verify assignment in Firestore Console and check query:
```typescript
const q = query(
  collection(db, 'vehicles'),
  where('assigned_driver_id', '==', userId)
);
```

## Related Documentation

- [Vehicle Finances](./VEHICLE_FINANCES.md) - Track income/expenses per vehicle
- [User Management](./USER_MANAGEMENT.md) - Driver assignment management

---

**Last Updated**: January 2025
