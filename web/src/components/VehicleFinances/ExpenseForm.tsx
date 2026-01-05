/**
 * Expense Form Component
 *
 * Form for adding/editing expense entries
 */

import { type FC, useState, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { VehicleExpense, VehicleExpenseCreateInput } from '@/core/types';
import { RECURRENCE_LABELS } from '@/core/types';
import { useExpenseCategories, useExpenseCategoryKeys } from '@/hooks/useFinanceCategories';
import './ExpenseForm.css';

// Allowed file types for receipts
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Base schema fields (without category, which is dynamic)
const baseExpenseSchema = z.object({
  category: z.string().min(1, 'La categoría es requerida'),
  amount: z.coerce.number().min(1, 'El monto debe ser mayor a 0'),
  description: z.string().min(1, 'La descripción es requerida'),
  date: z.string().min(1, 'La fecha es requerida'),
  is_recurring: z.boolean().optional(),
  recurrence_frequency: z.enum(['weekly', 'biweekly', 'monthly']).optional(),
  vendor: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Create expense schema with dynamic category validation
 */
function createExpenseSchema(validCategoryKeys: string[]) {
  return baseExpenseSchema.refine(
    (data) => validCategoryKeys.length === 0 || validCategoryKeys.includes(data.category),
    {
      message: 'Categoría inválida',
      path: ['category'],
    }
  );
}

type ExpenseFormData = z.infer<typeof baseExpenseSchema>;

interface ExpenseFormProps {
  expense?: VehicleExpense;
  onSubmit: (data: VehicleExpenseCreateInput) => Promise<void>;
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

export const ExpenseForm: FC<ExpenseFormProps> = ({
  expense,
  onSubmit,
  onCancel,
  isSubmitting = false,
  error,
}) => {
  // Get dynamic expense categories
  const {
    activeCategories,
    labels: categoryLabels,
    isLoading: categoriesLoading,
  } = useExpenseCategories();
  const validCategoryKeys = useExpenseCategoryKeys();

  // Create schema with dynamic category validation
  const expenseSchema = useMemo(() => createExpenseSchema(validCategoryKeys), [validCategoryKeys]);

  // Get default category (first active category or 'fuel' as fallback)
  const defaultCategory = activeCategories.length > 0 ? activeCategories[0].key : 'fuel';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: expense
      ? {
          category: expense.category,
          amount: expense.amount,
          description: expense.description,
          date: dateToDateString(expense.date),
          is_recurring: expense.is_recurring,
          recurrence_frequency: expense.recurrence_pattern?.frequency,
          vendor: expense.vendor || '',
          notes: expense.notes || '',
        }
      : {
          category: defaultCategory,
          amount: 0,
          description: '',
          date: dateToDateString(new Date()),
          is_recurring: false,
        },
  });

  const isRecurring = watch('is_recurring');

  // Receipt file state
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(
    expense?.receipt_url ? 'Recibo cargado' : null
  );
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  // Handle receipt file selection
  const handleReceiptSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setReceiptError('Tipo de archivo no permitido. Use PDF, JPG, PNG o WebP.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setReceiptError('El archivo es muy grande. Máximo 10MB.');
      return;
    }

    setReceiptFile(file);
    setReceiptFileName(file.name);
    setReceiptError(null);
  };

  // Remove receipt file
  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptFileName(null);
    setReceiptError(null);
    if (receiptInputRef.current) {
      receiptInputRef.current.value = '';
    }
  };

  const handleFormSubmit = async (data: ExpenseFormData) => {
    const submitData: VehicleExpenseCreateInput = {
      category: data.category,
      amount: data.amount,
      description: data.description,
      date: data.date,
      is_recurring: data.is_recurring,
      vendor: data.vendor,
      notes: data.notes,
      receipt_file: receiptFile || undefined,
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
    <div className="expense-form-container">
      <div className="form-header">
        <h2>{expense ? 'Editar Gasto' : 'Agregar Gasto'}</h2>
        <button type="button" className="btn-close" onClick={onCancel} aria-label="Cerrar">
          &times;
        </button>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="expense-form">
        {/* Expense Type */}
        <fieldset className="form-section">
          <legend>Tipo de Gasto</legend>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Categoría *</label>
              <select id="category" {...register('category')} disabled={categoriesLoading}>
                {categoriesLoading ? (
                  <option value="">Cargando...</option>
                ) : activeCategories.length > 0 ? (
                  activeCategories.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label}
                    </option>
                  ))
                ) : (
                  // Fallback to labels map if no categories loaded
                  Object.entries(categoryLabels).map(([value, label]) => (
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
                placeholder="50000"
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

          <div className="form-row">
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
              <label htmlFor="vendor">Proveedor/Lugar</label>
              <input
                id="vendor"
                type="text"
                placeholder="Ej: Taller ABC, Estación XYZ"
                {...register('vendor')}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripción *</label>
            <input
              id="description"
              type="text"
              placeholder="Ej: Cambio de aceite, Tanqueo gasolina"
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
              <span>Este gasto es recurrente</span>
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

        {/* Receipt Upload */}
        <fieldset className="form-section">
          <legend>Comprobante</legend>

          <div className="form-group">
            <label>Recibo o factura (PDF, imagen)</label>
            <div className="receipt-upload">
              {receiptFile ? (
                // New file selected - show file name with remove button
                <div className="receipt-file-info">
                  <span className="receipt-file-name" title={receiptFileName || ''}>
                    📄 {receiptFileName}
                  </span>
                  <button
                    type="button"
                    className="btn-remove-receipt"
                    onClick={handleRemoveReceipt}
                    title="Eliminar"
                  >
                    &times;
                  </button>
                </div>
              ) : expense?.receipt_url ? (
                // Existing receipt - show "ver actual" with option to replace
                <div className="receipt-file-info">
                  <span className="receipt-file-name">✓ Recibo cargado</span>
                  <a
                    href={expense.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-view-receipt"
                  >
                    Ver actual
                  </a>
                  <button
                    type="button"
                    className="btn btn-outline btn-upload-receipt"
                    onClick={() => receiptInputRef.current?.click()}
                  >
                    Reemplazar
                  </button>
                </div>
              ) : (
                // No file - show upload button
                <button
                  type="button"
                  className="btn btn-outline btn-upload-receipt"
                  onClick={() => receiptInputRef.current?.click()}
                >
                  📎 Subir comprobante
                </button>
              )}
              <input
                ref={receiptInputRef}
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                onChange={handleReceiptSelect}
                className="receipt-input"
                aria-label="Subir comprobante"
              />
            </div>
            {receiptError && <span className="error-message">{receiptError}</span>}
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
          <button type="submit" className="btn btn-danger" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : expense ? 'Guardar Cambios' : 'Agregar Gasto'}
          </button>
        </div>
      </form>
    </div>
  );
};
