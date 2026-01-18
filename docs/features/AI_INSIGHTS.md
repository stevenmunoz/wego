# AI Insights

> Claude-powered weekly business summaries with automated generation

## Overview

The AI Insights feature provides AI-generated business analysis using Anthropic's Claude API. Every Monday at 1:00 AM Colombia time, the system automatically generates a comprehensive weekly summary analyzing rides, revenue, driver performance, and vehicle utilization.

Admins can view current and historical insights through a dedicated page. The insights are written in a conversational, email-style format personalized with the business owner's name and include actionable recommendations.

**Key Capabilities:**
- Automated weekly insight generation (Monday 1 AM Colombia time)
- Manual insight generation for any period (admin callable)
- Historical insight browsing with week picker
- Conversational AI-generated analysis
- Metrics coverage: rides, revenue, drivers, vehicles, trends
- Mobile-responsive history drawer

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   AI INSIGHTS ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend (React/TypeScript)                                    │
│  ├─ Page: InsightsPage.tsx                                     │
│  ├─ Components:                                                 │
│  │   ├─ InsightsSummary (main content display)                 │
│  │   ├─ WeekPicker (week selection)                            │
│  │   └─ InsightsHistory (sidebar/drawer)                       │
│  ├─ Hooks:                                                      │
│  │   ├─ useWeeklyInsights (current week)                       │
│  │   └─ useWeeklyInsightsHistory (historical)                  │
│  └─ Types: insights.types.ts                                   │
│                                                                 │
│  Cloud Functions                                                 │
│  ├─ Scheduled: generateWeeklyInsightsScheduled                 │
│  │   └─ Runs: 0 6 * * 1 (Monday 1 AM Colombia / 6 AM UTC)     │
│  ├─ Callable: generateInsightsForPeriod                        │
│  └─ Service: insightsService.ts                                │
│                                                                 │
│  External Services                                               │
│  └─ Anthropic Claude API (claude-3-opus)                       │
│                                                                 │
│  Firebase/Firestore                                             │
│  └─ Collection: insights/{insightId}                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## User Stories

1. **As an admin**, I can view this week's AI-generated insights so that I understand business performance
2. **As an admin**, I can browse historical insights so that I can compare trends over time
3. **As an admin**, I can manually trigger insight generation so that I get fresh analysis on demand
4. **As an admin**, I receive automated weekly summaries so that I stay informed without manual effort

## Key Files

### Frontend

| File | Purpose |
|------|---------|
| `web/src/pages/InsightsPage.tsx` | Main insights page (admin only) |
| `web/src/features/insights/hooks/useWeeklyInsights.ts` | Current week insight |
| `web/src/features/insights/hooks/useWeeklyInsightsHistory.ts` | Historical insights |
| `web/src/components/InsightsSummary/InsightsSummary.tsx` | Insight content display |

### Cloud Functions

| File | Purpose |
|------|---------|
| `web/functions/src/scheduled/generateInsights.ts` | Scheduled generation trigger |
| `web/functions/src/services/insightsService.ts` | Insight generation logic |
| `web/functions/src/index.ts` | Function exports |

## Data Model

### Firestore Collection: `insights`

```typescript
interface WeeklyInsight {
  id: string;
  period_type: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  period_id: string;               // e.g., "2025-W03"
  period_start: Timestamp;
  period_end: Timestamp;

  // Generated content
  summary: string;                 // AI-generated HTML/markdown content
  highlights: string[];            // Key takeaways

  // Metrics snapshot
  metrics: {
    total_rides: number;
    completed_rides: number;
    cancelled_rides: number;
    total_revenue: number;
    total_commission: number;
    net_earnings: number;
    top_driver?: { id: string; name: string; rides: number };
    busiest_day?: string;
    avg_ride_value: number;
  };

  // Metadata
  generated_at: Timestamp;
  generated_by: 'scheduled' | 'manual';
  model_used: string;              // e.g., "claude-3-opus-20240229"
}
```

## Cloud Function Configuration

### Scheduled Function

```typescript
export const generateWeeklyInsightsScheduled = onSchedule(
  {
    schedule: '0 6 * * 1',         // Every Monday at 6 AM UTC (1 AM Colombia)
    timeZone: 'America/Bogota',
    memory: '512MiB',
    timeoutSeconds: 300,
  },
  async () => {
    await generateWeeklyInsights();
  }
);
```

### Callable Function

```typescript
export const generateInsightsForPeriod = onCall(
  {
    memory: '512MiB',
    timeoutSeconds: 300,
  },
  async (request) => {
    // Admin-only check
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be authenticated');
    }

    const { periodType, periodId } = request.data;
    return await generateInsights(periodType, periodId);
  }
);
```

## Environment Variables

### Cloud Functions (.env)

```bash
# Anthropic API Key for Claude
ANTHROPIC_API_KEY=your-anthropic-api-key
```

## AI Prompt Structure

The insight generation uses a system prompt that:
1. Provides business context (WeGo transportation platform)
2. Includes metrics data from the period
3. Requests conversational, email-style format
4. Asks for specific sections (summary, highlights, recommendations)
5. Personalizes with owner name when available

## Common Issues and Solutions

### Issue: Insights not generating on schedule

**Symptoms:** No new insight on Monday morning

**Root Cause:** Cloud Function not deployed or schedule misconfigured

**Solution:** Check function logs and redeploy:
```bash
firebase functions:log --only generateWeeklyInsightsScheduled
firebase deploy --only functions:generateWeeklyInsightsScheduled
```

### Issue: Empty or generic insights

**Symptoms:** Insight content is vague or mentions no specific data

**Root Cause:** No rides data in the period or API key issue

**Solution:** Verify data exists and API key is configured:
```bash
firebase functions:config:get
```

### Issue: Insights page shows loading indefinitely

**Symptoms:** Spinner never stops on insights page

**Root Cause:** Firestore query returning no results or permission denied

**Solution:** Check admin role and Firestore rules:
```javascript
match /insights/{insightId} {
  allow read: if isAdmin();
  allow write: if false; // Only Cloud Functions write
}
```

## Related Documentation

- [Reporting Dashboard](./REPORTING_DASHBOARD.md) - Manual analytics view
- [Cloud Functions](./CLOUD_FUNCTIONS.md) - Backend architecture
- [Authentication](./AUTHENTICATION.md) - Admin role verification

---

**Last Updated**: January 2025
