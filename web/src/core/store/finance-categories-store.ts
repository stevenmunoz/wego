/**
 * Finance categories state management using Zustand
 *
 * Manages dynamic expense categories and income types loaded from Firestore.
 * Categories are loaded once at app startup and cached globally.
 */

import { create } from 'zustand';
import type {
  FinanceCategory,
  CategoryLabelMap,
  CategoryColorMap,
} from '@/core/types/finance-category.types';
import {
  DEFAULT_EXPENSE_LABELS,
  DEFAULT_EXPENSE_COLORS,
  DEFAULT_INCOME_LABELS,
  DEFAULT_INCOME_COLORS,
} from '@/core/types/finance-category.types';
import { getFinanceCategories } from '@/core/firebase/finance-categories';

interface FinanceCategoriesState {
  // Raw category data
  categories: FinanceCategory[];
  expenseCategories: FinanceCategory[];
  incomeCategories: FinanceCategory[];

  // Active categories only (for form dropdowns)
  activeExpenseCategories: FinanceCategory[];
  activeIncomeCategories: FinanceCategory[];

  // Lookup maps (key -> label/color)
  expenseLabels: CategoryLabelMap;
  expenseColors: CategoryColorMap;
  incomeLabels: CategoryLabelMap;
  incomeColors: CategoryColorMap;

  // State
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  loadCategories: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  getExpenseLabel: (key: string) => string;
  getExpenseColor: (key: string) => string;
  getIncomeLabel: (key: string) => string;
  getIncomeColor: (key: string) => string;
}

/**
 * Build lookup maps from categories array
 */
function buildLookupMaps(categories: FinanceCategory[]): {
  labels: CategoryLabelMap;
  colors: CategoryColorMap;
} {
  const labels: CategoryLabelMap = {};
  const colors: CategoryColorMap = {};

  for (const category of categories) {
    labels[category.key] = category.label;
    colors[category.key] = category.color;
  }

  return { labels, colors };
}

export const useFinanceCategoriesStore = create<FinanceCategoriesState>((set, get) => ({
  // Initial state with defaults as fallback
  categories: [],
  expenseCategories: [],
  incomeCategories: [],
  activeExpenseCategories: [],
  activeIncomeCategories: [],
  expenseLabels: DEFAULT_EXPENSE_LABELS,
  expenseColors: DEFAULT_EXPENSE_COLORS,
  incomeLabels: DEFAULT_INCOME_LABELS,
  incomeColors: DEFAULT_INCOME_COLORS,
  isLoading: false,
  isInitialized: false,
  error: null,

  loadCategories: async () => {
    // Skip if already initialized
    if (get().isInitialized) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const categories = await getFinanceCategories();

      const expenseCategories = categories.filter((c) => c.category_type === 'expense');
      const incomeCategories = categories.filter((c) => c.category_type === 'income');

      const activeExpenseCategories = expenseCategories.filter((c) => c.is_active);
      const activeIncomeCategories = incomeCategories.filter((c) => c.is_active);

      const { labels: expenseLabels, colors: expenseColors } = buildLookupMaps(expenseCategories);
      const { labels: incomeLabels, colors: incomeColors } = buildLookupMaps(incomeCategories);

      set({
        categories,
        expenseCategories,
        incomeCategories,
        activeExpenseCategories,
        activeIncomeCategories,
        expenseLabels: { ...DEFAULT_EXPENSE_LABELS, ...expenseLabels },
        expenseColors: { ...DEFAULT_EXPENSE_COLORS, ...expenseColors },
        incomeLabels: { ...DEFAULT_INCOME_LABELS, ...incomeLabels },
        incomeColors: { ...DEFAULT_INCOME_COLORS, ...incomeColors },
        isLoading: false,
        isInitialized: true,
        error: null,
      });
    } catch (error) {
      console.error('[finance-categories-store] Error loading categories:', error);
      const message = error instanceof Error ? error.message : 'Error al cargar categorías';

      // Keep defaults on error
      set({
        isLoading: false,
        isInitialized: true, // Mark as initialized even on error to prevent infinite retries
        error: message,
      });
    }
  },

  refreshCategories: async () => {
    // Reset initialized flag to force reload
    set({ isInitialized: false });
    await get().loadCategories();
  },

  getExpenseLabel: (key: string) => {
    return get().expenseLabels[key] || key;
  },

  getExpenseColor: (key: string) => {
    return get().expenseColors[key] || '#6b7280'; // Gray fallback
  },

  getIncomeLabel: (key: string) => {
    return get().incomeLabels[key] || key;
  },

  getIncomeColor: (key: string) => {
    return get().incomeColors[key] || '#86efac'; // Light green fallback
  },
}));
