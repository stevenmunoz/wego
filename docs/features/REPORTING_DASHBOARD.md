# Reporting Dashboard

> Comprehensive analytics dashboard with charts, metrics, and goal tracking

## Overview

The Reporting Dashboard provides administrators with a complete view of business performance through real-time analytics. It aggregates ride data, financial metrics, and vehicle statistics into interactive charts and summary cards.

The feature includes goal management allowing admins to set targets for metrics like rides per week or revenue per month. Goals are compared against actual performance with visual indicators.

**Key Capabilities:**
- Real-time data via Firestore subscriptions
- Summary cards (total rides, earnings, commission, cancellation rate)
- Rides by source comparison (InDriver, external, independent)
- Payment method distribution charts
- Daily trend analysis with goal comparison
- Driver efficiency rankings
- Vehicle utilization metrics
- Peak hours heatmap
- Goal creation and tracking

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                REPORTING DASHBOARD ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend (React/TypeScript)                                    │
│  ├─ Page: ReportingPage.tsx                                    │
│  ├─ Components:                                                 │
│  │   ├─ SummaryCards (KPI cards)                               │
│  │   ├─ RidesBySourceChart (pie chart)                         │
│  │   ├─ PaymentMethodChart (pie chart)                         │
│  │   ├─ DailyTrendChart (line chart)                           │
│  │   ├─ DriverEfficiencyTable (rankings)                       │
│  │   ├─ VehicleEfficiencyTable (utilization)                   │
│  │   ├─ PeakHoursHeatmap (hour distribution)                   │
│  │   └─ GoalsManager (CRUD for goals)                          │
│  ├─ Hooks:                                                      │
│  │   ├─ useReportingData (aggregated metrics)                  │
│  │   └─ useReportingGoals (goal management)                    │
│  └─ Utils: aggregations.ts (data calculations)                 │
│                                                                 │
│  Charts Library: Recharts                                        │
│                                                                 │
│  Firebase/Firestore                                             │
│  ├─ Collection Group: driver_rides (real-time)                 │
│  └─ Collection: reporting_goals                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## User Stories

1. **As an admin**, I can see total rides and earnings so that I understand business volume
2. **As an admin**, I can compare ride sources so that I know which channels are most effective
3. **As an admin**, I can view daily trends so that I identify patterns over time
4. **As an admin**, I can see driver rankings so that I know who performs best
5. **As an admin**, I can set goals so that I have targets to measure against
6. **As an admin**, I can filter by date range so that I analyze specific periods

## Key Files

### Frontend

| File | Purpose |
|------|---------|
| `web/src/pages/ReportingPage.tsx` | Main reporting page (admin only) |
| `web/src/features/reporting/hooks/useReportingData.ts` | Data aggregation hook |
| `web/src/features/reporting/hooks/useReportingGoals.ts` | Goal management hook |
| `web/src/features/reporting/types/reporting.types.ts` | TypeScript definitions |
| `web/src/features/reporting/utils/aggregations.ts` | Calculation utilities |

## Data Model

### Reporting Metrics

```typescript
interface ReportingMetrics {
  // Summary
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  cancellationRate: number;        // percentage

  // Financial
  totalEarnings: number;           // sum of mis_ingresos
  totalCommission: number;         // sum of comision_servicio
  averageRideValue: number;

  // Distance
  totalDistance: number;           // in km

  // By source
  ridesBySource: {
    indriver: number;
    external: number;
    independent: number;
    other: number;
  };

  // By payment method
  ridesByPayment: {
    cash: number;
    nequi: number;
    other: number;
  };

  // Daily breakdown
  dailyTrend: Array<{
    date: string;
    rides: number;
    earnings: number;
  }>;

  // Driver rankings
  driverEfficiency: Array<{
    driverId: string;
    driverName: string;
    rides: number;
    earnings: number;
    avgRideValue: number;
  }>;

  // Vehicle utilization
  vehicleEfficiency: Array<{
    vehicleId: string;
    plate: string;
    rides: number;
    earnings: number;
  }>;

  // Peak hours (0-23)
  peakHours: Record<number, number>;
}
```

### Firestore Collection: `reporting_goals`

```typescript
interface ReportingGoal {
  id: string;
  name: string;                    // e.g., "Weekly Rides Target"
  metric: GoalMetric;              // What to measure
  target_value: number;            // Target number
  period: 'daily' | 'weekly' | 'monthly';
  is_active: boolean;
  created_at: Timestamp;
  created_by: string;              // Admin user ID
}

type GoalMetric =
  | 'total_rides'
  | 'total_earnings'
  | 'avg_ride_value'
  | 'completion_rate';
```

## Chart Components

### Recharts Usage

```tsx
// Example: Daily Trend Chart
<LineChart data={dailyTrend}>
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Line type="monotone" dataKey="rides" stroke="#F05365" />
  {goalValue && (
    <ReferenceLine y={goalValue} stroke="#16A34A" strokeDasharray="5 5" />
  )}
</LineChart>
```

## Real-Time Updates

The dashboard uses Firestore real-time listeners:

```typescript
useEffect(() => {
  const unsubscribe = onSnapshot(
    query(collectionGroup(db, 'driver_rides'), where('date', '>=', startDate)),
    (snapshot) => {
      const rides = snapshot.docs.map(doc => doc.data());
      setMetrics(calculateMetrics(rides));
    }
  );
  return () => unsubscribe();
}, [startDate, endDate]);
```

## Common Issues and Solutions

### Issue: Dashboard loads slowly

**Symptoms:** Long loading time, especially with large date ranges

**Root Cause:** Collection group query returning too many documents

**Solution:** Limit date range or add pagination:
```typescript
const q = query(
  collectionGroup(db, 'driver_rides'),
  where('date', '>=', thirtyDaysAgo),
  orderBy('date', 'desc'),
  limit(1000)
);
```

### Issue: Charts not rendering

**Symptoms:** Empty chart area, no errors in console

**Root Cause:** Data format doesn't match Recharts expectations

**Solution:** Ensure data keys match chart configuration:
```typescript
// Data must have exact keys used in chart
const data = rides.map(r => ({
  date: formatDate(r.date),  // Must match XAxis dataKey
  rides: r.count,            // Must match Line dataKey
}));
```

### Issue: Goals not saving

**Symptoms:** Goal creation fails silently

**Root Cause:** Missing required fields or permission denied

**Solution:** Check Firestore rules allow admin writes:
```javascript
match /reporting_goals/{goalId} {
  allow read, write: if isAdmin();
}
```

## Related Documentation

- [AI Insights](./AI_INSIGHTS.md) - AI-generated analysis
- [Ride Management](./RIDE_MANAGEMENT.md) - Source data for reports

---

**Last Updated**: January 2025
