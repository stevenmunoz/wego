# WeGo Security & Code Quality Audit Report

**Date:** December 22, 2024
**Auditor:** Claude Code Security Scanner
**Scope:** Full codebase analysis (frontend, backend, infrastructure)
**Branch:** columbia

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Critical Issues](#critical-issues)
3. [High Priority Issues](#high-priority-issues)
4. [Medium Priority Issues](#medium-priority-issues)
5. [Low Priority Issues](#low-priority-issues)
6. [Remediation Tickets](#remediation-tickets)
7. [Appendix: Files Analyzed](#appendix-files-analyzed)

---

## Executive Summary

### Overview

This security audit analyzed the WeGo transportation management platform codebase, including:
- **Frontend:** React 18 + TypeScript (Vite)
- **Backend:** Python 3.11 + FastAPI
- **Database:** Firebase Firestore
- **Auth:** Firebase Authentication + JWT
- **Infrastructure:** GitHub Actions CI/CD

### Risk Assessment

| Severity | Count | Description |
|----------|-------|-------------|
| **CRITICAL** | 8 | Immediate exploitation risk, data breach possible |
| **HIGH** | 15 | Significant security gaps, should fix this week |
| **MEDIUM** | 28 | Security improvements needed, fix within 2 weeks |
| **LOW** | 16 | Best practice improvements, fix within 1 month |

### Top Risks Identified

1. **Secrets Exposure:** API keys and JWT secrets committed to version control
2. **Missing Authentication:** Critical backend endpoints accessible without auth
3. **Code Injection:** `eval()` usage in backend tool executor
4. **Overly Permissive Firestore:** Public read access to sensitive collections
5. **Vulnerable Dependencies:** axios CVE in mobile, outdated Python packages

### Positive Findings

- No XSS vulnerabilities (no `dangerouslySetInnerHTML`)
- No SQL injection (Firestore SDK used properly)
- Proper password hashing with bcrypt
- Good input validation with Pydantic/Zod
- CORS origins properly whitelisted

---

## Critical Issues

### CRIT-001: Hardcoded Firebase API Keys in Version Control

**Severity:** CRITICAL
**Category:** Secrets Management
**CVSS Score:** 9.1 (Critical)

**Location:**
- `web/.env` (lines 9-14)

**Current State:**
```
VITE_FIREBASE_API_KEY=***REDACTED_FIREBASE_API_KEY_2***
VITE_FIREBASE_AUTH_DOMAIN=wego-dev-a5a13.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=wego-dev-a5a13
VITE_FIREBASE_STORAGE_BUCKET=wego-dev-a5a13.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=663854123018
VITE_FIREBASE_APP_ID=1:663854123018:web:9a5342010401515b48b7f3
```

**Risk:**
- API key exposed in git history
- Attackers can use key to access Firebase resources
- Potential data exfiltration or quota exhaustion
- Key cannot be easily rotated without project recreation

**Evidence:**
- File is tracked in git (not in .gitignore effectively)
- Key appears in commit history

**Remediation:**
1. Immediately restrict API key in Google Cloud Console
2. Remove file from git history using BFG Repo-Cleaner
3. Generate new Firebase project or rotate keys
4. Ensure .env files are properly gitignored

---

### CRIT-002: JWT Secrets Committed to Repository

**Severity:** CRITICAL
**Category:** Secrets Management
**CVSS Score:** 9.8 (Critical)

**Location:**
- `.conductor/columbia/backend/.env` (lines 29-30)
- `.conductor/dublin-v1/backend/.env` (lines 29-30)

**Current State:**
```
SECRET_KEY=***REDACTED_SECRET_KEY***
JWT_SECRET=***REDACTED_JWT_SECRET***
```

**Risk:**
- Attacker can forge valid JWT tokens
- Complete authentication bypass possible
- All user sessions compromised

**Remediation:**
1. Regenerate all JWT secrets immediately
2. Invalidate all existing tokens (force re-login)
3. Remove secrets from git history
4. Use GitHub Secrets for CI/CD injection only

---

### CRIT-003: Unauthenticated InDriver Extraction Endpoints

**Severity:** CRITICAL
**Category:** Authentication
**CVSS Score:** 8.6 (High)

**Location:**
- `backend/src/presentation/api/v1/endpoints/indriver/extraction.py`

**Affected Endpoints:**
| Endpoint | Line | Method | Auth Required |
|----------|------|--------|---------------|
| `/indriver/extract` | 29-31 | POST | NO |
| `/indriver/import` | 82-83 | POST | NO |
| `/indriver/export` | 135-136 | POST | NO |
| `/indriver/stats` | 189-190 | GET | NO |
| `/indriver/validate` | 206-207 | POST | NO |

**Current State:**
```python
@router.post("/extract", response_model=ExtractResponse)
async def extract_from_files(
    files: list[UploadFile] = File(...),
) -> ExtractResponse:
    # NO authentication check!
```

**Risk:**
- Anyone can upload files and extract ride data
- Data exfiltration possible
- DoS through large file uploads
- Import fake ride data into system

**Remediation:**
```python
@router.post("/extract", response_model=ExtractResponse)
async def extract_from_files(
    files: list[UploadFile] = File(...),
    current_user_id: UUID = Depends(get_current_user_id),  # ADD THIS
) -> ExtractResponse:
```

---

### CRIT-004: Code Injection via eval() in Tool Executor

**Severity:** CRITICAL
**Category:** Injection
**CVSS Score:** 9.8 (Critical)

**Location:**
- `backend/src/infrastructure/agents/tool_executor.py:82`

**Current State:**
```python
def _execute_calculator(self, expression: str) -> str:
    try:
        result = eval(expression, {"__builtins__": {}}, {})
        return str(result)
```

**Risk:**
- Arbitrary Python code execution
- `__builtins__: {}` restriction is bypassable
- Remote code execution if expression comes from user input
- Complete system compromise possible

**Proof of Concept Bypass:**
```python
# Even with __builtins__: {}, this works:
eval("().__class__.__bases__[0].__subclasses__()")
```

**Remediation:**
```python
# Option 1: Use ast.literal_eval (safe for literals only)
import ast
result = ast.literal_eval(expression)

# Option 2: Use sympy for math expressions
from sympy import sympify
result = sympify(expression).evalf()

# Option 3: Use numexpr for numeric expressions
import numexpr as ne
result = ne.evaluate(expression)
```

---

### CRIT-005: Public Read Access on Sensitive Firestore Collections

**Severity:** CRITICAL
**Category:** Access Control
**CVSS Score:** 7.5 (High)

**Location:**
- `web/firestore.rules` (lines 10, 40, 104)

**Current State:**
```javascript
match /drivers/{driverId} {
  allow read: if true;  // LINE 10 - ANYONE CAN READ ALL DRIVERS
}

match /users/{userId} {
  allow read: if true;  // LINE 40 - ANYONE CAN READ ALL USERS
}

match /vehicles/{vehicleId} {
  allow read: if true;  // LINE 104 - ANYONE CAN READ ALL VEHICLES
}
```

**Risk:**
- All user PII exposed (names, emails, phones)
- Driver information publicly accessible
- Vehicle details exposed
- Enumeration attacks possible
- GDPR/privacy law violations

**Remediation:**
```javascript
match /drivers/{driverId} {
  allow read: if request.auth != null;
  // Or more restrictive:
  allow read: if request.auth != null &&
    (request.auth.uid == driverId || isAdmin());
}
```

---

### CRIT-006: Firestore vehicleOwnershipCheck Logic Flaw

**Severity:** CRITICAL
**Category:** Access Control
**CVSS Score:** 8.1 (High)

**Location:**
- `web/firestore.rules` (lines 157-161)

**Current State:**
```javascript
function vehicleOwnershipCheck(vehicleId) {
  return !exists(/databases/$(database)/documents/vehicles/$(vehicleId)) ||
    get(...).data.owner_id == request.auth.uid ||
    get(...).data.assigned_driver_id == request.auth.uid;
}
```

**Bug:**
- `!exists(...)` returns `TRUE` if vehicle doesn't exist
- User can access income/expenses of ANY non-existent vehicleId
- Allows writing data to arbitrary vehicle subcollections

**Remediation:**
```javascript
function vehicleOwnershipCheck(vehicleId) {
  return exists(/databases/$(database)/documents/vehicles/$(vehicleId)) &&
    (get(...).data.owner_id == request.auth.uid ||
     get(...).data.assigned_driver_id == request.auth.uid);
}
```

---

### CRIT-007: Role Hardcoded in Frontend Auth Store

**Severity:** CRITICAL
**Category:** Authorization
**CVSS Score:** 7.2 (High)

**Location:**
- `web/src/core/store/auth-store.ts:29`

**Current State:**
```typescript
set({
  user: {
    id: user.uid,
    email: user.email,
    role: UserRole.USER,  // ALWAYS USER - IGNORES ACTUAL ROLE
  },
});
```

**Risk:**
- Frontend cannot enforce role-based UI restrictions
- All users appear as regular users, even admins
- Admin-only features may be hidden from actual admins
- Relies entirely on backend for RBAC (single point of failure)

**Remediation:**
```typescript
// Option 1: Read from Firebase custom claims
const token = await user.getIdTokenResult();
const role = token.claims.role || UserRole.USER;

// Option 2: Fetch from backend
const userProfile = await fetchUserProfile(user.uid);
const role = userProfile.role;
```

---

### CRIT-008: Debug Mode Enabled in Production Config

**Severity:** CRITICAL
**Category:** Configuration
**CVSS Score:** 5.3 (Medium)

**Location:**
- `backend/src/core/config.py:14`

**Current State:**
```python
class Settings(BaseSettings):
    DEBUG: bool = True  # DEFAULT IS TRUE!
```

**Risk:**
- Stack traces exposed to clients
- Internal file paths revealed
- Library versions disclosed
- Helps attackers map the system

**Evidence in Code:**
```python
# extraction.py:79
raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")
```

**Remediation:**
```python
class Settings(BaseSettings):
    DEBUG: bool = False  # Default to False

    @field_validator('DEBUG')
    def validate_debug(cls, v):
        if v and os.getenv('ENVIRONMENT') == 'production':
            raise ValueError('DEBUG cannot be True in production')
        return v
```

---

## High Priority Issues

### HIGH-001: Missing Rate Limiting on Authentication Endpoints

**Severity:** HIGH
**Category:** Authentication
**Location:** `backend/src/presentation/api/v1/endpoints/auth.py`

**Issue:** No rate limiting on login, token refresh, or registration endpoints.

**Risk:** Brute force attacks, credential stuffing, DoS.

**Remediation:**
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, ...):
```

---

### HIGH-002: JWT Tokens Not Revocable

**Severity:** HIGH
**Category:** Authentication
**Location:** `backend/src/presentation/api/v1/endpoints/auth.py:41-49`

**Current State:**
```python
@router.post("/logout")
async def logout() -> MessageResponseDTO:
    # Note: Since we're using stateless JWT, logout is handled client-side
    return MessageResponseDTO(message="Logged out successfully")
```

**Risk:** Compromised tokens remain valid until expiration.

**Remediation:** Implement token blacklist in Redis:
```python
@router.post("/logout")
async def logout(token: str = Depends(get_token)):
    await redis.setex(f"blacklist:{token}", TOKEN_EXPIRY, "1")
```

---

### HIGH-003: Tokens Stored in localStorage

**Severity:** HIGH
**Category:** Session Management
**Location:** `web/src/core/auth/auth-service.ts:28-30`

**Current State:**
```typescript
localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
```

**Risk:** XSS attacks can steal tokens from localStorage.

**Remediation:** Use httpOnly cookies:
```typescript
// Backend sets cookie instead
Set-Cookie: access_token=...; HttpOnly; Secure; SameSite=Strict
```

---

### HIGH-004: Weak External Ride Validation

**Severity:** HIGH
**Category:** Input Validation
**Location:** `web/firestore.rules:163-180`

**Issue:**
- External ride submissions lack proper validation
- `driver_id` not verified against actual drivers
- No rate limiting on public form submissions
- Rides can be backdated

**Risk:** Fake ride injection, financial manipulation.

---

### HIGH-005: No Query-Level Ownership Filtering

**Severity:** HIGH
**Category:** Access Control
**Location:** `web/src/core/firebase/vehicle-finances.ts:83-110`

**Current State:**
```typescript
const q = query(incomeCollection, orderBy('date', 'desc'));
// NO WHERE CLAUSE for owner_id!
const snapshot = await getDocs(q);
```

**Risk:** All income data fetched, filtered only client-side.

**Remediation:**
```typescript
const q = query(
  incomeCollection,
  where('owner_id', '==', currentUserId),
  orderBy('date', 'desc')
);
```

---

### HIGH-006: Error Details Exposed to Clients

**Severity:** HIGH
**Category:** Information Disclosure
**Location:** `backend/src/presentation/api/v1/endpoints/indriver/extraction.py:77-79`

**Current State:**
```python
raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")
```

**Risk:** Internal error messages expose system details.

**Remediation:**
```python
logger.exception("Extraction failed", extra={"error": str(e)})
raise HTTPException(status_code=500, detail="An error occurred processing your request")
```

---

### HIGH-007: File Upload DoS Vulnerability

**Severity:** HIGH
**Category:** Denial of Service
**Location:** `backend/src/presentation/api/v1/endpoints/indriver/extraction.py:61-66`

**Current State:**
```python
contents = await file.read()  # Reads ENTIRE file first
if len(contents) > 10 * 1024 * 1024:  # Then checks size
    raise HTTPException(...)
```

**Risk:** Memory exhaustion with large files before size check.

**Remediation:**
```python
# Check Content-Length header first
if file.size and file.size > MAX_SIZE:
    raise HTTPException(...)

# Or use chunked reading
async for chunk in file:
    if total_read > MAX_SIZE:
        raise HTTPException(...)
```

---

### HIGH-008: Overly Permissive CORS Configuration

**Severity:** HIGH
**Category:** CORS
**Location:** `backend/src/main.py:51-54`

**Current State:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],  # TOO PERMISSIVE
    allow_headers=["*"],  # TOO PERMISSIVE
)
```

**Remediation:**
```python
allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
allow_headers=["Content-Type", "Authorization"],
```

---

### HIGH-009: Mobile axios SSRF Vulnerability

**Severity:** HIGH
**Category:** Dependency
**CVE:** CVE-2024-39338
**Location:** `mobile/package.json`

**Current State:**
```json
"axios": "^1.6.2"
```

**Risk:** SSRF allows internal network access.

**Remediation:**
```json
"axios": "^1.7.0"
```

---

### HIGH-010: Missing Error Boundary in React

**Severity:** HIGH
**Category:** Reliability
**Location:** `web/src/App.tsx`

**Issue:** No ErrorBoundary wrapping the app.

**Risk:** Any React error causes white screen crash.

**Remediation:**
```tsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>
</ErrorBoundary>
```

---

### HIGH-011: Inconsistent Backend/Web Firestore Rules

**Severity:** HIGH
**Category:** Configuration
**Location:**
- `web/firestore.rules`
- `backend/firestore.rules`

**Issue:** Two different rule sets with conflicting permissions.

---

### HIGH-012: No Package Lock in Mobile

**Severity:** HIGH
**Category:** Supply Chain
**Location:** `mobile/`

**Issue:** No `package-lock.json` means non-reproducible builds.

---

### HIGH-013: Python Test Dependencies in Production

**Severity:** HIGH
**Category:** Configuration
**Location:** `backend/requirements.txt`

**Issue:** pytest, black, mypy, faker included in production deps.

---

### HIGH-014: Outdated Python Dependencies

**Severity:** HIGH
**Category:** Dependency
**Location:** `backend/requirements.txt`

| Package | Current | Latest | Gap |
|---------|---------|--------|-----|
| firebase-admin | 6.5.0 | 13.6.0 | 7 major versions |
| anthropic | 0.8.1 | 1.x | 1 major version |
| python-jose | 3.3.0 | 4.x | 1 major version |

---

### HIGH-015: Memory Leak in RidesTable setTimeout

**Severity:** HIGH
**Category:** Performance
**Location:** `web/src/components/RidesTable/RidesTable.tsx:97-114`

**Issue:** setTimeout not cleaned up on unmount.

**Remediation:**
```typescript
useEffect(() => {
  let timerId: NodeJS.Timeout;
  if (isEditing) {
    timerId = setTimeout(() => {...}, 50);
  }
  return () => clearTimeout(timerId);
}, [isEditing]);
```

---

## Medium Priority Issues

### MED-001: Unsafe Type Assertions in RidesTable
**Location:** `web/src/components/RidesTable/RidesTable.tsx:407-450`
**Issue:** 10+ `as number`, `as string`, `as unknown as` casts without validation.

### MED-002: Missing Array Bounds Checks
**Location:** `web/src/core/auth/auth-service.ts:58`
**Issue:** `token.split('.')[1]` assumes JWT format.

### MED-003: No NaN Check After parseInt
**Location:** Multiple files
**Issue:** parseInt can return NaN, causing calculation errors.

### MED-004: N+1 Query in setVehicleAsPrimary
**Location:** `web/src/core/firebase/vehicles.ts:206-229`
**Issue:** Fetches all vehicles, then updates each one.

### MED-005: Firestore Query Building Bug
**Location:** `web/src/core/firebase/firestore.ts:207-233`
**Issue:** Query constraints overwritten in if blocks.

### MED-006: State in useMemo Anti-pattern
**Location:** `web/src/components/RidesTable/RidesTable.tsx:483-487`
**Issue:** `setCurrentPage` called inside `useMemo`.

### MED-007: No Code Splitting
**Location:** `web/src/routes/index.tsx`
**Issue:** All routes loaded upfront.

### MED-008: Chat Message Key Using Index
**Location:** `web/src/features/chat/components/ChatInterface.tsx:62`
**Issue:** `key={index}` instead of unique ID.

### MED-009: Missing QueryClient Cache Config
**Location:** `web/src/App.tsx:13-20`
**Issue:** No staleTime configured.

### MED-010: Intl.NumberFormat Created in Loop
**Location:** `web/src/components/RidesTable/RidesTable.tsx:224-270`
**Issue:** New formatter instance per render.

### MED-011: Race Condition in Vehicle Updates
**Location:** `web/src/hooks/useDriverVehicles.ts:79-125`
**Issue:** Concurrent fetchVehicles calls possible.

### MED-012: Silent Image Upload Failures
**Location:** `web/src/pages/VehiclesPage.tsx:33-72`
**Issue:** User not notified of partial failures.

### MED-013: Missing API Response Validation
**Location:** `web/src/features/chat/services/chat-api.ts:8-37`
**Issue:** Response data not validated against types.

### MED-014: Unhandled Async in Logout Handler
**Location:** `web/src/components/DashboardLayout/DashboardLayout.tsx:35-38`
**Issue:** No error handling for logout failure.

### MED-015: Console.log Statements (13 files)
**Location:** Multiple files
**Issue:** Debug logs in production code.

### MED-016: Duplicated Formatting Functions
**Location:** RidesTable, VehiclesTable, formatters.ts
**Issue:** 3 copies of formatCurrency, formatDate.

### MED-017: RidesTable.tsx Too Large (850 lines)
**Location:** `web/src/components/RidesTable/RidesTable.tsx`
**Issue:** Should be split into smaller components.

### MED-018: Magic Numbers
**Location:** Multiple files
**Issue:** Hardcoded values like `10 * 1024 * 1024`.

### MED-019: vitest Vulnerable Range
**Location:** `web/package.json`
**Issue:** @vitest/coverage-v8 in vulnerable range.

### MED-020: esbuild Dev Server XSS
**Location:** via vite dependency
**Issue:** GHSA-67mh-4wv8-2f99

### MED-021: Unencrypted Financial Data
**Location:** Firestore collections
**Issue:** No field-level encryption for amounts.

### MED-022: Missing Audit Logging
**Location:** Backend
**Issue:** No audit trail for financial operations.

### MED-023: Insufficient File Name Validation
**Location:** `backend/src/presentation/api/v1/endpoints/indriver/extraction.py:50-58`
**Issue:** Simple extension check, filename could be None.

### MED-024: Unsafe JSON Parsing in Tool Executor
**Location:** `backend/src/infrastructure/agents/tool_executor.py:44-45`
**Issue:** No size limits on JSON input.

### MED-025: Unhandled setTimeout in InDriverImportPage
**Location:** `web/src/pages/InDriverImportPage.tsx:54-59`
**Issue:** Timeout not cleaned up on unmount.

### MED-026: Missing Validation in Ride Updates
**Location:** `web/src/hooks/useDriverRides.ts:53-80`
**Issue:** No validation of update object.

### MED-027: Generic Catch Without Logging
**Location:** `web/src/components/RidesTable/RidesTable.tsx:41-56`
**Issue:** Silent error swallowing.

### MED-028: Backend Inconsistent Exception Handling
**Location:** Multiple files
**Issue:** Some errors re-thrown, others swallowed.

---

## Low Priority Issues

### LOW-001: Missing HSTS Header
**Location:** Backend
**Issue:** No Strict-Transport-Security header.

### LOW-002: No API Key Rotation Strategy
**Location:** Configuration
**Issue:** OPENAI_API_KEY, ANTHROPIC_API_KEY never rotated.

### LOW-003: Bearer Token Refresh Logic
**Location:** `web/src/core/api/client.ts:44-68`
**Issue:** Concurrent requests can cause multiple refreshes.

### LOW-004: Logout Endpoint is No-op
**Location:** `backend/src/presentation/api/v1/endpoints/auth.py:41-49`
**Issue:** Should document JWT stateless design.

### LOW-005: ESLint Disable Comment
**Location:** `web/src/components/DateFilter/DateFilter.tsx:167`
**Issue:** May not be necessary.

### LOW-006: Missing PropTypes/Interface Documentation
**Location:** Multiple components
**Issue:** Props not documented with JSDoc.

### LOW-007: Inconsistent Naming Conventions
**Location:** Multiple files
**Issue:** Mix of handle*, get*, is* prefixes.

### LOW-008: Missing Unit Tests
**Location:** All custom hooks
**Issue:** No test coverage for critical functions.

### LOW-009: Timestamp Conversion Fragility
**Location:** Multiple files
**Issue:** Different approaches to date handling.

### LOW-010: Print Statements in Backend
**Location:** Backend
**Issue:** Some debug prints remain.

### LOW-011: Notification Update Protection
**Location:** `web/firestore.rules:62`
**Issue:** Only checks affected keys, not values.

### LOW-012: Finance Categories No Ownership
**Location:** `web/firestore.rules:89-96`
**Issue:** Design debt for future multi-tenancy.

### LOW-013: Unhandled Analytics Init
**Location:** `web/src/App.tsx:25-30`
**Issue:** initAnalytics() errors silently ignored.

### LOW-014: Firebase Persistence Error Handling
**Location:** `web/src/core/firebase/config.ts:34-36`
**Issue:** Fire-and-forget catch.

### LOW-015: Email Enumeration via Error Messages
**Location:** `web/src/features/auth/hooks/use-login.ts:17-34`
**Issue:** "No existe una cuenta con este correo" reveals existence.

### LOW-016: Sensitive Data in Console Logs
**Location:** `web/src/core/firebase/auth.ts`
**Issue:** Auth domain, user email logged.

---

## Remediation Tickets

### Ticket Format

Each ticket follows this structure:
- **ID:** Unique identifier
- **Title:** Short description
- **Priority:** P0 (immediate) to P3 (low)
- **Effort:** S/M/L/XL
- **Category:** Security domain
- **Files:** Affected files
- **Description:** Detailed issue
- **Steps:** Remediation steps
- **Acceptance Criteria:** Definition of done

---

### P0 - Immediate (24-48 hours)

#### TICKET-001: Rotate All Exposed Secrets
**Priority:** P0 | **Effort:** M | **Category:** Secrets

**Files:**
- `web/.env`
- `.conductor/columbia/backend/.env`
- `.conductor/dublin-v1/backend/.env`

**Description:**
Firebase API keys and JWT secrets are committed to version control and visible in git history. These must be rotated immediately.

**Steps:**
1. Go to Google Cloud Console > APIs & Services > Credentials
2. Restrict or delete the exposed Firebase API key
3. Generate new Firebase API key with domain restrictions
4. Generate new JWT_SECRET and SECRET_KEY (use `openssl rand -base64 32`)
5. Update GitHub Secrets with new values
6. Deploy to regenerate all user tokens
7. Use BFG Repo-Cleaner to remove secrets from git history
8. Force push cleaned history (coordinate with team)

**Acceptance Criteria:**
- [ ] Old API keys restricted/deleted in GCP Console
- [ ] New secrets generated and stored in GitHub Secrets
- [ ] .env files removed from git history
- [ ] All environments redeployed with new secrets

---

#### TICKET-002: Add Authentication to InDriver Endpoints
**Priority:** P0 | **Effort:** S | **Category:** Authentication

**Files:**
- `backend/src/presentation/api/v1/endpoints/indriver/extraction.py`

**Description:**
Five critical endpoints have no authentication, allowing anyone to extract, import, and export ride data.

**Steps:**
1. Import the auth dependency:
   ```python
   from src.presentation.dependencies import get_current_user_id
   ```
2. Add to each endpoint:
   ```python
   current_user_id: UUID = Depends(get_current_user_id)
   ```
3. Log user ID with each operation for audit trail
4. Add rate limiting:
   ```python
   @limiter.limit("10/minute")
   ```

**Acceptance Criteria:**
- [ ] All 5 endpoints require authentication
- [ ] Unauthenticated requests return 401
- [ ] Rate limiting prevents abuse
- [ ] Audit logs include user ID

---

#### TICKET-003: Replace eval() with Safe Math Parser
**Priority:** P0 | **Effort:** S | **Category:** Injection

**Files:**
- `backend/src/infrastructure/agents/tool_executor.py`

**Description:**
The calculator tool uses `eval()` which allows arbitrary code execution even with `__builtins__: {}`.

**Steps:**
1. Install safe math library:
   ```bash
   pip install sympy
   ```
2. Replace eval:
   ```python
   from sympy import sympify, SympifyError

   def _execute_calculator(self, expression: str) -> str:
       try:
           # Validate input contains only safe characters
           if not re.match(r'^[\d\s\+\-\*\/\(\)\.\^]+$', expression):
               return "Error: Invalid characters in expression"
           result = sympify(expression).evalf()
           return str(result)
       except SympifyError:
           return "Error: Invalid mathematical expression"
   ```
3. Add input validation regex
4. Add unit tests for edge cases

**Acceptance Criteria:**
- [ ] eval() removed from codebase
- [ ] Calculator works for valid math expressions
- [ ] Invalid expressions return safe error message
- [ ] Unit tests pass

---

#### TICKET-004: Fix Firestore Public Read Rules
**Priority:** P0 | **Effort:** S | **Category:** Access Control

**Files:**
- `web/firestore.rules`

**Description:**
The `/users`, `/drivers`, and `/vehicles` collections allow public read access, exposing all user PII.

**Steps:**
1. Update firestore.rules:
   ```javascript
   match /drivers/{driverId} {
     allow read: if request.auth != null &&
       (request.auth.uid == driverId || isAdmin());
   }

   match /users/{userId} {
     allow read: if request.auth != null &&
       (request.auth.uid == userId || isAdmin());
   }

   match /vehicles/{vehicleId} {
     allow read: if request.auth != null &&
       (vehicleOwnershipCheck(vehicleId) || isAdmin());
   }
   ```
2. Deploy rules: `firebase deploy --only firestore:rules`
3. Test that unauthenticated reads fail
4. Test that authenticated reads work

**Acceptance Criteria:**
- [ ] Unauthenticated reads return permission denied
- [ ] Users can read their own data
- [ ] Admins can read all data
- [ ] No regression in app functionality

---

#### TICKET-005: Fix vehicleOwnershipCheck Logic
**Priority:** P0 | **Effort:** S | **Category:** Access Control

**Files:**
- `web/firestore.rules`

**Description:**
The ownership check returns TRUE for non-existent vehicles, allowing unauthorized access.

**Steps:**
1. Fix the function:
   ```javascript
   function vehicleOwnershipCheck(vehicleId) {
     let vehicle = /databases/$(database)/documents/vehicles/$(vehicleId);
     return exists(vehicle) &&
       (get(vehicle).data.owner_id == request.auth.uid ||
        get(vehicle).data.assigned_driver_id == request.auth.uid);
   }
   ```
2. Deploy and test
3. Verify access to non-existent vehicles fails

**Acceptance Criteria:**
- [ ] Access to non-existent vehicle returns denied
- [ ] Owner can access their vehicle
- [ ] Assigned driver can access vehicle
- [ ] Others cannot access

---

#### TICKET-006: Fix Role Assignment in Auth Store
**Priority:** P0 | **Effort:** M | **Category:** Authorization

**Files:**
- `web/src/core/store/auth-store.ts`

**Description:**
User role is hardcoded to USER instead of reading from Firebase or backend.

**Steps:**
1. Option A - Firebase Custom Claims:
   ```typescript
   const tokenResult = await user.getIdTokenResult();
   const role = (tokenResult.claims.role as UserRole) || UserRole.USER;
   ```
2. Option B - Backend API:
   ```typescript
   const profile = await authApi.getProfile(user.uid);
   const role = profile.role;
   ```
3. Update setUser calls throughout
4. Test admin user sees admin role

**Acceptance Criteria:**
- [ ] Admin users have admin role in frontend
- [ ] Regular users have user role
- [ ] Role persists across page refresh
- [ ] Role-based UI works correctly

---

#### TICKET-007: Disable Debug Mode in Production
**Priority:** P0 | **Effort:** S | **Category:** Configuration

**Files:**
- `backend/src/core/config.py`

**Description:**
DEBUG defaults to True and may be True in production, exposing error details.

**Steps:**
1. Change default:
   ```python
   DEBUG: bool = False
   ```
2. Add production check:
   ```python
   @field_validator('DEBUG')
   @classmethod
   def validate_debug(cls, v):
       env = os.getenv('ENVIRONMENT', 'development')
       if v and env == 'production':
           raise ValueError('DEBUG cannot be True in production')
       return v
   ```
3. Verify production .env has DEBUG=False
4. Update generic error messages

**Acceptance Criteria:**
- [ ] DEBUG=False in production
- [ ] Error responses don't contain stack traces
- [ ] Validation prevents DEBUG=True in prod

---

#### TICKET-008: Update Mobile axios Dependency
**Priority:** P0 | **Effort:** S | **Category:** Dependency

**Files:**
- `mobile/package.json`

**Description:**
axios ^1.6.2 allows vulnerable versions with SSRF (CVE-2024-39338).

**Steps:**
1. Update package.json:
   ```json
   "axios": "^1.7.0"
   ```
2. Generate lock file:
   ```bash
   npm install
   ```
3. Commit package-lock.json
4. Test API calls work

**Acceptance Criteria:**
- [ ] axios >= 1.7.0 in lock file
- [ ] package-lock.json committed
- [ ] API calls function correctly

---

### P1 - This Week

#### TICKET-009: Implement Rate Limiting
**Priority:** P1 | **Effort:** M | **Category:** Security

**Files:**
- `backend/src/main.py`
- `backend/src/presentation/api/v1/endpoints/auth.py`

**Steps:**
1. Install slowapi: `pip install slowapi`
2. Configure limiter in main.py
3. Add limits to auth endpoints (5/minute login)
4. Add limits to file upload (10/minute)

---

#### TICKET-010: Implement Token Blacklist
**Priority:** P1 | **Effort:** M | **Category:** Authentication

**Files:**
- `backend/src/presentation/api/v1/endpoints/auth.py`
- `backend/src/core/security.py`

**Steps:**
1. Add Redis blacklist on logout
2. Check blacklist in token validation
3. Set TTL equal to token expiry

---

#### TICKET-011: Migrate Tokens to httpOnly Cookies
**Priority:** P1 | **Effort:** L | **Category:** Session Management

**Files:**
- `backend/src/presentation/api/v1/endpoints/auth.py`
- `web/src/core/auth/auth-service.ts`
- `web/src/core/api/client.ts`

**Steps:**
1. Backend sets httpOnly cookies
2. Remove localStorage token storage
3. Update API client for cookie auth

---

#### TICKET-012: Add React Error Boundary
**Priority:** P1 | **Effort:** S | **Category:** Reliability

**Files:**
- `web/src/App.tsx`
- `web/src/components/ErrorBoundary/ErrorBoundary.tsx` (new)

**Steps:**
1. Create ErrorBoundary component
2. Wrap app with boundary
3. Add error fallback UI

---

#### TICKET-013: Generate Mobile Package Lock
**Priority:** P1 | **Effort:** S | **Category:** Supply Chain

**Files:**
- `mobile/package-lock.json` (new)

**Steps:**
1. Run `npm install` in mobile directory
2. Commit package-lock.json

---

#### TICKET-014: Separate Python Dependencies
**Priority:** P1 | **Effort:** S | **Category:** Configuration

**Files:**
- `backend/requirements.txt`
- `backend/requirements-dev.txt` (new)

**Steps:**
1. Create requirements-dev.txt with pytest, black, etc.
2. Remove dev deps from requirements.txt
3. Update CI to install both

---

#### TICKET-015: Fix setTimeout Memory Leaks
**Priority:** P1 | **Effort:** S | **Category:** Performance

**Files:**
- `web/src/components/RidesTable/RidesTable.tsx`
- `web/src/pages/InDriverImportPage.tsx`

**Steps:**
1. Store timeout IDs
2. Clear in useEffect cleanup
3. Test unmount scenarios

---

### P2 - Within 2 Weeks

#### TICKET-016 to TICKET-035
(Medium priority issues - detailed steps similar to above)

---

### P3 - Within 1 Month

#### TICKET-036 to TICKET-051
(Low priority issues - detailed steps similar to above)

---

## Appendix: Files Analyzed

### Frontend (Web)
```
web/src/
├── App.tsx
├── components/
│   ├── DateFilter/DateFilter.tsx
│   ├── DashboardLayout/DashboardLayout.tsx
│   ├── RidesTable/RidesTable.tsx
│   ├── VehicleForm/VehicleForm.tsx
│   └── VehiclesTable/VehiclesTable.tsx
├── core/
│   ├── api/client.ts
│   ├── auth/auth-service.ts
│   ├── config.ts
│   ├── firebase/
│   │   ├── auth.ts
│   │   ├── config.ts
│   │   ├── firestore.ts
│   │   ├── storage.ts
│   │   ├── vehicle-finances.ts
│   │   └── vehicles.ts
│   ├── store/auth-store.ts
│   └── types/
├── features/
│   ├── auth/
│   ├── chat/
│   ├── external-rides/
│   └── indriver-import/
├── hooks/
│   ├── useDriverRides.ts
│   ├── useDriverVehicles.ts
│   └── useVehicleFinances.ts
├── pages/
└── routes/
```

### Backend (Python)
```
backend/src/
├── main.py
├── core/
│   ├── config.py
│   ├── exceptions.py
│   ├── logging.py
│   └── security.py
├── application/
│   ├── dtos.py
│   ├── agents/
│   ├── indriver/
│   │   ├── extraction_service.py
│   │   └── text_parser.py
│   └── use_cases/
├── infrastructure/
│   ├── agents/tool_executor.py
│   └── database.py
└── presentation/
    ├── dependencies.py
    ├── exception_handlers.py
    ├── middleware.py
    └── api/v1/endpoints/
```

### Infrastructure
```
web/
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
└── package.json

mobile/
└── package.json

backend/
└── requirements.txt

.github/workflows/
├── web-ci.yml
├── backend-ci.yml
└── claude-review.yml
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-22 | Claude Code | Initial comprehensive audit |

---

*This report was generated by Claude Code Security Scanner. All findings should be verified before remediation.*
