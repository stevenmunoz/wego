# Cloud Functions

> Firebase Cloud Functions backend architecture for serverless processing

## Overview

WeGo's backend is implemented using Firebase Cloud Functions (2nd generation) with Node.js 20 and TypeScript. Functions handle asynchronous processing that can't run in the browser, including OCR extraction, AI analysis, scheduled tasks, and event-driven triggers.

The architecture follows a service-oriented pattern where business logic is encapsulated in service modules, and functions serve as thin entry points that invoke these services.

**Key Capabilities:**
- Storage triggers for file processing (InDriver OCR)
- Firestore triggers for event handling (notifications)
- Scheduled functions for automated tasks (weekly insights)
- HTTP callable functions for on-demand operations
- Integration with external APIs (Google Vision, OpenAI, Anthropic)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  CLOUD FUNCTIONS ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  web/functions/                                                 │
│  ├─ src/                                                        │
│  │   ├─ index.ts              # Function exports (entry point) │
│  │   ├─ triggers/             # Event-driven functions          │
│  │   │   ├─ processInDriverDocument.ts                         │
│  │   │   └─ onExternalRideCreated.ts                           │
│  │   ├─ scheduled/            # Cron-based functions            │
│  │   │   └─ generateInsights.ts                                │
│  │   ├─ services/             # Business logic                  │
│  │   │   ├─ aiAnalysisService.ts                               │
│  │   │   ├─ visionService.ts                                   │
│  │   │   ├─ insightsService.ts                                 │
│  │   │   └─ notificationService.ts                             │
│  │   └─ types/                # TypeScript definitions          │
│  │       └─ indriver.types.ts                                  │
│  ├─ package.json                                                │
│  ├─ tsconfig.json                                               │
│  └─ .env                      # Environment variables           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Functions Inventory

| Function | Type | Trigger | Purpose |
|----------|------|---------|---------|
| `processInDriverDocument` | Storage | File upload | OCR + AI extraction from InDriver screenshots |
| `onExternalRideCreated` | Firestore | Document create | Create admin notification |
| `generateWeeklyInsightsScheduled` | Scheduled | Cron (Monday 1AM) | Generate weekly AI insights |
| `generateInsightsForPeriod` | Callable | HTTP | Manual insight generation |

## Function Types

### Storage Trigger

```typescript
import { onObjectFinalized } from 'firebase-functions/v2/storage';

export const processInDriverDocument = onObjectFinalized(
  {
    bucket: 'wego-dev-a5a13.appspot.com',
    region: 'us-central1',
    memory: '1GiB',
    timeoutSeconds: 540,
    concurrency: 10,
  },
  async (event) => {
    const filePath = event.data.name;
    const contentType = event.data.contentType;

    // Validate file type
    if (!contentType?.startsWith('image/') && contentType !== 'application/pdf') {
      return;
    }

    // Process document
    const ocrText = await extractTextFromDocument(filePath);
    const rides = await extractRideData(ocrText);

    // Save results to Firestore
    await saveExtractionResults(filePath, rides);
  }
);
```

### Firestore Trigger

```typescript
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

export const onExternalRideCreated = onDocumentCreated(
  {
    document: 'drivers/{driverId}/driver_rides/{rideId}',
    region: 'us-central1',
  },
  async (event) => {
    const ride = event.data?.data();

    if (ride?.category !== 'external') {
      return;
    }

    await createNotification({
      type: 'external_driver_ride',
      message: `New ride registered to ${ride.destination_address}`,
    });
  }
);
```

### Scheduled Function

```typescript
import { onSchedule } from 'firebase-functions/v2/scheduler';

export const generateWeeklyInsightsScheduled = onSchedule(
  {
    schedule: '0 6 * * 1',         // Every Monday at 6 AM UTC
    timeZone: 'America/Bogota',
    memory: '512MiB',
    timeoutSeconds: 300,
  },
  async () => {
    const previousWeek = getPreviousWeekRange();
    await generateInsights('weekly', previousWeek.periodId);
  }
);
```

### HTTP Callable

```typescript
import { onCall, HttpsError } from 'firebase-functions/v2/https';

export const generateInsightsForPeriod = onCall(
  {
    memory: '512MiB',
    timeoutSeconds: 300,
  },
  async (request) => {
    // Auth check
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be authenticated');
    }

    const { periodType, periodId } = request.data;
    return await generateInsights(periodType, periodId);
  }
);
```

## Service Pattern

Business logic is encapsulated in service modules:

```typescript
// services/visionService.ts
export async function extractTextFromImage(imagePath: string): Promise<string> {
  const client = new ImageAnnotatorClient();
  const [result] = await client.textDetection(`gs://${bucket}/${imagePath}`);
  return result.fullTextAnnotation?.text || '';
}

// services/aiAnalysisService.ts
export async function extractRideData(ocrText: string): Promise<ExtractedRide[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: EXTRACTION_PROMPT },
      { role: 'user', content: ocrText },
    ],
    response_format: { type: 'json_schema', json_schema: RIDE_SCHEMA },
  });

  return JSON.parse(response.choices[0].message.content);
}
```

## Environment Variables

### .env file

```bash
# OpenAI API Key (InDriver extraction)
OPENAI_API_KEY=sk-...

# Anthropic API Key (AI Insights)
ANTHROPIC_API_KEY=sk-ant-...
```

### Accessing in Code

```typescript
import { defineString } from 'firebase-functions/params';

export const openaiApiKey = defineString('OPENAI_API_KEY');

// Usage
const apiKey = openaiApiKey.value();
```

## Deployment

### Deploy All Functions

```bash
cd web/functions
npm run build
firebase deploy --only functions
```

### Deploy Specific Function

```bash
firebase deploy --only functions:processInDriverDocument
```

### View Logs

```bash
firebase functions:log
firebase functions:log --only processInDriverDocument
```

## Configuration Limits

| Setting | Default | InDriver OCR | Insights |
|---------|---------|--------------|----------|
| Memory | 256MB | 1GB | 512MB |
| Timeout | 60s | 540s (9min) | 300s (5min) |
| Concurrency | 80 | 10 | 1 |
| Max Instances | 100 | 10 | 1 |

## Error Handling

```typescript
import * as functions from 'firebase-functions';

export async function processDocument(path: string) {
  try {
    // Processing logic
  } catch (error) {
    functions.logger.error('Processing failed:', {
      path,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error; // Rethrow for retry (storage triggers)
  }
}
```

## Common Issues and Solutions

### Issue: Function timeout

**Symptoms:** Function killed after timeout, partial processing

**Root Cause:** Processing takes longer than configured timeout

**Solution:** Increase timeout or optimize processing:
```typescript
{
  timeoutSeconds: 540,  // 9 minutes max for 2nd gen
}
```

### Issue: Memory exceeded

**Symptoms:** "Function killed with error: out of memory"

**Root Cause:** Processing large files or holding too much data

**Solution:** Increase memory allocation:
```typescript
{
  memory: '1GiB',  // Options: 128MiB to 32GiB
}
```

### Issue: Environment variable undefined

**Symptoms:** `apiKey.value()` returns undefined

**Root Cause:** .env file not deployed or not in correct location

**Solution:** Ensure .env is in functions directory:
```bash
web/functions/.env  # Must be here
```

### Issue: Permission denied on Firestore

**Symptoms:** PERMISSION_DENIED when writing to Firestore

**Root Cause:** Security rules blocking server-side writes

**Solution:** Cloud Functions use Admin SDK which bypasses rules, but check initialization:
```typescript
import { initializeApp, getApps } from 'firebase-admin/app';

if (!getApps().length) {
  initializeApp();
}
```

## Testing Locally

### Functions Emulator

```bash
cd web
firebase emulators:start --only functions
```

### Functions Shell

```bash
firebase functions:shell

# In shell:
> processInDriverDocument({name: 'test.pdf', contentType: 'application/pdf'})
```

## Related Documentation

- [InDriver Import](./INDRIVER_IMPORT.md) - Uses processInDriverDocument
- [AI Insights](./AI_INSIGHTS.md) - Uses generateWeeklyInsightsScheduled
- [Notifications](./NOTIFICATIONS.md) - Uses onExternalRideCreated
- [Architecture](../architecture/CLEAN_ARCHITECTURE.md) - System overview

---

**Last Updated**: January 2025
