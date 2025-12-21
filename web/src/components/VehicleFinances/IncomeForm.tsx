/**
 * Income Form Component
 *
 * Form for adding/editing income entries
 */

import { type FC, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { VehicleIncome, VehicleIncomeCreateInput } from '@/core/types';
import { RECURRENCE_LABELS } from '@/core/types';
import { useIncomeCategories, useIncomeCategoryKeys } from '@/hooks/useFinanceCategories';
import './IncomeForm.css';

// Base schema fields (without type, which is dynamic)
const baseIncomeSchema = z.object({
  type: z.string().min(1, 'El tipo es requerido'),
  amount: z.coerce.number().min(1, 'El monto debe ser mayor a 0'),
  description: z.string().min(1, 'La descripción es requerida'),
  date: z.string().min(1, 'La fecha es requerida'),
  is_recurring: z.boolean().optional(),
  recurrence_frequency: z.enum(['weekly', 'biweekly', 'monthly']).optional(),
  notes: z.string().optional(),
});

/**
 * Create income schema with dynamic type validation
 */
function createIncomeSchema(validTypeKeys: string[]) {
  return baseIncomeSchema.refine(
    (data) => validTypeKeys.length === 0 || validTypeKeys.includes(data.type),
    {
      message: 'Tipo de ingreso inválido',
      path: ['type'],
    }
  );
}

type IncomeFormData = z.infer<typeof baseIncomeSchema>;

interface IncomeFormProps {
  income?: VehicleIncome;
  onSubmit: (data: VehicleIncomeCreateInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

// Convert Date to date string for input
const dateToDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const IncomeForm: FC<IncomeFormProps> = ({
  income,
  onSubmit,
  onCancel,
  isSubmitting = false,
  error,
}) => {
  // Get dynamic income types
  const { activeCategories, labels: typeLabels, isLoading: typesLoading } = useIncomeCategories();
  const validTypeKeys = useIncomeCategoryKeys();

  // Create schema with dynamic type validation
  const incomeSchema = useMemo(
    () => createIncomeSchema(validTypeKeys),
    [validTypeKeys]
  );

  // Get default type (first active type or 'weekly_payment' as fallback)
  const defaultType = activeCategories.length > 0 ? activeCategories[0].key : 'weekly_payment';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: income
      ? {
          type: income.type,
          amount: income.amount,
          description: income.description,
          date: dateToDateString(income.date),
          is_recurring: income.is_recurring,
          recurrence_frequency: income.recurrence_pattern?.frequency,
          notes: income.notes || '',
        }
      : {
          type: defaultType,
          amount: 0,
          description: '',
          date: dateToDateString(new Date()),
          is_recurring: false,
        },
  });

  const isRecurring = watch('is_recurring');

  const handleFormSubmit = async (data: IncomeFormData) => {
    const submitData: VehicleIncomeCreateInput = {
      type: data.type,
      amount: data.amount,
      description: data.description,
      date: data.date,
      is_recurring: data.is_recurring,
      notes: data.notes,
    };

    if (data.is_recurring && data.recurrence_frequency) {
      submitData.recurrence_pattern = {
        frequency: data.recurrence_frequency,
        start_date: data.date,
      };
    }

    await onSubmit(submitData);
  };

  return (
    <div className="income-form-container">
      <div className="form-header">
        <h2>{income ? 'Editar Ingreso' : 'Agregar Ingreso'}</h2>
        <button type="button" className="btn-close" onClick={onCancel} aria-label="Cerrar">
          &times;
        </button>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="income-form">
        {/* Income Type */}
        <fieldset className="form-section">
          <legend>Tipo de Ingreso</legend>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type">Tipo *</label>
              <select id="type" {...register('type')} disabled={typesLoading}>
                {typesLoading ? (
                  <option value="">Cargando...</option>
                ) : activeCategories.length > 0 ? (
                  activeCategories.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label}
                    </option>
                  ))
                ) : (
                  // Fallback to labels map if no types loaded
                  Object.entries(typeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="amount">Monto (COP) *</label>
              <input
                id="amount"
                type="number"
                min="0"
                step="1"
                placeholder="350000"
                {...register('amount')}
                className={errors.amount ? 'error' : ''}
              />
              {errors.amount && <span className="error-message">{errors.amount.message}</span>}
            </div>
          </div>
        </fieldset>

        {/* Details */}
        <fieldset className="form-section">
          <legend>Detalles</legend>

          <div className="form-group">
            <label htmlFor="date">Fecha *</label>
            <input
              id="date"
              type="date"
              {...register('date')}
              className={errors.date ? 'error' : ''}
            />
            {errors.date && <span className="error-message">{errors.date.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripción *</label>
            <input
              id="description"
              type="text"
              placeholder="Ej: Pago semanal semana 50"
              {...register('description')}
              className={errors.description ? 'error' : ''}
            />
            {errors.description && (
              <span className="error-message">{errors.description.message}</span>
            )}
          </div>
        </fieldset>

        {/* Recurrence */}
        <fieldset className="form-section">
          <legend>Recurrencia</legend>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input type="checkbox" {...register('is_recurring')} />
              <span>Este ingreso es recurrente</span>
            </label>
          </div>

          {isRecurring && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="recurrence_frequency">Frecuencia</label>
                <select id="recurrence_frequency" {...register('recurrence_frequency')}>
                  {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </fieldset>

        {/* Notes */}
        <fieldset className="form-section">
          <legend>Notas</legend>

          <div className="form-group">
            <textarea
              id="notes"
              rows={3}
              placeholder="Notas adicionales..."
              {...register('notes')}
            />
          </div>
        </fieldset>

        {/* Error Display */}
        {error && (
          <div className="form-error-banner">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-success" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : income ? 'Guardar Cambios' : 'Agregar Ingreso'}
          </button>
        </div>
      </form>
    </div>
  );
};
