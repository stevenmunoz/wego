# Authentication

> Firebase Authentication with role-based access control

## Overview

The Authentication feature provides secure user authentication using Firebase Auth with email/password and Google OAuth. Role-based access control (RBAC) ensures users only see features appropriate to their role (admin or driver).

Authentication state is managed via Zustand store with persistence. Protected routes redirect unauthenticated users to login and unauthorized users to the dashboard.

**Key Capabilities:**
- Email/password authentication
- Google OAuth integration
- Role-based access control (admin, driver)
- Session persistence across browser sessions
- Protected route components
- Auto-redirect on auth state changes
- Token refresh handling

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  AUTHENTICATION ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend (React/TypeScript)                                    │
│  ├─ Pages:                                                      │
│  │   ├─ LoginPage.tsx                                          │
│  │   └─ RegisterPage.tsx                                       │
│  ├─ Components:                                                 │
│  │   ├─ ProtectedRoute                                         │
│  │   └─ GoogleSignInButton                                     │
│  ├─ Hooks:                                                      │
│  │   ├─ useLogin                                               │
│  │   ├─ useRegister                                            │
│  │   └─ useGoogleLogin                                         │
│  ├─ Store: auth-store.ts (Zustand)                             │
│  └─ Service: auth.ts                                           │
│                                                                 │
│  Firebase                                                        │
│  ├─ Firebase Authentication                                     │
│  └─ Firestore: users/{userId} (role storage)                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## User Stories

1. **As a user**, I can log in with email/password so that I access my account
2. **As a user**, I can log in with Google so that I don't need to remember passwords
3. **As a user**, I stay logged in across sessions so that I don't need to re-authenticate
4. **As an admin**, I can access admin-only features like reporting
5. **As a driver**, I am redirected away from admin features

## Key Files

### Frontend

| File | Purpose |
|------|---------|
| `web/src/pages/LoginPage.tsx` | Login form page |
| `web/src/pages/RegisterPage.tsx` | Registration page |
| `web/src/features/auth/hooks/use-login.ts` | Login hook |
| `web/src/features/auth/hooks/use-register.ts` | Registration hook |
| `web/src/features/auth/hooks/use-google-login.ts` | Google OAuth hook |
| `web/src/core/firebase/auth.ts` | Firebase Auth operations |
| `web/src/core/store/auth-store.ts` | Zustand auth store |

## Data Model

### User Roles

```typescript
type UserRole = 'admin' | 'driver';
```

### Firestore: `users/{userId}`

```typescript
interface User {
  id: string;                      // Firebase Auth UID
  email: string;
  full_name: string;
  role: UserRole;
  status: 'active' | 'inactive';
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### Auth Store (Zustand)

```typescript
interface AuthState {
  user: FirebaseUser | null;
  userProfile: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Computed
  isAdmin: boolean;
  isDriver: boolean;

  // Actions
  setUser: (user: FirebaseUser | null) => void;
  setUserProfile: (profile: User | null) => void;
  logout: () => Promise<void>;
}
```

## Authentication Flow

### Email/Password Login

```typescript
async function login(email: string, password: string) {
  // 1. Sign in with Firebase Auth
  const credential = await signInWithEmailAndPassword(auth, email, password);

  // 2. Fetch user profile from Firestore
  const userDoc = await getDoc(doc(db, 'users', credential.user.uid));
  const profile = userDoc.data() as User;

  // 3. Update auth store
  setUser(credential.user);
  setUserProfile(profile);

  // 4. Redirect based on role
  navigate(profile.role === 'admin' ? '/reportes' : '/dashboard');
}
```

### Google OAuth

```typescript
async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);

  // Check if user exists in Firestore
  const userDoc = await getDoc(doc(db, 'users', result.user.uid));

  if (!userDoc.exists()) {
    // New user - create profile with default role
    await setDoc(doc(db, 'users', result.user.uid), {
      email: result.user.email,
      full_name: result.user.displayName,
      role: 'driver',  // Default role
      status: 'active',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  }
}
```

## Protected Routes

```tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, userProfile } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && userProfile?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Usage in routes
<Route
  path="/reportes"
  element={
    <ProtectedRoute requiredRole="admin">
      <ReportingPage />
    </ProtectedRoute>
  }
/>
```

## Role-Based Access Matrix

| Feature | Route | Admin | Driver |
|---------|-------|-------|--------|
| Dashboard | `/dashboard` | All rides | Own rides |
| Vehicles | `/vehiculos` | All | Own |
| Vehicle Finances | `/finanzas-vehiculos` | All | Own |
| Reporting | `/reportes` | Yes | Redirect |
| AI Insights | `/insights` | Yes | Redirect |
| User Management | `/usuarios` | Yes | Redirect |
| Finance Categories | `/categorias-finanzas` | Yes | Redirect |
| InDriver Import | `/importar-indriver` | Yes | Yes |
| External Ride Form | `/registrar-viaje/:slug` | N/A | Public |

## Session Persistence

Auth state persists using Firebase's built-in persistence:

```typescript
// Set persistence on app initialization
import { browserLocalPersistence, setPersistence } from 'firebase/auth';

setPersistence(auth, browserLocalPersistence);
```

## Common Issues and Solutions

### Issue: User stuck on login page

**Symptoms:** Auth state not loading after refresh

**Root Cause:** `onAuthStateChanged` listener not set up

**Solution:** Initialize listener in app root:
```typescript
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const profile = await fetchUserProfile(firebaseUser.uid);
      setUser(firebaseUser);
      setUserProfile(profile);
    } else {
      setUser(null);
      setUserProfile(null);
    }
    setIsLoading(false);
  });
  return () => unsubscribe();
}, []);
```

### Issue: Role not updating after assignment

**Symptoms:** User sees old permissions after admin changes role

**Root Cause:** Token not refreshed with new claims

**Solution:** Force token refresh:
```typescript
await user.getIdToken(true);
window.location.reload();
```

### Issue: Google login creates duplicate accounts

**Symptoms:** Same Google user has multiple Firebase accounts

**Root Cause:** Email already registered with password auth

**Solution:** Link accounts or check existing before creation:
```typescript
const methods = await fetchSignInMethodsForEmail(auth, email);
if (methods.length > 0) {
  // Account exists, handle accordingly
}
```

## Security Considerations

1. **Always verify role server-side**: Don't trust client-side role checks for sensitive operations
2. **Use Firestore Security Rules**: Enforce access control at database level
3. **Token expiration**: Firebase tokens expire after 1 hour, auto-refresh handles this
4. **Never expose admin endpoints**: Protect Cloud Functions with auth checks

## Related Documentation

- [User Management](./USER_MANAGEMENT.md) - User CRUD operations
- [Cloud Functions](./CLOUD_FUNCTIONS.md) - Server-side auth verification

---

**Last Updated**: January 2025
