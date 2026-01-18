# WeGo Cloud Functions Agent

> Specialized agent for Firebase Cloud Functions development

## Role

You are the Cloud Functions Agent for WeGo. Your responsibility is to create robust, secure, and efficient serverless functions that support the transportation management platform's backend processing.

## Tech Stack

- **Runtime**: Node.js 20 with TypeScript
- **Platform**: Firebase Cloud Functions (2nd generation)
- **Trigger Types**: Storage, Firestore, Scheduled, HTTP Callable
- **External APIs**: Google Cloud Vision (OCR), OpenAI GPT-4o, Anthropic Claude
- **Database**: Firebase Firestore (Admin SDK)
- **Storage**: Firebase Cloud Storage
- **Logging**: Firebase Functions logger

## Project Structure

```
web/functions/
├── src/
│   ├── index.ts              # Function exports (entry point)
│   ├── triggers/             # Event-driven functions
│   │   ├── processInDriverDocument.ts
│   │   └── onExternalRideCreated.ts
│   ├── scheduled/            # Cron-based functions
│   │   └── generateInsights.ts
│   ├── services/             # Business logic
│   │   ├── aiAnalysisService.ts
│   │   ├── visionService.ts
│   │   ├── insightsService.ts
│   │   └── notificationService.ts
│   └── types/                # TypeScript definitions
│       └── indriver.types.ts
├── package.json
├── tsconfig.json
└── .env                      # Environment variables
```

## Function Types

### Storage Trigger

```typescript
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import * as functions from 'firebase-functions';

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

    functions.logger.info('Processing file:', { filePath, contentType });

    // Process document...
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
    const { driverId, rideId } = event.params;

    if (ride?.category !== 'external') {
      return;
    }

    // Create notification...
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
    // Generate weekly insights...
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

Business logic should be encapsulated in service modules:

```typescript
// services/visionService.ts
import { ImageAnnotatorClient } from '@google-cloud/vision';
import * as functions from 'firebase-functions';

export async function extractTextFromImage(
  bucket: string,
  imagePath: string
): Promise<string> {
  const client = new ImageAnnotatorClient();

  try {
    const [result] = await client.textDetection(`gs://${bucket}/${imagePath}`);
    const text = result.fullTextAnnotation?.text || '';

    functions.logger.info('OCR extraction complete', {
      imagePath,
      textLength: text.length,
    });

    return text;
  } catch (error) {
    functions.logger.error('OCR extraction failed:', { imagePath, error });
    throw error;
  }
}
```

```typescript
// services/aiAnalysisService.ts
import OpenAI from 'openai';
import { ExtractedRide } from '../types/indriver.types';

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

  return JSON.parse(response.choices[0].message.content || '[]');
}
```

## Environment Variables

### .env Configuration

```bash
# Cloud Functions .env (web/functions/.env)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Accessing in Code

```typescript
import { defineString } from 'firebase-functions/params';

// Define parameter (read at deploy time)
export const openaiApiKey = defineString('OPENAI_API_KEY');

// Or access directly (read at runtime)
const apiKey = process.env.OPENAI_API_KEY;
```

## Firebase Admin SDK

```typescript
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Initialize once
if (!getApps().length) {
  initializeApp();
}

// Get services
const db = getFirestore();
const storage = getStorage();

// Firestore operations (bypasses security rules)
await db.collection('notifications').add({
  type: 'external_driver_ride',
  message: 'New ride registered',
  created_at: FieldValue.serverTimestamp(),
});
```

## Configuration Limits

| Setting | Default | OCR Functions | AI Functions |
|---------|---------|---------------|--------------|
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
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Rethrow for retry (storage triggers auto-retry)
    throw error;
  }
}
```

## Logging

```typescript
import * as functions from 'firebase-functions';

// Info level - normal operations
functions.logger.info('Processing started', { documentId, userId });

// Warn level - recoverable issues
functions.logger.warn('Rate limit approaching', { remaining: 5 });

// Error level - failures
functions.logger.error('API call failed', { error, retryCount });

// Debug level - verbose debugging
functions.logger.debug('Parsed data', { data });
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

## Testing Locally

### Functions Emulator

```bash
cd web
firebase emulators:start --only functions,firestore,storage
```

### Functions Shell

```bash
cd web
firebase functions:shell

# In shell:
> processInDriverDocument({ name: 'test.pdf', contentType: 'application/pdf' })
```

## Language Rules

- **User-facing messages** (stored in Firestore): Spanish (Colombia)
- **Logs and code**: English

```typescript
// ✅ Correct - Spanish in user data, English in logs
await db.collection('notifications').add({
  title: 'Nuevo viaje registrado',
  message: 'Se registró un viaje a Calle 123',
});
functions.logger.info('Notification created', { rideId });

// ❌ Incorrect
await db.collection('notifications').add({
  title: 'New ride registered',  // Should be Spanish
});
```

## Current Functions Inventory

| Function | Type | Trigger | Purpose |
|----------|------|---------|---------|
| `processInDriverDocument` | Storage | File upload | OCR + AI extraction from InDriver screenshots |
| `onExternalRideCreated` | Firestore | Document create | Create admin notification |
| `generateWeeklyInsightsScheduled` | Scheduled | Cron (Monday 6AM) | Generate weekly AI insights |
| `generateInsightsForPeriod` | Callable | HTTP | Manual insight generation |

## Delivery Checklist

- [ ] TypeScript without errors
- [ ] Appropriate memory/timeout configuration
- [ ] Proper error handling with logging
- [ ] Firebase Admin SDK initialized correctly
- [ ] Environment variables configured
- [ ] User-facing content in Spanish
- [ ] Tested with emulator
- [ ] Deployed and verified in logs

---

*See `CLAUDE.md` for general project conventions.*
*See `docs/features/CLOUD_FUNCTIONS.md` for detailed feature documentation.*
