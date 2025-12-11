# InDriver PDF Extractor - Implementation Tasks

**Feature:** InDriver PDF/OCR Ride Data Extractor
**Branch:** `indriver-pdf-extractor`
**Estimated Tasks:** 25

---

## Legend

- `[ ]` - Pending
- `[x]` - Completed
- `[P]` - Can run in parallel with other [P] tasks
- `[B]` - Blocked by previous task

---

## Phase 1: Setup & Infrastructure

### T001: Install OCR Dependencies
- [ ] Add `tesseract.js` to backend dependencies
- [ ] Add `sharp` for image preprocessing
- [ ] Add `pdf-parse` for PDF handling
- [ ] Verify Zod is already installed for validation
- **Acceptance:** `npm install` succeeds, packages in package.json

### T002: Create Feature Directory Structure
- [ ] Create `src/features/indriver-import/` directory
- [ ] Create subdirectories: `components/`, `hooks/`, `services/`, `types/`, `utils/`
- [ ] Create index.ts barrel file
- **Acceptance:** Directory structure matches project conventions

### T003: Add TypeScript Types
- [ ] Copy `data-model.ts` to `src/features/indriver-import/types/`
- [ ] Rename to `indriver.types.ts`
- [ ] Export types from feature index
- **Acceptance:** Types importable from feature module

---

## Phase 2: Backend - Core OCR Service

### T004: [P] Create Image Preprocessing Service
- [ ] Create `src/features/indriver-import/services/imagePreprocessor.ts`
- [ ] Implement `preprocessImage(buffer)` function
- [ ] Add grayscale conversion, contrast normalization, sharpening
- [ ] Handle resize for large images
- **Acceptance:** Test with sample screenshot, outputs cleaned image

### T005: [P] Create PDF Handler Service
- [ ] Create `src/features/indriver-import/services/pdfHandler.ts`
- [ ] Implement `extractImagesFromPdf(buffer)` function
- [ ] Handle multi-page PDFs
- [ ] Return array of image buffers
- **Acceptance:** Test with multi-page PDF, extracts all pages

### T006: [B] Create OCR Service
- [ ] Create `src/features/indriver-import/services/ocrService.ts`
- [ ] Implement `extractText(imageBuffer)` function
- [ ] Configure Tesseract for Spanish language
- [ ] Return raw text with confidence scores
- **Acceptance:** Test with sample screenshot, returns Spanish text

### T007: [B] Create Text Parser Service
- [ ] Create `src/features/indriver-import/services/textParser.ts`
- [ ] Implement date/time parsing functions
- [ ] Implement currency parsing (handle COP format)
- [ ] Implement section detection (header, income, received, paid)
- [ ] Implement field extraction for all 15 data points
- **Acceptance:** Parse test OCR output to structured data

### T008: [B] Create Extraction Orchestrator
- [ ] Create `src/features/indriver-import/services/extractionService.ts`
- [ ] Implement `extractFromFile(file)` function
- [ ] Chain: preprocess → OCR → parse → validate
- [ ] Calculate confidence scores
- [ ] Return `ExtractedInDriverRide` object
- **Acceptance:** Full pipeline test with sample screenshot

---

## Phase 3: Backend - API Endpoints

### T009: Create Extract Endpoint
- [ ] Create `POST /api/indriver/extract` route
- [ ] Handle multipart/form-data file uploads
- [ ] Process multiple files in parallel
- [ ] Return `ExtractResponse` with results and errors
- **Acceptance:** Postman test with 3 sample images

### T010: Create Import Endpoint
- [ ] Create `POST /api/indriver/import` route
- [ ] Accept `ImportRequest` body
- [ ] Validate all rides before insert
- [ ] Insert to database (or mock for now)
- [ ] Return `ImportResponse` with status
- **Acceptance:** Import 5 extracted rides successfully

### T011: Create Export Endpoint
- [ ] Create `POST /api/indriver/export` route
- [ ] Support JSON, CSV, XLSX formats
- [ ] Generate downloadable file
- [ ] Include all financial fields
- **Acceptance:** Export 10 rides to each format

### T012: [P] Create Stats Endpoint
- [ ] Create `GET /api/indriver/stats` route
- [ ] Return extraction statistics (total, success rate, avg confidence)
- [ ] Filter by date range
- **Acceptance:** Returns accurate stats for test data

---

## Phase 4: Backend - Tests

### T013: [P] Unit Tests - Date/Time Parsing
- [ ] Create `textParser.test.ts`
- [ ] Test Spanish date parsing (all month abbreviations)
- [ ] Test time parsing (AM/PM variations)
- [ ] Test edge cases (malformed dates)
- **Acceptance:** 100% coverage on parsing functions

### T014: [P] Unit Tests - Currency Parsing
- [ ] Test COP currency extraction
- [ ] Test thousand separators (comma vs period)
- [ ] Test decimal handling
- **Acceptance:** Handles all currency formats in samples

### T015: [P] Unit Tests - Financial Validation
- [ ] Test commission calculation validation
- [ ] Test IVA calculation validation
- [ ] Test net income validation
- **Acceptance:** Catches intentionally incorrect values

### T016: [B] Integration Tests - Full Pipeline
- [ ] Create `extractionService.test.ts`
- [ ] Test with all 15 sample screenshots
- [ ] Verify >90% accuracy on test data
- [ ] Document any extraction failures
- **Acceptance:** Pass rate >90% on sample data

---

## Phase 5: Frontend - Components

### T017: Create InDriverUploader Component
- [ ] Create `src/features/indriver-import/components/InDriverUploader/`
- [ ] Implement drag-and-drop zone
- [ ] Show file list with thumbnails
- [ ] Handle file validation (type, size)
- [ ] Progress indicator during upload
- [ ] Use WeGo design system styles
- **Acceptance:** UI matches spec mockup, handles 10 files

### T018: Create InDriverReviewTable Component
- [ ] Create `src/features/indriver-import/components/InDriverReviewTable/`
- [ ] Editable table using TanStack Table
- [ ] Highlight low-confidence cells (yellow)
- [ ] Show status badges (completed, cancelled)
- [ ] Summary row with totals
- [ ] Use WeGo typography for currency display
- **Acceptance:** Displays 15 rides, allows editing

### T019: Create InDriverRideCard Component
- [ ] Create `src/features/indriver-import/components/InDriverRideCard/`
- [ ] Show ride details in card format
- [ ] Display original image thumbnail
- [ ] Show confidence score indicator
- [ ] Action buttons (edit, delete)
- **Acceptance:** Matches design system card pattern

### T020: Create InDriverExportModal Component
- [ ] Create `src/features/indriver-import/components/InDriverExportModal/`
- [ ] Format selection (CSV, JSON, XLSX)
- [ ] Date range filter
- [ ] Field selection checkboxes
- [ ] Download button
- **Acceptance:** Modal opens, triggers download

---

## Phase 6: Frontend - Integration

### T021: Create InDriver Import Page
- [ ] Create `src/pages/InDriverImport/InDriverImport.tsx`
- [ ] Compose uploader, review table components
- [ ] Add to router configuration
- [ ] Handle state flow: upload → extract → review → import
- [ ] Success/error notifications
- **Acceptance:** Full flow works end-to-end

### T022: Create useInDriverExtract Hook
- [ ] Create `src/features/indriver-import/hooks/useInDriverExtract.ts`
- [ ] Manage extraction state (loading, results, errors)
- [ ] Call extract API endpoint
- [ ] Handle batch file processing
- **Acceptance:** Hook used by upload page

### T023: Create useInDriverImport Hook
- [ ] Create `src/features/indriver-import/hooks/useInDriverImport.ts`
- [ ] Manage import state
- [ ] Call import API endpoint
- [ ] Handle confirmation flow
- **Acceptance:** Hook used by review page

### T024: Add Navigation & Menu Item
- [ ] Add "Importar InDriver" to sidebar menu
- [ ] Use appropriate icon (upload/document)
- [ ] Route to import page
- [ ] Spanish label per CLAUDE.md guidelines
- **Acceptance:** Menu item visible, navigates correctly

---

## Phase 7: Polish & Documentation

### T025: End-to-End Testing
- [ ] Test full workflow: upload → extract → review → import → export
- [ ] Test with real InDriver screenshots
- [ ] Test error handling (bad images, network errors)
- [ ] Test accessibility (keyboard navigation)
- **Acceptance:** All critical paths pass

### T026: Write Feature Documentation
- [ ] Update CLAUDE.md with new feature patterns
- [ ] Document API endpoints in OpenAPI/Swagger
- [ ] Write user guide (Spanish) for drivers
- **Acceptance:** Documentation complete and reviewed

### T027: Performance Optimization
- [ ] Profile extraction time per image
- [ ] Implement web workers for browser OCR (if needed)
- [ ] Add progress indicators for long operations
- **Acceptance:** <3s per image extraction time

---

## Summary

| Phase | Tasks | Parallel | Status |
|-------|-------|----------|--------|
| Setup | T001-T003 | 0 | Pending |
| Core OCR | T004-T008 | 2 | Pending |
| API | T009-T012 | 1 | Pending |
| Tests | T013-T016 | 3 | Pending |
| Components | T017-T020 | 0 | Pending |
| Integration | T021-T024 | 0 | Pending |
| Polish | T025-T027 | 0 | Pending |

**Total Tasks:** 27
**Parallelizable:** 6 tasks can run in parallel

---

## Dependencies Graph

```
T001 ──┬── T002 ── T003
       │
       ├── T004 (P) ──┐
       │              │
       └── T005 (P) ──┼── T006 ── T007 ── T008
                      │
                      └── T009 ── T010 ── T011
                               │
                               └── T012 (P)

T013 (P) ──┐
T014 (P) ──┼── T016
T015 (P) ──┘

T017 ── T018 ── T019 ── T020 ── T021 ── T022 ── T023 ── T024

T025 ── T026 ── T027
```

---

*Tasks created for WeGo InDriver PDF Extractor Feature*
