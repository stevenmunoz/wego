# InDriver PDF Extractor - Research & Implementation Plan

## OCR Library Evaluation

### Option 1: Tesseract.js (Recommended for MVP)

**Pros:**
- Free and open source (Apache 2.0)
- Runs entirely in browser/Node.js (no external API)
- No rate limits or API costs
- Supports Spanish language (spa)
- Good for structured text extraction
- Large community support

**Cons:**
- Lower accuracy than cloud services (~85-90%)
- Requires good image quality
- Slower than cloud APIs
- May need preprocessing for mobile screenshots

**Installation:**
```bash
npm install tesseract.js
```

**Usage:**
```typescript
import Tesseract from 'tesseract.js';

const result = await Tesseract.recognize(imageBuffer, 'spa', {
  logger: (info) => console.log(info),
});
console.log(result.data.text);
```

### Option 2: Google Cloud Vision (Production)

**Pros:**
- High accuracy (>95%)
- Excellent Spanish text support
- Document structure detection
- Handles poor quality images well
- Fast processing

**Cons:**
- API costs ($1.50 per 1000 images)
- Requires internet connection
- Requires GCP account setup
- Data sent to external service

**Installation:**
```bash
npm install @google-cloud/vision
```

### Option 3: Azure Computer Vision

**Pros:**
- High accuracy
- Good OCR for printed text
- Azure ecosystem integration

**Cons:**
- Similar costs to Google
- Requires Azure account
- Less popular for document processing

### Recommendation

**Phase 1 (MVP):** Use Tesseract.js
- Zero cost during development
- Fast iteration
- Good enough for testing extraction logic

**Phase 2 (Production):** Add Google Cloud Vision as option
- Switch based on accuracy requirements
- User preference setting
- Fallback mechanism

---

## Image Preprocessing Pipeline

Mobile screenshots from InDriver app require preprocessing for optimal OCR:

### 1. Sharp.js (Image Processing)

```bash
npm install sharp
```

**Preprocessing steps:**
```typescript
import sharp from 'sharp';

async function preprocessImage(inputBuffer: Buffer): Promise<Buffer> {
  return await sharp(inputBuffer)
    // Convert to grayscale
    .grayscale()
    // Increase contrast
    .normalise()
    // Resize if too large (maintain aspect)
    .resize(1200, null, { withoutEnlargement: true })
    // Sharpen text
    .sharpen()
    // Output as PNG for best text clarity
    .png()
    .toBuffer();
}
```

### 2. PDF Processing

```bash
npm install pdf-parse pdf-lib
```

**PDF to Image conversion:**
```typescript
import { PDFDocument } from 'pdf-lib';
import pdf from 'pdf-parse';

// For multi-page PDFs, extract each page as image
async function extractPagesFromPdf(pdfBuffer: Buffer): Promise<Buffer[]> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pageCount = pdfDoc.getPageCount();
  // Convert each page to image for OCR
  // ...
}
```

---

## Text Parsing Strategy

Given the structured layout of InDriver screenshots, use a **zone-based parsing** approach:

### Zone Detection

The InDriver ride detail screen has consistent zones:
1. **Header Zone** - Date, time, address
2. **Passenger Zone** - Name, rating
3. **Income Zone** - "Mis ingresos" header + amount
4. **Received Zone** - "Recibí" section (Tarifa, Total recibido, payment method)
5. **Paid Zone** - "Pagué" section (Commission, IVA, Total pagado)

### Parsing Algorithm

```typescript
function parseInDriverText(rawText: string): Partial<ExtractedInDriverRide> {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  // Find key section markers
  const misIngresosIndex = lines.findIndex(l => /mis\s+ingresos/i.test(l));
  const recibiIndex = lines.findIndex(l => /^recibí$/i.test(l));
  const pagueIndex = lines.findIndex(l => /^pagué$/i.test(l));

  // Parse each section
  const headerSection = lines.slice(0, misIngresosIndex);
  const incomeSection = lines.slice(misIngresosIndex, recibiIndex);
  const receivedSection = lines.slice(recibiIndex, pagueIndex);
  const paidSection = lines.slice(pagueIndex);

  return {
    ...parseHeader(headerSection),
    ...parseIncome(incomeSection),
    ...parseReceived(receivedSection),
    ...parsePaid(paidSection),
  };
}
```

---

## Integration with WeGo Platform

### Database Schema Extension

Add new table for imported InDriver rides:

```sql
CREATE TABLE indriver_rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES drivers(id),

  -- Original extraction data
  source_image_path TEXT NOT NULL,
  extraction_confidence DECIMAL(3,2),

  -- Ride details
  ride_date TIMESTAMP NOT NULL,
  ride_time TIME NOT NULL,
  destination_address TEXT,
  duration_minutes INTEGER,
  distance_km DECIMAL(6,2),

  -- Passenger
  passenger_name TEXT,
  rating_given INTEGER CHECK (rating_given BETWEEN 1 AND 5),

  -- Status
  status VARCHAR(30) NOT NULL,

  -- Payment
  payment_method VARCHAR(20),

  -- Financial (all in COP centavos)
  tarifa BIGINT,
  total_recibido BIGINT,
  comision_servicio BIGINT,
  comision_porcentaje DECIMAL(4,2),
  iva_pago_servicio BIGINT,
  total_pagado BIGINT,
  mis_ingresos BIGINT,

  -- Metadata
  extracted_at TIMESTAMP DEFAULT NOW(),
  imported_at TIMESTAMP DEFAULT NOW(),
  raw_ocr_text TEXT,

  -- Link to WeGo ride (optional)
  wego_ride_id UUID REFERENCES rides(id),

  CONSTRAINT valid_status CHECK (status IN ('completed', 'cancelled_by_passenger', 'cancelled_by_driver'))
);

CREATE INDEX idx_indriver_rides_driver ON indriver_rides(driver_id);
CREATE INDEX idx_indriver_rides_date ON indriver_rides(ride_date);
```

### API Routes

```
POST /api/indriver/extract     - Upload and extract from images
POST /api/indriver/import      - Import extracted data to database
GET  /api/indriver/rides       - List imported InDriver rides
POST /api/indriver/export      - Export rides to CSV/JSON/XLSX
GET  /api/indriver/stats       - Extraction statistics
```

---

## Frontend Components

### New Components Needed

1. **InDriverUploader** - Drag & drop file upload
2. **InDriverReviewTable** - Editable table for review
3. **InDriverRideCard** - Individual ride display
4. **InDriverExportModal** - Export format selection

### Integration Points

- Add to existing Driver Dashboard
- New "Importar InDriver" menu item
- Reports section integration

---

## Error Handling

### OCR Errors

```typescript
enum ExtractionError {
  IMAGE_TOO_SMALL = 'Image resolution too low',
  NO_TEXT_DETECTED = 'No text detected in image',
  INVALID_FORMAT = 'Not a valid InDriver screenshot',
  MISSING_REQUIRED = 'Missing required fields',
  PARSE_ERROR = 'Could not parse extracted text',
}
```

### Validation Errors

- Financial calculations don't match
- Date is in the future
- Duplicate ride detection (same date/time/passenger)

---

## Testing Strategy

### Unit Tests

- Date/time parsing functions
- Currency parsing
- Field extraction patterns
- Financial validation

### Integration Tests

- Full image → extracted data pipeline
- API endpoints
- Database operations

### E2E Tests

- Upload flow
- Review and edit flow
- Export flow

### Test Data

Use the 15 sample screenshots provided as test fixtures.

---

## Security Considerations

1. **File Upload Validation**
   - Check MIME types
   - Limit file sizes (10MB max)
   - Sanitize filenames

2. **Image Storage**
   - Store temporarily during processing
   - Delete after successful import
   - Option to keep for audit

3. **Data Privacy**
   - Passenger names visible only to driver
   - No external API calls with sensitive data (if using Tesseract)

---

## Performance Optimization

1. **Batch Processing**
   - Process multiple images in parallel
   - Web workers for browser OCR
   - Queue system for large batches

2. **Caching**
   - Cache OCR results by image hash
   - Avoid reprocessing same image

3. **Progressive Loading**
   - Show results as they complete
   - Don't wait for entire batch
