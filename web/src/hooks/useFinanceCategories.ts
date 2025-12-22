/**
 * React hook for accessing finance categories
 *
 * Provides convenient access to the finance categories store with
 * computed values for expense and income categories.
 */

import { useEffect } from 'react';
import { useFinanceCategoriesStore } from '@/core/store/finance-categories-store';

/**
 * Hook to access finance categories with auto-loading
 */
export function useFinanceCategories() {
  const {
    categories,
    expenseCategories,
    incomeCategories,
    activeExpenseCategories,
    activeIncomeCategories,
    expenseLabels,
    expenseColors,
    incomeLabels,
    incomeColors,
    isLoading,
    isInitialized,
    error,
    loadCategories,
    refreshCategories,
    getExpenseLabel,
    getExpenseColor,
    getIncomeLabel,
    getIncomeColor,
  } = useFinanceCategoriesStore();

  // Auto-load categories on first use
  useEffect(() => {
    if (!isInitialized && !isLoading) {
      loadCategories();
    }
  }, [isInitialized, isLoading, loadCategories]);

  return {
    // All categories
    categories,

    // Separated by type
    expenseCategories,
    incomeCategories,

    // Active only (for dropdowns)
    activeExpenseCategories,
    activeIncomeCategories,

    // Lookup maps
    expenseLabels,
    expenseColors,
    incomeLabels,
    incomeColors,

    // Lookup functions
    getExpenseLabel,
    getExpenseColor,
    getIncomeLabel,
    getIncomeColor,

    // State
    isLoading,
    isInitialized,
    error,

    // Actions
    refreshCategories,
  };
}

/**
 * Hook for expense categories only
 */
export function useExpenseCategories() {
  const {
    expenseCategories,
    activeExpenseCategories,
    expenseLabels,
    expenseColors,
    isLoading,
    isInitialized,
    error,
    loadCategories,
    refreshCategories,
    getExpenseLabel,
    getExpenseColor,
  } = useFinanceCategoriesStore();

  useEffect(() => {
    if (!isInitialized && !isLoading) {
      loadCategories();
    }
  }, [isInitialized, isLoading, loadCategories]);

  return {
    categories: expenseCategories,
    activeCategories: activeExpenseCategories,
    labels: expenseLabels,
    colors: expenseColors,
    getLabel: getExpenseLabel,
    getColor: getExpenseColor,
    isLoading,
    error,
    refresh: refreshCategories,
  };
}

/**
 * Hook for income categories only
 */
export function useIncomeCategories() {
  const {
    incomeCategories,
    activeIncomeCategories,
    incomeLabels,
    incomeColors,
    isLoading,
    isInitialized,
    error,
    loadCategories,
    refreshCategories,
    getIncomeLabel,
    getIncomeColor,
  } = useFinanceCategoriesStore();

  useEffect(() => {
    if (!isInitialized && !isLoading) {
      loadCategories();
    }
  }, [isInitialized, isLoading, loadCategories]);

  return {
    categories: incomeCategories,
    activeCategories: activeIncomeCategories,
    labels: incomeLabels,
    colors: incomeColors,
    getLabel: getIncomeLabel,
    getColor: getIncomeColor,
    isLoading,
    error,
    refresh: refreshCategories,
  };
}

/**
 * Get valid category keys for Zod validation
 */
export function useExpenseCategoryKeys(): string[] {
  const { activeExpenseCategories, isInitialized } = useFinanceCategoriesStore();

  if (!isInitialized) {
    // Return defaults while loading
    return [
      'fuel',
      'maintenance',
      'insurance_soat',
      'tecnomecanica',
      'taxes',
      'fines',
      'parking',
      'car_wash',
      'accessories',
      'other',
    ];
  }

  return activeExpenseCategories.map((c) => c.key);
}

/**
 * Get valid income type keys for Zod validation
 */
export function useIncomeCategoryKeys(): string[] {
  const { activeIncomeCategories, isInitialized } = useFinanceCategoriesStore();

  if (!isInitialized) {
    // Return defaults while loading
    return ['weekly_payment', 'tip_share', 'bonus', 'other'];
  }

  return activeIncomeCategories.map((c) => c.key);
}
