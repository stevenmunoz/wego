# InDriver Import

> OCR-based extraction system for importing ride data from InDriver app screenshots and PDFs

## Overview

The InDriver Import feature automates the process of importing ride data from InDriver app screenshots and PDFs into the WeGo platform. It enables drivers to batch-upload multiple ride documents, extract structured data using optical character recognition (Tesseract), review and edit extracted data, and import into Firestore.

This feature addresses a critical pain point for drivers who previously had to manually enter ride data from InDriver receipts. The OCR extraction supports Colombian currency formats, Spanish text, and handles the specific layout of InDriver receipts.

**Key Capabilities:**
- Batch upload of images (PNG, JPG) and PDFs
- OCR extraction with Tesseract (Spanish language support)
- Inline editing of extracted data with financial recalculation
- Confidence scoring for extraction quality
- Export to CSV/JSON formats
- Firebase persistence with driver association

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 INDRIVER IMPORT ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend (React/TypeScript)                                    │
│  ├─ Page: InDriverImportPage.tsx                               │
│  ├─ Components:                                                 │
│  │   ├─ InDriverUploader (drag-drop upload)                    │
│  │   └─ InDriverReviewTable (editable review)                  │
│  ├─ Hook: useInDriverExtract (state management)                │
│  ├─ Service: indriver-api.ts (API client)                      │
│  └─ Types: types/index.ts                                       │
│                                                                 │
│  Backend (Python/FastAPI)                                       │
│  ├─ Endpoints: /api/v1/indriver/*                              │
│  │   ├─ POST /extract (multipart/form-data)                    │
│  │   ├─ POST /import                                           │
│  │   ├─ POST /export                                           │
│  │   ├─ POST /validate                                         │
│  │   └─ GET /stats                                             │
│  ├─ Service: extraction_service.py                             │
│  ├─ Parser: text_parser.py                                     │
│  └─ Schemas: schemas.py                                         │
│                                                                 │
│  Firebase/Firestore                                             │
│  ├─ Collection: indriver_rides/{driverId}/rides                │
│  └─ Service: web/src/core/firebase/firestore.ts               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Data Flow:
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Upload  │ → │   OCR    │ → │  Review  │ → │  Import  │
│  Files   │   │ Extract  │   │  & Edit  │   │ Firestore│
└──────────┘   └──────────┘   └──────────┘   └──────────┘
```

## User Stories

1. **As a driver**, I can upload multiple InDriver screenshots at once so that I can import my rides in bulk
2. **As a driver**, I can review extracted data before importing so that I can correct any OCR errors
3. **As a driver**, I can see confidence scores for extracted data so that I know which fields need verification
4. **As a driver**, I can edit any extracted field inline so that I can fix mistakes without re-uploading
5. **As a driver**, I can export my rides to CSV so that I can use the data in other applications

## Key Files

### Frontend

| File | Purpose |
|------|---------|
| `web/src/pages/InDriverImportPage.tsx` | Main page with upload/review modes |
| `web/src/features/indriver-import/components/InDriverUploader.tsx` | Drag-drop file upload component |
| `web/src/features/indriver-import/components/InDriverReviewTable.tsx` | Editable review table with inline editing |
| `web/src/features/indriver-import/hooks/use-indriver-extract.ts` | State management hook for extraction flow |
| `web/src/features/indriver-import/services/indriver-api.ts` | API client for backend calls |
| `web/src/features/indriver-import/utils/formatters.ts` | Colombian currency/date formatters |
| `web/src/features/indriver-import/types/index.ts` | TypeScript interfaces |
| `web/src/core/firebase/firestore.ts` | `saveInDriverRides()` function |

### Backend

| File | Purpose |
|------|---------|
| `backend/src/presentation/api/v1/endpoints/indriver/extraction.py` | API endpoints |
| `backend/src/application/indriver/extraction_service.py` | OCR extraction service |
| `backend/src/application/indriver/text_parser.py` | Text parsing with regex patterns |
| `backend/src/application/indriver/schemas.py` | Pydantic models and validation |

### Specifications

| File | Purpose |
|------|---------|
| `docs/specs/indriver-pdf-extractor/SPEC.md` | Feature specification |
| `docs/specs/indriver-pdf-extractor/research.md` | OCR research notes |
| `docs/specs/indriver-pdf-extractor/tasks.md` | Implementation tasks |

## Data Model

### Core Type: `ExtractedInDriverRide`

```typescript
interface ExtractedInDriverRide {
  // Identification
  id: string;
  source_image_path: string;
  extraction_confidence: number;  // 0-1

  // Ride Details
  date: string | null;           // ISO format: "2025-12-02"
  time: string;                  // 24h format: "07:52"
  destination_address: string;
  duration: { value: number; unit: 'min' | 'hr' };
  distance: { value: number; unit: 'km' | 'metro' };

  // Passenger Info
  passenger_name: string;
  rating_given: number | null;   // 1-5

  // Status
  status: 'completed' | 'cancelled_by_passenger' | 'cancelled_by_driver';
  cancellation_reason: string | null;

  // Payment
  payment_method: 'cash' | 'nequi' | 'other';
  payment_method_label: string;

  // Financial - Income (Recibí)
  tarifa: number;                // Base fare in COP
  total_recibido: number;        // Total received

  // Financial - Deductions (Pagué)
  comision_servicio: number;     // Platform commission
  comision_porcentaje: number;   // Commission % (typically 9.5%)
  iva_pago_servicio: number;     // IVA tax
  total_pagado: number;          // Total paid to platform

  // Financial - Net
  mis_ingresos: number;          // Net driver income

  // Metadata
  extracted_at: string;
  raw_ocr_text: string | null;
  field_confidences: FieldConfidences;
}
```

### Firestore Collection: `indriver_rides/{driverId}/rides`

```typescript
interface FirestoreInDriverRide {
  id: string;
  driver_id: string;

  // Ride details (flattened structure)
  date: Timestamp | null;
  time: string;
  destination_address: string;
  duration_value: number | null;
  duration_unit: string | null;
  distance_value: number | null;
  distance_unit: string | null;

  // Financial (field names differ from frontend)
  base_fare: number;             // tarifa
  total_received: number;        // total_recibido
  service_commission: number;    // comision_servicio
  net_earnings: number;          // mis_ingresos

  // Metadata
  extracted_at: Timestamp;
  imported_at: Timestamp;
  category: 'indriver' | 'independent' | 'other';
}
```

### Firestore Indexes Required

```json
{
  "collectionGroup": "indriver_rides",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "driver_id", "order": "ASCENDING" },
    { "fieldPath": "date", "order": "DESCENDING" }
  ]
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/indriver/extract` | Extract rides from uploaded files (multipart/form-data) |
| POST | `/api/v1/indriver/import` | Import extracted rides to database |
| POST | `/api/v1/indriver/export` | Export rides to CSV/JSON file |
| POST | `/api/v1/indriver/validate` | Validate single ride's financial consistency |
| GET | `/api/v1/indriver/stats` | Get extraction statistics |

### Extract Endpoint

```typescript
// Request: multipart/form-data with files[]

// Response
interface ExtractResponse {
  success: boolean;
  results: ExtractedInDriverRide[];
  errors: { file_name: string; error: string }[];
  summary: {
    total_files: number;
    successful_extractions: number;
    failed_extractions: number;
    average_confidence: number;
  };
}
```

### Import Endpoint

```typescript
// Request
interface ImportRequest {
  rides: ExtractedInDriverRide[];
  driver_id: string;
}

// Response
interface ImportResponse {
  success: boolean;
  imported: { ride_id: string; external_id: string }[];
  skipped: { index: number; reason: string }[];
}
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API base URL | Yes |

### Backend Requirements

- **Tesseract OCR** must be installed on the server
- Spanish language pack: `tesseract-ocr-spa`
- **Poppler** for PDF processing: `poppler-utils`

Install on Ubuntu/Debian:
```bash
sudo apt-get install tesseract-ocr tesseract-ocr-spa poppler-utils
```

Install on macOS:
```bash
brew install tesseract tesseract-lang poppler
```

## Usage Examples

### Basic Upload Flow

```typescript
// In a React component
const {
  files,
  addFiles,
  extractAll,
  extractedRides,
  importRides
} = useInDriverExtract();

// 1. Add files
const handleDrop = (acceptedFiles: File[]) => {
  addFiles(acceptedFiles);
};

// 2. Extract data
const handleExtract = async () => {
  await extractAll();
  // extractedRides now contains parsed data
};

// 3. Import to Firestore
const handleImport = async () => {
  const success = await importRides(currentDriverId);
  if (success) {
    console.log('Rides imported successfully');
  }
};
```

### Editing Extracted Data

```typescript
// Update a specific field with auto-recalculation
updateRide(rideId, {
  tarifa: 18000,  // This will recalculate net income
});
```

## Common Issues and Solutions

### Issue: OCR Returns All Zeros for Financial Values

**Symptoms:** All financial fields (tarifa, mis_ingresos, etc.) are 0.0 after extraction

**Root Cause:** The currency parser was using US format (comma as thousands separator) instead of Colombian format (dot as thousands, comma as decimal)

**Solution:** The parser now uses Colombian currency format:
- Input: `18.000,00 COP` → Output: `18000.00`
- Dots are stripped (thousands separator)
- Comma is replaced with dot (decimal separator)

### Issue: 401/403 Errors on Extract Endpoint

**Symptoms:** Extraction fails with authentication errors

**Root Cause:** Firebase token verification failing due to misconfigured project ID

**Solution:** Ensure `.env` has correct Firebase configuration:
```env
FIREBASE_PROJECT_ID=wego-dev-a5a13
FIREBASE_CREDENTIALS_PATH=./service-account.json
USE_FIREBASE_EMULATOR=false
```

### Issue: CORS Errors on dev.wegocol.com

**Symptoms:** Requests from `dev.wegocol.com` to the backend are blocked with "No 'Access-Control-Allow-Origin' header"

**Root Cause:** The CORS middleware uses localhost-only regex when `ENVIRONMENT=development`. The DEV Cloud Run deployment was incorrectly using this environment value.

**Solution:** DEV Cloud Run deployments now use `ENVIRONMENT=staging` which enables the full `CORS_ORIGINS` list (including `dev.wegocol.com`). Environment values:
- `development`: Reserved for local development (localhost-only CORS)
- `staging`: DEV Cloud Run deployment (full CORS_ORIGINS list)
- `production`: PROD Cloud Run deployment (full CORS_ORIGINS list)

### Issue: Tesseract Not Available

**Symptoms:** Extraction fails with "Tesseract OCR not available" error

**Root Cause:** Tesseract not installed or not in PATH

**Solution:**
```bash
# Check if installed
which tesseract

# Install if missing
# Ubuntu/Debian
sudo apt-get install tesseract-ocr tesseract-ocr-spa

# macOS
brew install tesseract tesseract-lang
```

### Issue: PDF Processing Fails

**Symptoms:** PDF files fail to extract while images work

**Root Cause:** Poppler not installed (required for pdf2image)

**Solution:**
```bash
# Ubuntu/Debian
sudo apt-get install poppler-utils

# macOS
brew install poppler
```

### Issue: Low Confidence Scores

**Symptoms:** Extracted data has low confidence scores (<70%)

**Root Cause:** Poor image quality or non-standard InDriver receipt format

**Solution:**
- Use higher resolution screenshots
- Ensure receipt is fully visible without cropping
- Avoid screenshots with overlays or notifications
- User should review and manually correct low-confidence fields

### Issue: Integration Tests Failing with StreamGenerator Error

**Symptoms:** Tests fail with `TypeError: 'async for' requires an object with __aiter__ method, got StreamGenerator`

**Root Cause:** The Firestore repository code was using `AsyncClient` type hints and `async for` loops, but `firebase-admin`'s `firestore.client()` returns a synchronous `Client`. This mismatch caused:
- mypy type errors (expected `AsyncStreamGenerator`, got `StreamGenerator`)
- Runtime errors when using `async for` with sync generators

**Solution:** Updated all Firestore repository implementations to use synchronous patterns:
- Changed import from `AsyncClient` to `Client`
- Changed `async for doc in query.stream()` to `list(query.stream())`
- Removed `await` from synchronous Firestore operations (`.set()`, `.get()`, `.update()`, `.delete()`)
- Added `cast(DocumentSnapshot, ...)` for proper type annotations

Files modified:
- `backend/src/infrastructure/repositories.py`
- `backend/src/infrastructure/agents/repositories.py`

## Testing

### Unit Tests

- `backend/tests/unit/indriver/test_text_parser.py` - Parser tests
- `backend/tests/unit/indriver/test_colombian_currency.py` - Currency format tests
- `backend/tests/unit/test_auth_dependencies.py` - Auth dependency tests

### Integration Tests

- `backend/tests/integration/test_indriver_api.py` - API endpoint tests
- `backend/tests/integration/test_indriver_auth.py` - Authentication tests
- `backend/tests/integration/test_indriver_e2e.py` - End-to-end flow tests

### Manual Testing Checklist

- [ ] Upload single PNG image
- [ ] Upload multiple files (batch)
- [ ] Upload PDF (single and multi-page)
- [ ] Verify Colombian currency parsing (e.g., 18.000,00)
- [ ] Edit extracted field and verify recalculation
- [ ] Export to CSV
- [ ] Export to JSON
- [ ] Import to Firestore
- [ ] Verify cancelled ride detection
- [ ] Test with low-quality image (verify warning)

## Related Documentation

- [SPEC.md](../specs/indriver-pdf-extractor/SPEC.md) - Original feature specification
- [TESTING_STRATEGY.md](../TESTING_STRATEGY.md) - Testing approach
- [SECURITY_AUDIT_REPORT.md](../SECURITY_AUDIT_REPORT.md) - Security considerations

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12-02 | Initial implementation |
| 1.1 | 2024-12-23 | Fixed Colombian currency parsing bug |
| 1.2 | 2024-12-23 | Added comprehensive auth tests |
| 1.3 | 2024-12-24 | Fixed Firestore sync/async client mismatch in repositories |
| 1.4 | 2024-12-24 | Fixed CORS for dev.wegocol.com (use staging environment for DEV Cloud Run) |

---

**Last Updated**: 2024-12-24
