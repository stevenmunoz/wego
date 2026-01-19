# User Management

> Admin interface for managing users, drivers, and role assignments

## Overview

The User Management feature provides administrators with complete control over system users. It supports creating new users, assigning roles (admin or driver), managing driver profiles with unique slugs, and controlling user status.

Drivers receive a unique URL slug that enables the External Ride Registration feature - passengers or dispatchers can access a public form at `/registrar-viaje/{slug}` to register rides for that driver.

**Key Capabilities:**
- User creation with email/password
- Role assignment (admin, driver)
- Driver profile management with phone numbers
- Unique slug generation for public ride forms
- Copy share link functionality
- Status toggling (active/inactive)
- Tabbed interface (Users, Drivers, Admins)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  USER MANAGEMENT ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend (React/TypeScript)                                    │
│  ├─ Page: UserManagementPage.tsx                               │
│  ├─ Components:                                                 │
│  │   ├─ UsersTable (all users list)                            │
│  │   ├─ DriversTable (drivers with slugs)                      │
│  │   ├─ AdminsTable (admin users)                              │
│  │   └─ CreateUserModal (user creation form)                   │
│  ├─ Hook: useUsers                                             │
│  └─ Service: auth.ts (Firebase Auth operations)                │
│                                                                 │
│  Firebase                                                        │
│  ├─ Authentication: Email/password users                        │
│  ├─ Firestore: users/{userId}                                  │
│  └─ Firestore: drivers/{driverId}                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## User Stories

1. **As an admin**, I can create new users so that drivers can access the system
2. **As an admin**, I can assign roles so that users have appropriate permissions
3. **As an admin**, I can view all drivers so that I know who is registered
4. **As an admin**, I can copy a driver's share link so that I can distribute it
5. **As an admin**, I can deactivate users so that they lose system access

## Key Files

### Frontend

| File | Purpose |
|------|---------|
| `web/src/pages/UserManagementPage.tsx` | Main management page (admin only) |
| `web/src/hooks/useUsers.ts` | User data and operations hook |
| `web/src/core/firebase/auth.ts` | Firebase Auth operations |

## Data Model

### Firestore Collection: `users`

```typescript
interface User {
  id: string;                      // Firebase Auth UID
  email: string;
  full_name: string;
  role: 'admin' | 'driver';
  status: 'active' | 'inactive';
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### Firestore Collection: `drivers`

```typescript
interface Driver {
  id: string;                      // Same as user ID
  name: string;
  email: string;
  phone: string;                   // Required for drivers
  slug: string;                    // Unique URL slug (e.g., "juan-perez")
  status: 'active' | 'inactive';
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

## Driver Slug System

Each driver gets a unique slug used for the public ride registration form:

```typescript
// Slug generation from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Remove accents
    .replace(/[^a-z0-9]+/g, '-')       // Replace special chars
    .replace(/^-|-$/g, '');            // Trim dashes
}

// Usage
const slug = generateSlug('Juan Pérez');  // "juan-perez"
// Public URL: https://app.wegocol.com/registrar-viaje/juan-perez
```

## User Creation Flow

```typescript
async function createUser(data: CreateUserData) {
  // 1. Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    data.email,
    data.password
  );

  // 2. Create Firestore user document
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    email: data.email,
    full_name: data.name,
    role: data.role,
    status: 'active',
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  // 3. If driver, create driver document
  if (data.role === 'driver') {
    await setDoc(doc(db, 'drivers', userCredential.user.uid), {
      name: data.name,
      email: data.email,
      phone: data.phone,
      slug: generateSlug(data.name),
      status: 'active',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  }
}
```

## Role-Based Access

| Feature | Admin | Driver |
|---------|-------|--------|
| View all users | Yes | No |
| Create users | Yes | No |
| Modify roles | Yes | No |
| View own profile | Yes | Yes |
| Access User Management page | Yes | No (redirected) |

## Common Issues and Solutions

### Issue: Duplicate slug error

**Symptoms:** User creation fails with "slug already exists"

**Root Cause:** Another driver has the same generated slug

**Solution:** Append a number to make unique:
```typescript
async function getUniqueSlug(baseName: string): Promise<string> {
  let slug = generateSlug(baseName);
  let counter = 1;

  while (await slugExists(slug)) {
    slug = `${generateSlug(baseName)}-${counter}`;
    counter++;
  }

  return slug;
}
```

### Issue: User can't log in after creation

**Symptoms:** "User not found" or "Wrong password" error

**Root Cause:** Email verification required or password not meeting requirements

**Solution:** Check Firebase Auth settings:
- Disable email verification requirement for testing
- Ensure password meets minimum requirements (6+ characters)

### Issue: Role change not reflecting

**Symptoms:** User sees old permissions after role update

**Root Cause:** Auth token not refreshed

**Solution:** Force token refresh:
```typescript
await user.getIdToken(true);  // Force refresh
window.location.reload();     // Reload app
```

## Related Documentation

- [Authentication](./AUTHENTICATION.md) - Auth system details
- [External Rides](./EXTERNAL_RIDES.md) - Public form using driver slugs

---

**Last Updated**: January 2025
