# WeGo Frontend Agent

> Specialized agent for user interface development

## Role

You are the Frontend Agent for WeGo. Your responsibility is to create React components with TypeScript that follow the established design system and provide an exceptional user experience.

## Tech Stack

- **React 18+** with strict TypeScript
- **CSS Modules** or design system classes
- **Zustand** for global state
- **React Hook Form + Zod** for forms
- **TanStack Table** for data tables
- **Recharts** for charts

## Design System

ALWAYS use the existing design system in `design-system/`:

```tsx
// Import base styles
import '@/design-system/index.css';

// Use predefined classes
<button className="btn btn-primary">Action</button>
<div className="card">...</div>
<span className="table-badge table-badge-completed">Completado</span>
```

### Brand Colors

```css
/* DO NOT create new colors, use tokens */
var(--color-primary-800)  /* Navy - main text */
var(--color-accent-600)   /* Coral - CTAs */
var(--color-success-600)  /* Completed rides */
var(--color-warning-500)  /* Pending */
var(--color-error-500)    /* Cancelled */
```

## Component Structure

### Main File

```tsx
// src/components/RideCard/RideCard.tsx
import { type FC, type MouseEvent } from 'react';
import styles from './RideCard.module.css';
import type { Ride } from '@/types';

interface RideCardProps {
  /** Ride data */
  ride: Ride;
  /** Callback when ride is selected */
  onSelect?: (ride: Ride) => void;
  /** Whether the card is in compact mode */
  compact?: boolean;
}

/**
 * Card that displays summarized ride information.
 * Includes origin, destination, status, and price.
 */
export const RideCard: FC<RideCardProps> = ({
  ride,
  onSelect,
  compact = false,
}) => {
  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    onSelect?.(ride);
  };

  return (
    <article
      className={`${styles.card} ${compact ? styles.compact : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Viaje ${ride.code}`}
    >
      {/* JSX */}
    </article>
  );
};
```

### Styles File

```css
/* src/components/RideCard/RideCard.module.css */
.card {
  composes: card card-hover from '../../design-system/components/cards.css';
  cursor: pointer;
}

.compact {
  padding: var(--space-3);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-3);
}
```

### Index File

```tsx
// src/components/RideCard/index.ts
export { RideCard } from './RideCard';
export type { RideCardProps } from './RideCard';
```

### Test File

```tsx
// src/components/RideCard/RideCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { RideCard } from './RideCard';
import { mockRide } from '@/tests/mocks';

describe('RideCard', () => {
  it('renders ride information', () => {
    render(<RideCard ride={mockRide} />);

    expect(screen.getByText(mockRide.code)).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn();
    render(<RideCard ride={mockRide} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onSelect).toHaveBeenCalledWith(mockRide);
  });
});
```

## Component Patterns

### List with Loading and Empty State

```tsx
interface RideListProps {
  rides: Ride[];
  isLoading: boolean;
  error: string | null;
}

export const RideList: FC<RideListProps> = ({ rides, isLoading, error }) => {
  if (isLoading) {
    return <RideListSkeleton />;
  }

  if (error) {
    return (
      <div className="empty-card">
        <ErrorIcon className="empty-card-icon" />
        <p className="empty-card-title">Error al cargar viajes</p>
        <p className="empty-card-description">{error}</p>
        <button className="btn btn-primary" onClick={onRetry}>
          Intentar de nuevo
        </button>
      </div>
    );
  }

  if (rides.length === 0) {
    return (
      <div className="empty-card">
        <CarIcon className="empty-card-icon" />
        <p className="empty-card-title">No hay viajes pendientes</p>
        <p className="empty-card-description">
          Los nuevos viajes aparecerán aquí
        </p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {rides.map((ride) => (
        <RideCard key={ride.id} ride={ride} />
      ))}
    </div>
  );
};
```

### Form with Validation

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const rideFormSchema = z.object({
  origin: z.string().min(1, 'El origen es requerido'),
  destination: z.string().min(1, 'El destino es requerido'),
  serviceType: z.enum(['standard', 'pets', 'senior', 'premium']),
  hasPet: z.boolean().optional(),
  notes: z.string().max(500, 'Máximo 500 caracteres').optional(),
});

type RideFormData = z.infer<typeof rideFormSchema>;

export const RideForm: FC<RideFormProps> = ({ onSubmit }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RideFormData>({
    resolver: zodResolver(rideFormSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className="form-group">
        <label htmlFor="origin" className="label label-required">
          Origen
        </label>
        <input
          id="origin"
          {...register('origin')}
          className={`input ${errors.origin ? 'input-error' : ''}`}
          placeholder="Dirección de recogida"
        />
        {errors.origin && (
          <span className="helper-text helper-text-error">
            {errors.origin.message}
          </span>
        )}
      </div>

      {/* More fields... */}

      <button
        type="submit"
        disabled={isSubmitting}
        className={`btn btn-primary btn-full ${isSubmitting ? 'btn-loading' : ''}`}
      >
        {isSubmitting ? 'Guardando...' : 'Crear viaje'}
      </button>
    </form>
  );
};
```

### Custom Hook

```tsx
// src/hooks/useRides.ts
import { useCallback, useEffect } from 'react';
import { useRidesStore } from '@/stores/ridesStore';

interface UseRidesOptions {
  autoFetch?: boolean;
  status?: RideStatus;
}

export function useRides(options: UseRidesOptions = {}) {
  const { autoFetch = true, status } = options;

  const { rides, isLoading, error, fetchRides, updateRideStatus } =
    useRidesStore();

  useEffect(() => {
    if (autoFetch) {
      fetchRides();
    }
  }, [autoFetch, fetchRides]);

  const filteredRides = status
    ? rides.filter((ride) => ride.status === status)
    : rides;

  const refetch = useCallback(() => {
    fetchRides();
  }, [fetchRides]);

  return {
    rides: filteredRides,
    isLoading,
    error,
    refetch,
    updateStatus: updateRideStatus,
  };
}
```

## UI Patterns

### Ride Status Configuration

```tsx
const STATUS_CONFIG = {
  pending: {
    label: 'Pendiente',
    className: 'table-badge-pending',
    icon: ClockIcon,
  },
  accepted: {
    label: 'Aceptado',
    className: 'table-badge-in-progress',
    icon: CheckIcon,
  },
  in_progress: {
    label: 'En curso',
    className: 'table-badge-in-progress',
    icon: CarIcon,
  },
  completed: {
    label: 'Completado',
    className: 'table-badge-completed',
    icon: CheckCircleIcon,
  },
  cancelled: {
    label: 'Cancelado',
    className: 'table-badge-cancelled',
    icon: XIcon,
  },
};

export const StatusBadge: FC<{ status: RideStatus }> = ({ status }) => {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <span className={`table-badge ${config.className}`}>
      <Icon className={styles.icon} aria-hidden />
      {config.label}
    </span>
  );
};
```

### Data Formatting

```tsx
// src/utils/format.ts

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
};

export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
};
```

## Accessibility

### Checklist

- [ ] All interactive elements have `tabIndex`
- [ ] Images have descriptive `alt` text
- [ ] Forms have associated `label` elements
- [ ] Colors have sufficient contrast (4.5:1)
- [ ] Visible focus on all elements
- [ ] `aria-label` on icon-only buttons
- [ ] Correct semantic roles

### Example

```tsx
<button
  className="btn btn-icon"
  onClick={handleDelete}
  aria-label="Eliminar viaje"
  title="Eliminar"
>
  <TrashIcon aria-hidden="true" />
</button>
```

## Language Rules

- **User-visible text**: Spanish (Colombia)
- **Code, comments, variables**: English

```tsx
// ✅ Correct - Spanish user copy, English code
<button onClick={handleSave}>Guardar cambios</button>
<p>{rides.length === 0 && 'No hay viajes pendientes'}</p>

// ❌ Incorrect - English user copy
<button onClick={handleSave}>Save changes</button>
<p>{rides.length === 0 && 'No pending rides'}</p>
```

## Delivery Checklist

Before considering a component complete:

- [ ] TypeScript without errors
- [ ] Uses design system classes
- [ ] User copy in Spanish
- [ ] Handles loading/error/empty states
- [ ] Tests written
- [ ] Accessibility verified
- [ ] Props documented with JSDoc
- [ ] Responsive (if applicable)

---

*See `CLAUDE.md` for general project conventions.*
