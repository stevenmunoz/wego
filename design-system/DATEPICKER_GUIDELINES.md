# Date Picker Guidelines

> WeGo Design System - Date Selection Components

This guide covers all date selection patterns in the WeGo platform. Follow these guidelines to ensure consistent date handling across the application.

---

## Available Components

| Component | Use Case | Location |
|-----------|----------|----------|
| **SingleDatePicker** | Single date with presets (dropdown) | `@/components/SingleDatePicker` |
| **DateRangePicker** | Date range with presets (dropdown) | `@/components/DateRangePicker` |
| **DateInput** | Single date (native input style) | `@/components/DateInput` |
| **Native `<input type="date">`** | Form-integrated dates | Use `.input-date` class |

---

## Component Decision Tree

```
Need to select dates?
    |
    ├─> Single date?
    |       |
    |       ├─> Need preset options (Yesterday, 7 days ago, etc.)?
    |       |       └─> Use SingleDatePicker component (RECOMMENDED)
    |       |
    |       ├─> Simple date input without presets?
    |       |       └─> Use DateInput component
    |       |
    |       └─> Inside react-hook-form?
    |               └─> Use native input with .input-date class
    |
    └─> Date range?
            |
            ├─> Need preset options (Today, Last 7 days, etc.)?
            |       └─> Use DateRangePicker component (RECOMMENDED)
            |
            └─> Just two date fields?
                    └─> Use two DateInput components
```

---

## 1. DateInput Component

For **standalone single date selection** outside of react-hook-form.

### Import

```tsx
import { DateInput } from '@/components/DateInput';
```

### Basic Usage

```tsx
const [date, setDate] = useState<Date | null>(new Date());

<DateInput
  label="Fecha"
  value={date}
  onChange={setDate}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Label text (optional) |
| `value` | `Date \| null` | - | Selected date |
| `onChange` | `(date: Date \| null) => void` | - | Change handler |
| `min` | `Date` | - | Minimum selectable date |
| `max` | `Date` | - | Maximum selectable date |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Input size |
| `disabled` | `boolean` | `false` | Disable the input |
| `error` | `string` | - | Error message to display |
| `showIcon` | `boolean` | `true` | Show calendar icon |
| `placeholder` | `string` | `'Seleccionar fecha'` | Placeholder text |

### Examples

```tsx
// With max date (yesterday)
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

<DateInput
  label="Fecha:"
  value={selectedDate}
  onChange={setSelectedDate}
  max={yesterday}
  size="medium"
/>

// With error state
<DateInput
  label="Fecha de nacimiento"
  value={birthDate}
  onChange={setBirthDate}
  error="La fecha es requerida"
/>

// Small size for compact layouts
<DateInput
  value={date}
  onChange={setDate}
  size="small"
/>
```

---

## 2. SingleDatePicker Component

For **single date selection** with preset options (dropdown style). **This is the recommended component for most single date scenarios.**

### Import

```tsx
import { SingleDatePicker } from '@/components/SingleDatePicker';
```

### Basic Usage

```tsx
const [date, setDate] = useState<Date>(new Date());

<SingleDatePicker
  value={date}
  onChange={setDate}
/>
```

### Default Presets

The component includes these presets by default:
- Ayer (Yesterday)
- Hace 2 días (2 days ago)
- Hace 7 días (7 days ago)
- Hace 14 días (14 days ago)
- Hace 30 días (30 days ago)
- Personalizado (Custom date)

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `Date` | - | Current date value |
| `onChange` | `(date: Date) => void` | - | Change handler |
| `presets` | `SingleDatePreset[]` | Default presets | Custom preset options |
| `allowCustom` | `boolean` | `true` | Allow custom date selection |
| `min` | `Date` | - | Minimum selectable date |
| `max` | `Date` | - | Maximum selectable date |
| `disabled` | `boolean` | `false` | Disable the picker |
| `label` | `string` | - | Label text displayed before the picker |

### Custom Presets Example

```tsx
import { SingleDatePicker } from '@/components/SingleDatePicker';
import type { SingleDatePreset } from '@/components/SingleDatePicker';

const customPresets: SingleDatePreset[] = [
  {
    id: 'yesterday',
    label: 'Ayer',
    getDate: () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d;
    },
  },
  {
    id: 'lastWeek',
    label: 'Hace una semana',
    getDate: () => {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return d;
    },
  },
];

<SingleDatePicker
  label="Fecha:"
  value={date}
  onChange={setDate}
  presets={customPresets}
  max={new Date()} // Can't select future dates
/>
```

### Use Case: Insights Page

```tsx
// InsightsDateSelector uses SingleDatePicker
<SingleDatePicker
  label="Fecha:"
  value={selectedDate}
  onChange={setSelectedDate}
  max={yesterday} // Insights only for past dates
/>
```

---

## 3. DateRangePicker Component

For **date range selection** with preset options.

### Import

```tsx
import { DateRangePicker } from '@/components/DateRangePicker';
import type { DateRange } from '@/components/DateRangePicker';
```

### Basic Usage

```tsx
const [dateRange, setDateRange] = useState<DateRange>({
  startDate: new Date(),
  endDate: new Date(),
});

<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
/>
```

### Default Presets

The component includes these presets by default:
- Hoy (Today)
- Ayer (Yesterday)
- Ultimos 7 dias (Last 7 days)
- Ultimos 30 dias (Last 30 days)
- Este mes (This month)
- Mes anterior (Last month)
- Personalizado (Custom range)

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `DateRange` | - | Current date range |
| `onChange` | `(range: DateRange) => void` | - | Change handler |
| `presets` | `DatePreset[]` | Default presets | Custom preset options |
| `allowCustom` | `boolean` | `true` | Allow custom range selection |
| `min` | `Date` | - | Minimum selectable date |
| `max` | `Date` | - | Maximum selectable date |
| `disabled` | `boolean` | `false` | Disable the picker |

### Custom Presets Example

```tsx
import { DateRangePicker, type DatePreset } from '@/components/DateRangePicker';

const customPresets: DatePreset[] = [
  {
    id: 'today',
    label: 'Hoy',
    getRange: () => {
      const today = new Date();
      return {
        startDate: today,
        endDate: today,
      };
    },
  },
  {
    id: 'thisWeek',
    label: 'Esta semana',
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - start.getDay()); // Start of week
      return { startDate: start, endDate: end };
    },
  },
];

<DateRangePicker
  value={range}
  onChange={setRange}
  presets={customPresets}
/>
```

---

## 4. Native Date Input (Forms)

For dates inside **react-hook-form** or other form libraries where you need `register()`.

### With Design System Class

```tsx
import '@/design-system/index.css';

<input
  type="date"
  className="input-date"
  {...register('date')}
/>
```

### CSS Classes

| Class | Description |
|-------|-------------|
| `.input-date` | Base date input styling |
| `.input-date-sm` | Small size variant |
| `.input-date-lg` | Large size variant |
| `.input-date-error` | Error state styling |

### Example with React Hook Form

```tsx
import { useForm } from 'react-hook-form';

const { register, handleSubmit, formState: { errors } } = useForm();

<div className="form-group">
  <label htmlFor="date" className="label">Fecha *</label>
  <input
    id="date"
    type="date"
    className={`input-date ${errors.date ? 'input-date-error' : ''}`}
    {...register('date', { required: 'La fecha es requerida' })}
  />
  {errors.date && (
    <span className="helper-text helper-text-error">
      {errors.date.message}
    </span>
  )}
</div>
```

---

## Timezone Handling

**IMPORTANT**: Always handle dates in local timezone to avoid off-by-one errors.

### Correct Pattern

```tsx
// Parsing date string to Date (LOCAL timezone)
function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

// Formatting Date to string (LOCAL timezone)
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

### Incorrect Pattern (Causes Timezone Issues)

```tsx
// DON'T do this - causes off-by-one errors
const date = new Date('2024-01-15'); // Uses UTC
const dateStr = date.toISOString().split('T')[0]; // Uses UTC
```

---

## Styling Guidelines

### Design Tokens

Date inputs use these design tokens for consistency:

```css
/* Colors */
--color-accent-600: #f05365;  /* Focus border */
--color-neutral-300: #d1d5db; /* Default border */
--color-neutral-800: #1f2937; /* Text color */
--color-error-500: #ef4444;   /* Error state */

/* Typography */
font-family: 'JetBrains Mono', 'Inter', sans-serif; /* Numbers */
font-size: 0.875rem; /* 14px */

/* Sizing */
--height-input: 40px;
--height-input-sm: 32px;
--height-input-lg: 48px;

/* Border radius */
--radius-md: 6px;
```

### Focus States

All date inputs must have visible focus states:

```css
.input-date:focus {
  border-color: var(--color-accent-600);
  box-shadow: 0 0 0 3px rgba(240, 83, 101, 0.15);
}
```

### Calendar Icon

The native calendar picker icon should always be visible:

```css
.input-date::-webkit-calendar-picker-indicator {
  opacity: 0.7;
  cursor: pointer;
}

.input-date::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}
```

---

## Accessibility

1. **Always include labels** - Use the `label` prop or associated `<label>` element
2. **Use semantic HTML** - `type="date"` provides native accessibility
3. **Error messages** - Display clear error text below the input
4. **Keyboard navigation** - Ensure tab order is logical
5. **Screen readers** - Labels and error messages are announced

---

## Spanish (Colombia) Formatting

All user-facing date text must be in Spanish:

| Context | Format | Example |
|---------|--------|---------|
| Short date | DD/MM/YYYY | 15/01/2025 |
| Display label | D de MMM | 15 de ene |
| Full date | D de MMMM de YYYY | 15 de enero de 2025 |

```tsx
// Format for display
const formatDateDisplay = (date: Date): string => {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
  }).format(date);
};
```

---

## Migration Guide

### From Native Input to DateInput

Before:
```tsx
<input
  type="date"
  value={formatDate(date)}
  onChange={(e) => setDate(parseDate(e.target.value))}
/>
```

After:
```tsx
<DateInput
  value={date}
  onChange={setDate}
/>
```

### Adding Design System Class to Existing Forms

Before:
```tsx
<input
  type="date"
  {...register('date')}
/>
```

After:
```tsx
<input
  type="date"
  className="input-date"
  {...register('date')}
/>
```

---

## Component Locations

```
web/src/
├── components/
│   ├── SingleDatePicker/
│   │   ├── SingleDatePicker.tsx  # Single date with presets (RECOMMENDED)
│   │   ├── SingleDatePicker.css  # Styles
│   │   └── index.ts              # Exports
│   ├── DateRangePicker/
│   │   ├── DateRangePicker.tsx   # Date range with presets
│   │   ├── DateRangePicker.css   # Styles
│   │   ├── utils.ts              # Utility functions
│   │   └── index.ts              # Exports
│   └── DateInput/
│       ├── DateInput.tsx         # Simple native date input
│       ├── DateInput.css         # Styles
│       ├── utils.ts              # Utility functions
│       └── index.ts              # Exports
└── design-system/
    ├── components/
    │   └── forms.css             # .input-date classes
    └── DATEPICKER_GUIDELINES.md  # This file
```

---

*Last updated: January 2025*
