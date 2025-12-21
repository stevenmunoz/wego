/**
 * Finance Category Form Component
 *
 * Form for creating/editing expense categories and income types
 */

import { type FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { FinanceCategory, FinanceCategoryType } from '@/core/types/finance-category.types';
import './CategoryForm.css';

const categorySchema = z.object({
  key: z
    .string()
    .min(1, 'La clave es requerida')
    .regex(/^[a-z][a-z0-9_]*$/, 'Solo letras minúsculas, números y guiones bajos. Debe iniciar con letra.'),
  label: z.string().min(1, 'La etiqueta es requerida'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hex inválido'),
  sort_order: z.coerce.number().min(0, 'El orden debe ser mayor o igual a 0'),
  is_active: z.boolean(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  category?: FinanceCategory;
  categoryType: FinanceCategoryType;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

// Predefined colors for quick selection
const PRESET_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#84cc16', // Lime
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#6b7280', // Gray
  '#f59e0b', // Amber
];

export const CategoryForm: FC<CategoryFormProps> = ({
  category,
  categoryType,
  onSubmit,
  onCancel,
  isSubmitting = false,
  error,
}) => {
  const isEditing = !!category;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: category
      ? {
          key: category.key,
          label: category.label,
          color: category.color,
          sort_order: category.sort_order,
          is_active: category.is_active,
        }
      : {
          key: '',
          label: '',
          color: '#6b7280',
          sort_order: 0,
          is_active: true,
        },
  });

  const selectedColor = watch('color');

  // Auto-generate key from label when creating
  const watchedLabel = watch('label');
  useEffect(() => {
    if (!isEditing && watchedLabel) {
      const generatedKey = watchedLabel
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .replace(/_+/g, '_');
      if (generatedKey && /^[a-z]/.test(generatedKey)) {
        setValue('key', generatedKey);
      }
    }
  }, [watchedLabel, isEditing, setValue]);

  const handleFormSubmit = async (data: CategoryFormData) => {
    await onSubmit(data);
  };

  const typeLabel = categoryType === 'expense' ? 'Gasto' : 'Ingreso';

  return (
    <div className="category-form-container">
      <div className="form-header">
        <h2>{isEditing ? `Editar Categoría de ${typeLabel}` : `Nueva Categoría de ${typeLabel}`}</h2>
        <button type="button" className="btn-close" onClick={onCancel} aria-label="Cerrar">
          &times;
        </button>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="category-form">
        {/* Label */}
        <div className="form-group">
          <label htmlFor="label">Etiqueta (nombre visible) *</label>
          <input
            id="label"
            type="text"
            placeholder="Ej: Combustible, Pago Semanal"
            {...register('label')}
            className={errors.label ? 'error' : ''}
          />
          {errors.label && <span className="error-message">{errors.label.message}</span>}
        </div>

        {/* Key */}
        <div className="form-group">
          <label htmlFor="key">Clave (identificador interno) *</label>
          <input
            id="key"
            type="text"
            placeholder="Ej: fuel, weekly_payment"
            {...register('key')}
            className={errors.key ? 'error' : ''}
            disabled={isEditing}
          />
          {errors.key && <span className="error-message">{errors.key.message}</span>}
          {isEditing && (
            <span className="help-text">La clave no se puede modificar después de crear</span>
          )}
        </div>

        {/* Color */}
        <div className="form-group">
          <label htmlFor="color-text">Color (para gráficos) *</label>
          <div className="color-picker-wrapper">
            <input
              id="color-text"
              type="text"
              value={selectedColor}
              onChange={(e) => setValue('color', e.target.value)}
              placeholder="#000000"
              className={`color-text-input ${errors.color ? 'error' : ''}`}
            />
            <div className="color-picker-btn">
              <input
                id="color"
                type="color"
                {...register('color')}
                className="color-input"
                title="Seleccionar color"
              />
              <div
                className="color-preview-swatch"
                style={{ backgroundColor: selectedColor }}
                title={selectedColor}
              />
            </div>
          </div>
          {errors.color && <span className="error-message">{errors.color.message}</span>}

          {/* Color presets */}
          <div className="color-presets">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`color-preset ${selectedColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setValue('color', color)}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Sort Order */}
        <div className="form-group">
          <label htmlFor="sort_order">Orden de visualización</label>
          <input
            id="sort_order"
            type="number"
            min="0"
            step="10"
            placeholder="0"
            {...register('sort_order')}
            className={errors.sort_order ? 'error' : ''}
          />
          {errors.sort_order && <span className="error-message">{errors.sort_order.message}</span>}
          <span className="help-text">Menor número = aparece primero</span>
        </div>

        {/* Active toggle */}
        <div className="form-group">
          <label className="checkbox-label">
            <input type="checkbox" {...register('is_active')} />
            <span>Activo</span>
          </label>
          <span className="help-text">
            Las categorías inactivas no aparecen en los formularios, pero los registros existentes
            se muestran correctamente
          </span>
        </div>

        {/* Error Display */}
        {error && (
          <div className="form-error-banner">
            <span className="error-icon">!</span>
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Categoría'}
          </button>
        </div>
      </form>
    </div>
  );
};
