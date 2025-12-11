# Feature Specification: InDriver PDF/OCR Ride Data Extractor

**Feature ID:** `indriver-pdf-extractor`
**Branch:** `indriver-pdf-extractor`
**Status:** Draft
**Created:** December 2024

---

## 1. Overview

### 1.1 Summary

A high-quality PDF and OCR extraction service for automatically extracting ride information from InDriver app screenshots and PDF exports. This feature automates the tedious process of manually recording ride data for drivers who need to track their earnings, commissions, and trip history.

### 1.2 Problem Statement

InDriver drivers currently need to manually record their ride data from the app for:
- Tracking daily/weekly/monthly earnings
- Tax reporting and commission tracking
- Business analytics and performance monitoring
- Reconciliation with WeGo platform data

This manual process is:
- Time-consuming (15+ rides/day × multiple data points)
- Error-prone (manual transcription mistakes)
- Inconsistent (different data capture methods)

### 1.3 Proposed Solution

Build an intelligent OCR-based extraction system that:
1. Accepts screenshots (PNG/JPG) or PDF exports from InDriver app
2. Uses high-quality OCR to extract structured ride data
3. Parses and validates extracted data against known patterns
4. Returns structured data (JSON/CSV) for database import
5. Integrates with WeGo's existing ride and transaction models

---

## 2. User Stories

### 2.1 Primary User Stories

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US-01 | Driver | Upload multiple ride screenshots at once | I can quickly import all my daily rides |
| US-02 | Driver | See extracted data before confirming import | I can verify accuracy and correct errors |
| US-03 | Driver | Export extracted data to CSV | I can use it in my own spreadsheets |
| US-04 | Administrator | View extraction accuracy metrics | I can monitor OCR quality |
| US-05 | Driver | Automatically match extracted rides with WeGo rides | I have unified reporting |

### 2.2 Acceptance Criteria

**US-01: Batch Upload**
- [ ] Accept multiple image files (PNG, JPG, JPEG)
- [ ] Accept PDF files (single or multi-page)
- [ ] Show upload progress indicator
- [ ] Handle files up to 10MB each
- [ ] Support drag-and-drop upload

**US-02: Review Before Import**
- [ ] Display extracted data in editable table format
- [ ] Highlight low-confidence extractions in yellow
- [ ] Allow manual correction of any field
- [ ] Show original image alongside extracted data
- [ ] Provide "Confirm Import" and "Discard" actions

---

## 3. Data Model

### 3.1 Extracted Ride Data Structure

Based on analysis of InDriver app screenshots, the following fields are extractable:

```typescript
interface ExtractedInDriverRide {
  // Identification
  id: string;                      // Generated UUID
  sourceImagePath: string;         // Original file reference
  extractionConfidence: number;    // 0-1 overall confidence score

  // Ride Details
  date: Date;                      // e.g., "mar, 2 dic 2025"
  time: string;                    // e.g., "07:52 a.m."
  destinationAddress: string;      // e.g., "Cl. 64b #20 65"
  duration: {
    value: number;                 // e.g., 20
    unit: 'min' | 'hr';            // Typically minutes
  };
  distance: {
    value: number;                 // e.g., 6.4
    unit: 'km' | 'metro';          // Kilometers or meters
  };

  // Passenger Info
  passengerName: string;           // e.g., "Estefania"
  ratingGiven?: number;            // 1-5 stars (if rated)

  // Status
  status: 'completed' | 'cancelled_by_passenger' | 'cancelled_by_driver';
  cancellationReason?: string;     // e.g., "El pasajero canceló"

  // Payment
  paymentMethod: 'cash' | 'nequi' | 'other';
  paymentMethodLabel: string;      // e.g., "Pago en efectivo", "Nequi"

  // Financial - Income (Recibí)
  tarifa: number;                  // Fare charged, e.g., 15000
  totalRecibido: number;           // Total received, e.g., 15000

  // Financial - Deductions (Pagué)
  comisionServicio: number;        // Platform commission (9.5%), e.g., 1425
  comisionPorcentaje: number;      // Commission percentage, e.g., 9.5
  ivaPagoServicio: number;         // IVA tax on service, e.g., 270.75
  totalPagado: number;             // Total paid to InDriver, e.g., 1695.75

  // Financial - Net
  misIngresos: number;             // Net driver income, e.g., 13304.25

  // Metadata
  extractedAt: Date;
  rawOcrText?: string;             // Full OCR output for debugging
  fieldConfidences: {              // Per-field confidence scores
    [field: string]: number;
  };
}
```

### 3.2 Currency Handling

All monetary values are in **Colombian Pesos (COP)**:
- Stored as integers (centavos) or decimals with 2 decimal places
- Display format: `$XX,XXX.XX COP` or `COP XX,XXX.XX`
- Thousand separator: comma (`,`) or period (`.`) depending on source
- Decimal separator: period (`.`)

### 3.3 Date/Time Parsing

InDriver uses Spanish date format:
- Full date: `"mar, 2 dic 2025"` → Tuesday, December 2, 2025
- Time: `"07:52 a.m."` or `"04:01 p.m."` → 24h format internally

Day abbreviations mapping:
| Spanish | Day |
|---------|-----|
| lun | Monday |
| mar | Tuesday |
| mié | Wednesday |
| jue | Thursday |
| vie | Friday |
| sáb | Saturday |
| dom | Sunday |

Month abbreviations mapping:
| Spanish | Month |
|---------|-------|
| ene | January |
| feb | February |
| mar | March |
| abr | April |
| may | May |
| jun | June |
| jul | July |
| ago | August |
| sep | September |
| oct | October |
| nov | November |
| dic | December |

---

## 4. Technical Architecture

### 4.1 OCR Engine Options

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **Tesseract.js** | Free, local, no API limits | Lower accuracy on mobile screenshots | Good for MVP |
| **Google Cloud Vision** | High accuracy, Spanish support | API costs, internet required | Best accuracy |
| **Azure Computer Vision** | High accuracy, good structured data | API costs | Alternative |
| **AWS Textract** | Document-focused, table extraction | More complex, higher cost | Overkill |

**Recommended Approach:** Start with **Tesseract.js** for local processing, with option to upgrade to **Google Cloud Vision** for production.

### 4.2 Processing Pipeline

```
┌─────────────────┐
│  Image Upload   │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Pre-processing  │  ← Resize, contrast, denoise
└────────┬────────┘
         ▼
┌─────────────────┐
│   OCR Engine    │  ← Extract raw text
└────────┬────────┘
         ▼
┌─────────────────┐
│  Text Parsing   │  ← Pattern matching, regex
└────────┬────────┘
         ▼
┌─────────────────┐
│   Validation    │  ← Cross-check values, calculate totals
└────────┬────────┘
         ▼
┌─────────────────┐
│ Structured Data │  ← ExtractedInDriverRide
└─────────────────┘
```

### 4.3 Text Extraction Patterns

Key patterns to recognize:

```typescript
const PATTERNS = {
  // Date: "mar, 2 dic 2025"
  date: /^(lun|mar|mié|jue|vie|sáb|dom),?\s*(\d{1,2})\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\s+(\d{4})$/i,

  // Time: "07:52 a.m." or "04:01 p.m."
  time: /(\d{1,2}):(\d{2})\s*(a\.?m\.?|p\.?m\.?)/i,

  // Duration: "20 min." or "1 hr."
  duration: /Duración\s*(\d+)\s*(min|hr)\.?/i,

  // Distance: "6,4 km" or "715 metro"
  distance: /Distancia\s*([\d,\.]+)\s*(km|metro)/i,

  // Currency: "COP 15,000.00" or "COP 1,425.00"
  currency: /COP\s*([\d,\.]+)/g,

  // Percentage: "9.5%"
  percentage: /([\d,\.]+)\s*%/,

  // Status: "El pasajero canceló"
  cancelled: /pasajero\s+canceló/i,

  // Payment method
  paymentCash: /pago\s+en\s+efectivo/i,
  paymentNequi: /nequi/i,
};
```

### 4.4 Validation Rules

```typescript
const VALIDATION_RULES = {
  // Financial consistency
  netIncome: (ride) => {
    const expected = ride.totalRecibido - ride.totalPagado;
    return Math.abs(ride.misIngresos - expected) < 1; // Allow 1 COP rounding
  },

  // Commission calculation
  commission: (ride) => {
    const expected = ride.tarifa * (ride.comisionPorcentaje / 100);
    return Math.abs(ride.comisionServicio - expected) < 1;
  },

  // IVA calculation (19% of commission)
  iva: (ride) => {
    const expected = ride.comisionServicio * 0.19;
    return Math.abs(ride.ivaPagoServicio - expected) < 1;
  },

  // Total paid consistency
  totalPaid: (ride) => {
    const expected = ride.comisionServicio + ride.ivaPagoServicio;
    return Math.abs(ride.totalPagado - expected) < 1;
  },
};
```

---

## 5. API Contracts

### 5.1 Upload and Extract Endpoint

```typescript
// POST /api/indriver/extract
// Content-Type: multipart/form-data

interface ExtractRequest {
  files: File[];  // Multiple image/PDF files
}

interface ExtractResponse {
  success: boolean;
  results: ExtractedInDriverRide[];
  errors: {
    fileName: string;
    error: string;
  }[];
  summary: {
    totalFiles: number;
    successfulExtractions: number;
    failedExtractions: number;
    averageConfidence: number;
  };
}
```

### 5.2 Confirm Import Endpoint

```typescript
// POST /api/indriver/import
// Content-Type: application/json

interface ImportRequest {
  rides: ExtractedInDriverRide[];  // With any manual corrections
  driverId: string;
}

interface ImportResponse {
  success: boolean;
  imported: {
    rideId: string;
    externalId: string;  // Reference to InDriver ride
  }[];
  skipped: {
    index: number;
    reason: string;
  }[];
}
```

### 5.3 Export Endpoint

```typescript
// POST /api/indriver/export
// Content-Type: application/json

interface ExportRequest {
  rides: ExtractedInDriverRide[];
  format: 'csv' | 'json' | 'xlsx';
}

// Response: File download
```

---

## 6. UI Components

### 6.1 Upload Interface

```
┌─────────────────────────────────────────────────────────┐
│  Importar Viajes de InDriver                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│    ┌─────────────────────────────────────────────┐     │
│    │                                             │     │
│    │         Arrastra tus capturas aquí         │     │
│    │              o haz clic para               │     │
│    │            seleccionar archivos            │     │
│    │                                             │     │
│    │  Formatos: PNG, JPG, PDF (máx. 10MB c/u)  │     │
│    │                                             │     │
│    └─────────────────────────────────────────────┘     │
│                                                         │
│  Archivos seleccionados: 0                              │
│                                                         │
│  [Procesar Capturas]                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Review Interface

```
┌─────────────────────────────────────────────────────────┐
│  Revisar Datos Extraídos                    [Exportar ▼]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│  15 viajes extraídos | Confianza promedio: 94%          │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ # │ Fecha      │ Hora  │ Pasajero  │ Ingresos    │ │
│  ├───────────────────────────────────────────────────┤ │
│  │ 1 │ 02/12/2025 │ 07:52 │ Estefania │ $13.304,25  │ │
│  │ 2 │ 02/12/2025 │ 08:01 │ Fredy     │ $7.450,38   │ │
│  │ 3 │ 02/12/2025 │ 08:28 │ Silvana   │ $8.869,50   │ │
│  │ ⚠ │ 02/12/2025 │ 10:05 │ Tatiana   │ Cancelado   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Total Ingresos: $XX.XXX,XX COP                        │
│  Total Comisiones: $X.XXX,XX COP                       │
│                                                         │
│  [Descartar]                    [Confirmar Importación] │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| OCR Accuracy | >95% | Correctly extracted fields vs. total fields |
| Processing Time | <3s per image | Average extraction time |
| User Correction Rate | <10% | Fields manually corrected by users |
| Adoption Rate | >50% of drivers | Active users vs. total drivers |

---

## 8. Out of Scope (v1)

- Real-time camera capture (future: mobile app feature)
- Automatic periodic import from device
- Integration with InDriver API (if available)
- Multi-platform support (Uber, Didi, etc.) - future feature
- Historical data import (large batch processing)

---

## 9. Dependencies

- `tesseract.js` - OCR engine
- `sharp` or `jimp` - Image preprocessing
- `pdf-parse` or `pdf-lib` - PDF handling
- `zod` - Data validation
- Existing WeGo design system components
- Existing authentication system

---

## 10. Timeline Considerations

**Phase 1 - MVP:**
- Basic image upload
- OCR extraction with Tesseract
- Simple review interface
- JSON/CSV export

**Phase 2 - Enhancement:**
- Improved OCR accuracy (Google Vision option)
- Batch processing optimization
- Database integration with WeGo rides
- Reporting dashboard

**Phase 3 - Advanced:**
- AI-powered field recognition
- Automatic ride matching
- Mobile app integration
- Multi-platform support

---

## Appendix A: Sample OCR Output Analysis

From analyzed screenshots, typical OCR output structure:

```
mar, 2 dic 2025
Cl. 64b #20 65
07:52 a.m.
Duración
20 min.
Distancia
6,4 km

Estefania
Calificaste ★★★★★

Recibo          Soporte

Mis ingresos
COP 13,304.25

Recibí
Tarifa                     COP 15,000.00
Total recibido             COP 15,000.00
Pago en efectivo

Pagué
Nuestros pagos por el servicio son
bajos (9.5%)               COP 1,425.00
IVA del pago por el servicio  COP 270.75
Total pagado               COP 1,695.75
```

---

*Specification created for WeGo Internal Management Platform*
