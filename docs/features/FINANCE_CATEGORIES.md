# Finance Categories

> Admin interface for managing custom income types and expense categories

## Overview

The Finance Categories feature allows administrators to customize the income types and expense categories used in Vehicle Finances. This provides flexibility for different business models and regional requirements.

Each category includes a display label (in Spanish), color coding for UI distinction, sort order for list organization, and active/inactive status. Default categories can be seeded with one click for new installations.

**Key Capabilities:**
- Custom expense category creation
- Custom income type creation
- Color assignment for visual distinction
- Sort order configuration
- Active/inactive toggling
- Seed default categories function
- Spanish labels for Colombian locale

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                FINANCE CATEGORIES ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend (React/TypeScript)                                    │
│  ├─ Page: FinanceCategoriesPage.tsx                            │
│  ├─ Components:                                                 │
│  │   ├─ CategoryList (expense categories)                      │
│  │   ├─ IncomeTypeList (income types)                          │
│  │   ├─ CategoryForm (create/edit modal)                       │
│  │   └─ SeedDefaultsButton                                     │
│  ├─ Hook: useFinanceCategories                                 │
│  └─ Service: finance-categories.ts                             │
│                                                                 │
│  Firebase/Firestore                                             │
│  └─ Collection: finance_categories                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## User Stories

1. **As an admin**, I can create custom expense categories so that tracking matches business needs
2. **As an admin**, I can assign colors to categories so that they're visually distinct in charts
3. **As an admin**, I can reorder categories so that common ones appear first
4. **As an admin**, I can deactivate categories so that they stop appearing in forms
5. **As an admin**, I can seed default categories so that setup is quick

## Key Files

### Frontend

| File | Purpose |
|------|---------|
| `web/src/pages/FinanceCategoriesPage.tsx` | Main admin page |
| `web/src/hooks/useFinanceCategories.ts` | Categories hook |
| `web/src/core/firebase/finance-categories.ts` | Firestore operations |
| `web/src/core/types/finance-category.types.ts` | TypeScript types |

## Data Model

### Firestore Collection: `finance_categories`

```typescript
interface FinanceCategory {
  id: string;
  key: string;                     // Unique identifier (e.g., "fuel")
  label: string;                   // Display name in Spanish (e.g., "Combustible")
  type: 'expense' | 'income';      // Category type
  color: string;                   // Hex color (e.g., "#EF4444")
  sort_order: number;              // Display order
  is_active: boolean;              // Whether shown in forms
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

## Default Categories

### Expense Categories

| Key | Label | Color |
|-----|-------|-------|
| `fuel` | Combustible | #EF4444 |
| `maintenance` | Mantenimiento | #F59E0B |
| `insurance_soat` | SOAT | #10B981 |
| `tecnomecanica` | Tecnomecánica | #3B82F6 |
| `taxes` | Impuestos | #6366F1 |
| `fines` | Multas | #EC4899 |
| `parking` | Parqueadero | #8B5CF6 |
| `car_wash` | Lavado | #14B8A6 |
| `accessories` | Accesorios | #F97316 |
| `other` | Otro | #6B7280 |

### Income Types

| Key | Label | Color |
|-----|-------|-------|
| `weekly_payment` | Pago semanal | #16A34A |
| `tip_share` | Propinas | #0EA5E9 |
| `bonus` | Bonificación | #8B5CF6 |
| `other` | Otro | #6B7280 |

## Seed Defaults Function

```typescript
async function seedDefaultCategories(): Promise<SeedResult> {
  const results = { created: 0, existing: 0, errors: 0 };

  for (const category of DEFAULT_CATEGORIES) {
    const exists = await categoryExists(category.key);

    if (exists) {
      results.existing++;
      continue;
    }

    try {
      await createCategory(category);
      results.created++;
    } catch (error) {
      results.errors++;
    }
  }

  return results;
}
```

## Usage in Vehicle Finances

Categories are loaded for dropdowns in expense/income forms:

```typescript
function ExpenseForm() {
  const { categories } = useFinanceCategories();
  const expenseCategories = categories.filter(
    c => c.type === 'expense' && c.is_active
  );

  return (
    <select>
      {expenseCategories.map(cat => (
        <option key={cat.key} value={cat.key}>
          {cat.label}
        </option>
      ))}
    </select>
  );
}
```

## Common Issues and Solutions

### Issue: Categories not appearing in forms

**Symptoms:** Dropdown is empty in expense/income forms

**Root Cause:** Categories not seeded or all inactive

**Solution:** Go to Finance Categories page and seed defaults:
```
/categorias-finanzas → "Inicializar categorías por defecto"
```

### Issue: Color not showing in charts

**Symptoms:** Chart uses default colors instead of category colors

**Root Cause:** Color lookup not matching category key

**Solution:** Ensure exact key match when looking up colors:
```typescript
const categoryColor = categories.find(c => c.key === expense.category)?.color;
```

## Security Rules

```javascript
match /finance_categories/{categoryId} {
  allow read: if request.auth != null;
  allow write: if isAdmin();
}
```

## Related Documentation

- [Vehicle Finances](./VEHICLE_FINANCES.md) - Uses these categories

---

**Last Updated**: January 2025
