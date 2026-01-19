# Vehicle Finances

> Profit/Loss tracking for individual vehicles with income and expense management

## Overview

The Vehicle Finances feature provides comprehensive financial tracking for fleet vehicles. Owners can record income (weekly payments, tips, bonuses) and expenses (fuel, maintenance, insurance) per vehicle, enabling accurate P/L analysis.

The system supports recurring transactions, receipt uploads, and provides summary cards showing total income, expenses, net profit, and profit margin. Date range filtering allows analysis of specific periods.

**Key Capabilities:**
- Income tracking by type (weekly payment, tip share, bonus, other)
- Expense tracking by category (fuel, maintenance, SOAT, Tecnomecanica, etc.)
- Recurring transaction support (weekly, biweekly, monthly)
- Receipt upload for both income and expenses
- P/L summary with profit margin calculation
- Date range filtering (7 days, 30 days, 3 months, 12 months)
- Income and expense breakdown charts

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                VEHICLE FINANCES ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend (React/TypeScript)                                    │
│  ├─ Page: VehicleFinancesPage.tsx                              │
│  ├─ Components:                                                 │
│  │   ├─ PLSummaryCards (P/L overview cards)                    │
│  │   ├─ TransactionsTable (income/expense list)                │
│  │   ├─ IncomeForm (add/edit income modal)                     │
│  │   └─ ExpenseForm (add/edit expense modal)                   │
│  ├─ Hook: useVehicleFinances                                   │
│  └─ Types: vehicle-finance.types.ts                            │
│                                                                 │
│  Firebase/Firestore                                             │
│  ├─ Subcollection: vehicles/{vehicleId}/income                 │
│  └─ Subcollection: vehicles/{vehicleId}/expenses               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## User Stories

1. **As a vehicle owner**, I can record weekly rental income so that I track what I receive
2. **As a vehicle owner**, I can record fuel expenses so that I track operating costs
3. **As a vehicle owner**, I can set up recurring expenses so that regular costs are auto-tracked
4. **As a vehicle owner**, I can upload receipts so that I have documentation
5. **As a vehicle owner**, I can see my net profit so that I know if the vehicle is profitable

## Key Files

### Frontend

| File | Purpose |
|------|---------|
| `web/src/pages/VehicleFinancesPage.tsx` | Main finances page |
| `web/src/components/VehicleFinances/PLSummaryCards.tsx` | P/L summary display |
| `web/src/components/VehicleFinances/TransactionsTable.tsx` | Transaction list |
| `web/src/hooks/useVehicleFinances.ts` | Finance data hook |
| `web/src/core/firebase/vehicle-finances.ts` | Firestore operations |
| `web/src/core/types/vehicle-finance.types.ts` | TypeScript definitions |

## Data Model

### Income Types

```typescript
type IncomeType = 'weekly_payment' | 'tip_share' | 'bonus' | 'other';
```

### Expense Categories

```typescript
type ExpenseCategory =
  | 'fuel'
  | 'maintenance'
  | 'insurance_soat'
  | 'tecnomecanica'
  | 'taxes'
  | 'fines'
  | 'parking'
  | 'car_wash'
  | 'accessories'
  | 'other';
```

### Firestore: `vehicles/{vehicleId}/income`

```typescript
interface VehicleIncome {
  id: string;
  vehicle_id: string;
  owner_id: string;
  type: IncomeType;
  amount: number;                  // Amount in COP
  description: string;
  date: Timestamp;
  is_recurring: boolean;
  recurrence_pattern?: {
    frequency: 'weekly' | 'biweekly' | 'monthly';
    next_date: Timestamp;
  };
  driver_id?: string;
  driver_name?: string;
  receipt_url?: string;
  notes?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### Firestore: `vehicles/{vehicleId}/expenses`

```typescript
interface VehicleExpense {
  id: string;
  vehicle_id: string;
  owner_id: string;
  category: ExpenseCategory;
  amount: number;                  // Amount in COP
  description: string;
  date: Timestamp;
  is_recurring: boolean;
  recurrence_pattern?: {
    frequency: 'weekly' | 'biweekly' | 'monthly';
    next_date: Timestamp;
  };
  vendor?: string;
  receipt_url?: string;
  notes?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### P/L Summary

```typescript
interface VehiclePLSummary {
  vehicle_id: string;
  period: { start_date: Date; end_date: Date };
  total_income: number;
  total_expenses: number;
  net_profit: number;              // total_income - total_expenses
  profit_margin: number;           // (net_profit / total_income) * 100
  income_by_type: Record<IncomeType, number>;
  expenses_by_category: Record<ExpenseCategory, number>;
}
```

## Security Rules

```javascript
// Firestore Security Rules for vehicle finances
match /vehicles/{vehicleId}/income/{incomeId} {
  allow read: if request.auth != null &&
    (vehicleOwnershipCheck(vehicleId) || isAdmin());
  allow create: if request.auth != null &&
    (request.resource.data.owner_id == request.auth.uid || isAdmin());
  allow update, delete: if request.auth != null &&
    (resource.data.owner_id == request.auth.uid || isAdmin());
}

match /vehicles/{vehicleId}/expenses/{expenseId} {
  allow read: if request.auth != null &&
    (vehicleOwnershipCheck(vehicleId) || isAdmin());
  allow create: if request.auth != null &&
    (request.resource.data.owner_id == request.auth.uid || isAdmin());
  allow update, delete: if request.auth != null &&
    (resource.data.owner_id == request.auth.uid || isAdmin());
}
```

## Common Issues and Solutions

### Issue: Undefined values cause Firestore error

**Symptoms:** "Value for argument 'data' contains undefined" error

**Root Cause:** Firestore doesn't accept `undefined` values

**Solution:** Filter out undefined fields before write:
```typescript
const cleanData = Object.fromEntries(
  Object.entries(data).filter(([_, v]) => v !== undefined)
);
await addDoc(collection(db, path), cleanData);
```

### Issue: P/L calculations incorrect

**Symptoms:** Net profit doesn't match manual calculation

**Root Cause:** Date filtering not applied consistently

**Solution:** Ensure date range is applied to both income and expense queries:
```typescript
const incomeQuery = query(
  collection(db, `vehicles/${vehicleId}/income`),
  where('date', '>=', startDate),
  where('date', '<=', endDate)
);
```

## Related Documentation

- [Vehicle Management](./VEHICLE_MANAGEMENT.md) - Vehicle CRUD operations
- [Finance Categories](./FINANCE_CATEGORIES.md) - Custom category management
- [Reporting Dashboard](./REPORTING_DASHBOARD.md) - Aggregated analytics

---

**Last Updated**: January 2025
