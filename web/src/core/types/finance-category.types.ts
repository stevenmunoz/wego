/**
 * Finance category types for dynamic expense categories and income types
 *
 * Categories are stored in Firestore collection: finance_categories
 * Admin-only write access, authenticated read access
 */

import type { Timestamp } from 'firebase/firestore';

// ============ Enums ============

export type FinanceCategoryType = 'expense' | 'income';

// ============ Interfaces ============

/**
 * Finance category stored in Firestore
 */
export interface FinanceCategory {
  id: string;
  category_type: FinanceCategoryType;
  key: string; // Machine key: 'fuel', 'weekly_payment', etc.
  label: string; // Spanish display label: 'Combustible', 'Pago Semanal'
  color: string; // Hex color for charts: '#ef4444'
  sort_order: number; // Display order (0, 10, 20...)
  is_active: boolean; // Soft delete - inactive categories hidden from dropdowns
  created_at: Date;
  updated_at: Date;
}

/**
 * Firestore document representation (with Timestamp instead of Date)
 */
export interface FirestoreFinanceCategory {
  id: string;
  category_type: FinanceCategoryType;
  key: string;
  label: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============ Input Types ============

/**
 * Input for creating a new category
 */
export interface FinanceCategoryCreateInput {
  category_type: FinanceCategoryType;
  key: string;
  label: string;
  color: string;
  sort_order?: number; // Auto-calculated if not provided
  is_active?: boolean; // Defaults to true
}

/**
 * Input for updating an existing category
 */
export interface FinanceCategoryUpdateInput {
  label?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
}

// ============ Lookup Types ============

/**
 * Map of category key to label (for display)
 */
export type CategoryLabelMap = Record<string, string>;

/**
 * Map of category key to color (for charts)
 */
export type CategoryColorMap = Record<string, string>;

// ============ Default Values ============

/**
 * Default expense categories (for seeding and fallback)
 */
export const DEFAULT_EXPENSE_CATEGORIES: Array<{
  key: string;
  label: string;
  color: string;
  sort_order: number;
}> = [
  { key: 'fuel', label: 'Combustible', color: '#ef4444', sort_order: 0 },
  { key: 'maintenance', label: 'Mantenimiento', color: '#f97316', sort_order: 10 },
  { key: 'insurance_soat', label: 'SOAT', color: '#eab308', sort_order: 20 },
  { key: 'tecnomecanica', label: 'Tecnomecánica', color: '#84cc16', sort_order: 30 },
  { key: 'taxes', label: 'Impuestos', color: '#06b6d4', sort_order: 40 },
  { key: 'fines', label: 'Multas', color: '#8b5cf6', sort_order: 50 },
  { key: 'parking', label: 'Parqueadero', color: '#ec4899', sort_order: 60 },
  { key: 'car_wash', label: 'Lavado', color: '#14b8a6', sort_order: 70 },
  { key: 'accessories', label: 'Accesorios', color: '#f59e0b', sort_order: 80 },
  { key: 'other', label: 'Otros', color: '#6b7280', sort_order: 90 },
];

/**
 * Default income types (for seeding and fallback)
 */
export const DEFAULT_INCOME_TYPES: Array<{
  key: string;
  label: string;
  color: string;
  sort_order: number;
}> = [
  { key: 'weekly_payment', label: 'Pago Semanal', color: '#16a34a', sort_order: 0 },
  { key: 'tip_share', label: 'Propinas', color: '#22c55e', sort_order: 10 },
  { key: 'bonus', label: 'Bonificación', color: '#4ade80', sort_order: 20 },
  { key: 'other', label: 'Otros', color: '#86efac', sort_order: 30 },
];

/**
 * Default label maps (fallback when Firestore categories not loaded)
 */
export const DEFAULT_EXPENSE_LABELS: CategoryLabelMap = Object.fromEntries(
  DEFAULT_EXPENSE_CATEGORIES.map((c) => [c.key, c.label])
);

export const DEFAULT_INCOME_LABELS: CategoryLabelMap = Object.fromEntries(
  DEFAULT_INCOME_TYPES.map((c) => [c.key, c.label])
);

/**
 * Default color maps (fallback when Firestore categories not loaded)
 */
export const DEFAULT_EXPENSE_COLORS: CategoryColorMap = Object.fromEntries(
  DEFAULT_EXPENSE_CATEGORIES.map((c) => [c.key, c.color])
);

export const DEFAULT_INCOME_COLORS: CategoryColorMap = Object.fromEntries(
  DEFAULT_INCOME_TYPES.map((c) => [c.key, c.color])
);
