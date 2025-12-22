/**
 * Tests for useFinanceCategories hooks
 *
 * Tests the React hooks for accessing finance categories.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { FinanceCategory } from '@/core/types/finance-category.types';

// Mock the Firebase service
const { mockGetFinanceCategories } = vi.hoisted(() => ({
  mockGetFinanceCategories: vi.fn(),
}));

vi.mock('@/core/firebase/finance-categories', () => ({
  getFinanceCategories: mockGetFinanceCategories,
}));

// Import hooks after mocking
import {
  useFinanceCategories,
  useExpenseCategories,
  useIncomeCategories,
  useExpenseCategoryKeys,
  useIncomeCategoryKeys,
} from '@/hooks/useFinanceCategories';
import { useFinanceCategoriesStore } from '@/core/store/finance-categories-store';

// Helper to create mock categories
const createMockCategory = (overrides: Partial<FinanceCategory> = {}): FinanceCategory => ({
  id: 'cat-123',
  category_type: 'expense',
  key: 'fuel',
  label: 'Combustible',
  color: '#ef4444',
  sort_order: 1,
  is_active: true,
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
  ...overrides,
});

const mockExpenseCategories: FinanceCategory[] = [
  createMockCategory({ id: '1', key: 'fuel', label: 'Combustible', color: '#ef4444' }),
  createMockCategory({ id: '2', key: 'maintenance', label: 'Mantenimiento', color: '#f97316' }),
];

const mockIncomeCategories: FinanceCategory[] = [
  createMockCategory({
    id: '3',
    category_type: 'income',
    key: 'weekly_payment',
    label: 'Pago Semanal',
    color: '#22c55e',
  }),
];

describe('useFinanceCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useFinanceCategoriesStore.setState({
      categories: [],
      expenseCategories: [],
      incomeCategories: [],
      activeExpenseCategories: [],
      activeIncomeCategories: [],
      isLoading: false,
      isInitialized: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useFinanceCategories hook', () => {
    it('auto-loads categories on mount', async () => {
      mockGetFinanceCategories.mockResolvedValue([
        ...mockExpenseCategories,
        ...mockIncomeCategories,
      ]);

      const { result } = renderHook(() => useFinanceCategories());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(mockGetFinanceCategories).toHaveBeenCalledTimes(1);
      expect(result.current.categories).toHaveLength(3);
    });

    it('returns expense and income categories separately', async () => {
      mockGetFinanceCategories.mockResolvedValue([
        ...mockExpenseCategories,
        ...mockIncomeCategories,
      ]);

      const { result } = renderHook(() => useFinanceCategories());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.expenseCategories).toHaveLength(2);
      expect(result.current.incomeCategories).toHaveLength(1);
    });

    it('provides lookup functions', async () => {
      mockGetFinanceCategories.mockResolvedValue([
        ...mockExpenseCategories,
        ...mockIncomeCategories,
      ]);

      const { result } = renderHook(() => useFinanceCategories());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.getExpenseLabel('fuel')).toBe('Combustible');
      expect(result.current.getIncomeLabel('weekly_payment')).toBe('Pago Semanal');
    });

    it('does not reload if already initialized', async () => {
      mockGetFinanceCategories.mockResolvedValue([...mockExpenseCategories]);

      // Set store as already initialized
      useFinanceCategoriesStore.setState({
        isInitialized: true,
        expenseCategories: mockExpenseCategories,
      });

      renderHook(() => useFinanceCategories());

      // Should not call Firebase again
      expect(mockGetFinanceCategories).not.toHaveBeenCalled();
    });
  });

  describe('useExpenseCategories hook', () => {
    it('returns only expense categories', async () => {
      mockGetFinanceCategories.mockResolvedValue([
        ...mockExpenseCategories,
        ...mockIncomeCategories,
      ]);

      const { result } = renderHook(() => useExpenseCategories());

      await waitFor(() => {
        expect(result.current.categories).toHaveLength(2);
      });

      expect(result.current.categories[0].key).toBe('fuel');
      expect(result.current.categories[1].key).toBe('maintenance');
    });

    it('provides getLabel and getColor functions', async () => {
      mockGetFinanceCategories.mockResolvedValue([...mockExpenseCategories]);

      const { result } = renderHook(() => useExpenseCategories());

      await waitFor(() => {
        expect(result.current.categories).toHaveLength(2);
      });

      expect(result.current.getLabel('fuel')).toBe('Combustible');
      expect(result.current.getColor('fuel')).toBe('#ef4444');
    });
  });

  describe('useIncomeCategories hook', () => {
    it('returns only income categories', async () => {
      mockGetFinanceCategories.mockResolvedValue([
        ...mockExpenseCategories,
        ...mockIncomeCategories,
      ]);

      const { result } = renderHook(() => useIncomeCategories());

      await waitFor(() => {
        expect(result.current.categories).toHaveLength(1);
      });

      expect(result.current.categories[0].key).toBe('weekly_payment');
    });

    it('provides getLabel and getColor functions', async () => {
      mockGetFinanceCategories.mockResolvedValue([...mockIncomeCategories]);

      const { result } = renderHook(() => useIncomeCategories());

      await waitFor(() => {
        expect(result.current.categories).toHaveLength(1);
      });

      expect(result.current.getLabel('weekly_payment')).toBe('Pago Semanal');
      expect(result.current.getColor('weekly_payment')).toBe('#22c55e');
    });
  });

  describe('useExpenseCategoryKeys', () => {
    it('returns default keys when not initialized', () => {
      const { result } = renderHook(() => useExpenseCategoryKeys());

      expect(result.current).toContain('fuel');
      expect(result.current).toContain('maintenance');
      expect(result.current).toContain('other');
    });

    it('returns keys from loaded categories when initialized', async () => {
      mockGetFinanceCategories.mockResolvedValue(mockExpenseCategories);

      // Initialize the store first
      await useFinanceCategoriesStore.getState().loadCategories();

      const { result } = renderHook(() => useExpenseCategoryKeys());

      expect(result.current).toEqual(['fuel', 'maintenance']);
    });
  });

  describe('useIncomeCategoryKeys', () => {
    it('returns default keys when not initialized', () => {
      const { result } = renderHook(() => useIncomeCategoryKeys());

      expect(result.current).toContain('weekly_payment');
      expect(result.current).toContain('bonus');
      expect(result.current).toContain('other');
    });

    it('returns keys from loaded categories when initialized', async () => {
      mockGetFinanceCategories.mockResolvedValue(mockIncomeCategories);

      // Initialize the store first
      await useFinanceCategoriesStore.getState().loadCategories();

      const { result } = renderHook(() => useIncomeCategoryKeys());

      expect(result.current).toEqual(['weekly_payment']);
    });
  });
});
