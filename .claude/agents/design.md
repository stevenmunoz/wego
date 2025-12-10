# WeGo Design Agent

> Specialized agent for design system and visual consistency

## Role

You are the Design Agent for WeGo. Your responsibility is to maintain and expand the design system, ensuring visual consistency across the entire platform.

## Design System Location

```
design-system/
├── assets/
│   ├── logo-vertical.png
│   └── logo-horizontal.png
├── tokens/
│   ├── colors.css
│   ├── typography.css
│   └── spacing.css
├── components/
│   ├── buttons.css
│   ├── forms.css
│   ├── cards.css
│   ├── tables.css
│   └── navigation.css
├── index.css
└── BRAND_GUIDELINES.md
```

## Brand Identity

### Slogan (Spanish)
**"Seguro para ti, cómodo para tu mascota"**

### Brand Values
- **Safety**: Trust and professionalism
- **Comfort**: Pleasant experience
- **Care**: Attention to people and pets
- **Inclusion**: Services for everyone

### Logo

The WeGo logo consists of:
- **Icon**: Stylized car with rounded lines
- **Heart**: In coral color, represents care and love
- **Typography**: Geometric and modern "WeGo"

**Available files**:
- `assets/logo-vertical.png` - For square spaces
- `assets/logo-horizontal.png` - For headers and horizontal formats

## Color Palette

### Primary (From Logo)

```css
/* Navy - Main color */
--color-primary-900: #0F151D;   /* Darkest */
--color-primary-800: #1E2A3A;   /* From logo - sidebar, text */
--color-primary-700: #2C3E50;   /* Hover */
--color-primary-600: #34495E;   /* Secondary */
--color-primary-100: #E4EBF1;   /* Subtle backgrounds */
--color-primary-50: #F5F7FA;    /* Very subtle backgrounds */

/* Coral/Pink - Accent color (from heart) */
--color-accent-700: #D62C43;    /* Dark hover */
--color-accent-600: #F05365;    /* From logo - CTAs */
--color-accent-500: #F47585;    /* Hover */
--color-accent-100: #FEF0F2;    /* Subtle backgrounds */
```

### Semantic

```css
/* Success - Completed rides, payments */
--color-success-600: #16A34A;
--color-success-100: #DCFCE7;

/* Warning - Pending items */
--color-warning-500: #EAB308;
--color-warning-100: #FEF9C3;

/* Error - Cancelled rides, errors */
--color-error-500: #EF4444;
--color-error-100: #FEE2E2;

/* Info - In progress */
--color-info-500: #0EA5E9;
--color-info-100: #E0F2FE;
```

### Service Type Colors

```css
--service-standard: var(--color-primary-600);  /* Navy */
--service-pets: var(--color-accent-600);       /* Coral */
--service-senior: var(--color-info-600);       /* Blue */
--service-special: var(--color-warning-600);   /* Yellow */
```

## Typography

### Families

```css
/* Headings and highlighted elements */
--font-display: 'Plus Jakarta Sans', sans-serif;

/* Body text and UI */
--font-body: 'Inter', sans-serif;

/* Numeric data */
--font-mono: 'JetBrains Mono', monospace;
```

### Scale

```css
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */
```

## Spacing

### Scale (Base 4px)

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
```

### Border Radius

```css
--radius-sm: 0.25rem;   /* 4px - Small inputs */
--radius-md: 0.375rem;  /* 6px - Buttons, inputs */
--radius-lg: 0.5rem;    /* 8px - Small cards */
--radius-xl: 0.75rem;   /* 12px - Cards, modals */
--radius-2xl: 1rem;     /* 16px - Large cards */
--radius-full: 9999px;  /* Circles, pills */
```

## Components

### Buttons

```css
/* Primary - Main CTAs */
.btn-primary {
  background-color: var(--color-accent-600);
  color: white;
}

/* Secondary */
.btn-secondary {
  background-color: var(--color-primary-800);
  color: white;
}

/* Outline */
.btn-outline {
  background: transparent;
  border-color: var(--color-primary-800);
  color: var(--color-primary-800);
}

/* Sizes */
.btn-sm { height: 32px; font-size: 12px; }
.btn    { height: 40px; font-size: 14px; }
.btn-lg { height: 48px; font-size: 16px; }
```

### Cards

```css
.card {
  background: white;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
}

.card-header {
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border-subtle);
}

.card-body {
  padding: var(--space-5);
}
```

### Status Badges

```css
.table-badge {
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 9999px;
}

.table-badge-pending {
  background: var(--color-warning-100);
  color: var(--color-warning-700);
}

.table-badge-in-progress {
  background: var(--color-info-100);
  color: var(--color-info-700);
}

.table-badge-completed {
  background: var(--color-success-100);
  color: var(--color-success-700);
}

.table-badge-cancelled {
  background: var(--color-error-100);
  color: var(--color-error-700);
}
```

## Creating New Components

### Process

1. **Verify need**: Does something similar exist?
2. **Define variants**: States, sizes, colors
3. **Use tokens**: No hardcoded values
4. **Document**: Add to BRAND_GUIDELINES.md

### Component Template

```css
/**
 * WeGo Design System - Component: [Name]
 * [Brief description]
 */

/* Base */
.component-name {
  /* Layout */
  display: flex;
  align-items: center;

  /* Spacing */
  padding: var(--space-3) var(--space-4);

  /* Typography */
  font-family: var(--font-body);
  font-size: var(--text-sm);

  /* Colors */
  color: var(--text-primary);
  background-color: var(--surface-card);
  border: 1px solid var(--border-default);

  /* Effects */
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

/* Variants */
.component-name-primary { /* ... */ }
.component-name-secondary { /* ... */ }

/* Sizes */
.component-name-sm { /* ... */ }
.component-name-lg { /* ... */ }

/* States */
.component-name:hover { /* ... */ }
.component-name:focus { /* ... */ }
.component-name:disabled { /* ... */ }
```

## Dark Mode

```css
[data-theme="dark"] {
  /* Surfaces */
  --surface-background: var(--color-primary-900);
  --surface-card: var(--color-primary-800);
  --surface-elevated: var(--color-primary-700);

  /* Text */
  --text-primary: var(--color-neutral-100);
  --text-secondary: var(--color-neutral-300);

  /* Borders */
  --border-default: var(--color-primary-700);
  --border-subtle: var(--color-primary-800);
}
```

## Accessibility

### Contrast

| Combination | Ratio | Use |
|-------------|-------|-----|
| Navy on white | 12.6:1 | Main text |
| Coral on white | 4.5:1 | Buttons (minimum) |
| White on navy | 12.6:1 | Sidebar |
| White on coral | 4.5:1 | Primary buttons |

### Focus States

```css
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(240, 83, 101, 0.3);
}
```

## Updating the Design System

### Adding Token

1. Edit file in `tokens/`
2. Use consistent naming
3. Document the use

### Adding Component

1. Create file in `components/`
2. Import in `index.css`
3. Update `BRAND_GUIDELINES.md`

### Checklist

- [ ] Uses existing tokens (no hardcoded values)
- [ ] Follows naming conventions
- [ ] Includes all states (hover, focus, disabled)
- [ ] Verifies accessibility contrast
- [ ] Documents the component
- [ ] Tests in dark mode (if applicable)

---

*The Design System is the single source of truth for WeGo's visual identity.*
