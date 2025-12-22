/**
 * Tests for Finance Categories Store
 *
 * Tests the Zustand store for managing dynamic expense/income categories.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import type { FinanceCategory } from '@/core/types/finance-category.types';

// Mock the Firebase service
const { mockGetFinanceCategories } = vi.hoisted(() => ({
  mockGetFinanceCategories: vi.fn(),
}));

vi.mock('@/core/firebase/finance-categories', () => ({
  getFinanceCategories: mockGetFinanceCategories,
}));

// Import store after mocking
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
  createMockCategory({
    id: '1',
    key: 'fuel',
    label: 'Combustible',
    color: '#ef4444',
    sort_order: 1,
  }),
  createMockCategory({
    id: '2',
    key: 'maintenance',
    label: 'Mantenimiento',
    color: '#f97316',
    sort_order: 2,
  }),
  createMockCategory({
    id: '3',
    key: 'parking',
    label: 'Parqueadero',
    color: '#3b82f6',
    sort_order: 3,
    is_active: false,
  }),
];

const mockIncomeCategories: FinanceCategory[] = [
  createMockCategory({
    id: '4',
    category_type: 'income',
    key: 'weekly_payment',
    label: 'Pago Semanal',
    color: '#22c55e',
    sort_order: 1,
  }),
  createMockCategory({
    id: '5',
    category_type: 'income',
    key: 'bonus',
    label: 'Bonificación',
    color: '#84cc16',
    sort_order: 2,
  }),
];

describe('FinanceCategoriesStore', () => {
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

  describe('Initial State', () => {
    it('starts with empty categories', () => {
      const state = useFinanceCategoriesStore.getState();

      expect(state.categories).toEqual([]);
      expect(state.expenseCategories).toEqual([]);
      expect(state.incomeCategories).toEqual([]);
      expect(state.isInitialized).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('has default expense labels and colors', () => {
      const state = useFinanceCategoriesStore.getState();

      expect(state.expenseLabels['fuel']).toBe('Combustible');
      expect(state.expenseColors['fuel']).toBe('#ef4444');
    });

    it('has default income labels and colors', () => {
      const state = useFinanceCategoriesStore.getState();

      expect(state.incomeLabels['weekly_payment']).toBe('Pago Semanal');
      expect(state.incomeColors['weekly_payment']).toBe('#16a34a');
    });
  });

  describe('loadCategories', () => {
    it('loads categories from Firebase', async () => {
      mockGetFinanceCategories.mockResolvedValue([
        ...mockExpenseCategories,
        ...mockIncomeCategories,
      ]);

      await act(async () => {
        await useFinanceCategoriesStore.getState().loadCategories();
      });

      const state = useFinanceCategoriesStore.getState();
      expect(state.categories).toHaveLength(5);
      expect(state.expenseCategories).toHaveLength(3);
      expect(state.incomeCategories).toHaveLength(2);
      expect(state.isInitialized).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('filters active categories correctly', async () => {
      mockGetFinanceCategories.mockResolvedValue([
        ...mockExpenseCategories,
        ...mockIncomeCategories,
      ]);

      await act(async () => {
        await useFinanceCategoriesStore.getState().loadCategories();
      });

      const state = useFinanceCategoriesStore.getState();
      // parking is inactive
      expect(state.activeExpenseCategories).toHaveLength(2);
      expect(state.activeIncomeCategories).toHaveLength(2);
    });

    it('builds lookup maps correctly', async () => {
      mockGetFinanceCategories.mockResolvedValue([
        ...mockExpenseCategories,
        ...mockIncomeCategories,
      ]);

      await act(async () => {
        await useFinanceCategoriesStore.getState().loadCategories();
      });

      const state = useFinanceCategoriesStore.getState();
      expect(state.expenseLabels['fuel']).toBe('Combustible');
      expect(state.expenseLabels['maintenance']).toBe('Mantenimiento');
      expect(state.incomeLabels['weekly_payment']).toBe('Pago Semanal');
    });

    it('skips loading if already initialized', async () => {
      mockGetFinanceCategories.mockResolvedValue([]);

      // First load
      await act(async () => {
        await useFinanceCategoriesStore.getState().loadCategories();
      });

      // Second load should be skipped
      await act(async () => {
        await useFinanceCategoriesStore.getState().loadCategories();
      });

      expect(mockGetFinanceCategories).toHaveBeenCalledTimes(1);
    });

    it('handles errors gracefully', async () => {
      mockGetFinanceCategories.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        await useFinanceCategoriesStore.getState().loadCategories();
      });

      const state = useFinanceCategoriesStore.getState();
      expect(state.error).toBe('Network error');
      expect(state.isInitialized).toBe(true); // Still marked as initialized
      expect(state.isLoading).toBe(false);
    });
  });

  describe('refreshCategories', () => {
    it('forces reload even if already initialized', async () => {
      mockGetFinanceCategories.mockResolvedValue([...mockExpenseCategories]);

      // First load
      await act(async () => {
        await useFinanceCategoriesStore.getState().loadCategories();
      });

      // Refresh
      await act(async () => {
        await useFinanceCategoriesStore.getState().refreshCategories();
      });

      expect(mockGetFinanceCategories).toHaveBeenCalledTimes(2);
    });
  });

  describe('getExpenseLabel', () => {
    it('returns label for known key', async () => {
      mockGetFinanceCategories.mockResolvedValue(mockExpenseCategories);

      await act(async () => {
        await useFinanceCategoriesStore.getState().loadCategories();
      });

      const label = useFinanceCategoriesStore.getState().getExpenseLabel('fuel');
      expect(label).toBe('Combustible');
    });

    it('returns key as fallback for unknown key', () => {
      const label = useFinanceCategoriesStore.getState().getExpenseLabel('unknown_key');
      expect(label).toBe('unknown_key');
    });
  });

  describe('getExpenseColor', () => {
    it('returns color for known key', async () => {
      mockGetFinanceCategories.mockResolvedValue(mockExpenseCategories);

      await act(async () => {
        await useFinanceCategoriesStore.getState().loadCategories();
      });

      const color = useFinanceCategoriesStore.getState().getExpenseColor('fuel');
      expect(color).toBe('#ef4444');
    });

    it('returns gray fallback for unknown key', () => {
      const color = useFinanceCategoriesStore.getState().getExpenseColor('unknown_key');
      expect(color).toBe('#6b7280');
    });
  });

  describe('getIncomeLabel', () => {
    it('returns label for known key', async () => {
      mockGetFinanceCategories.mockResolvedValue(mockIncomeCategories);

      await act(async () => {
        await useFinanceCategoriesStore.getState().loadCategories();
      });

      const label = useFinanceCategoriesStore.getState().getIncomeLabel('weekly_payment');
      expect(label).toBe('Pago Semanal');
    });

    it('returns key as fallback for unknown key', () => {
      const label = useFinanceCategoriesStore.getState().getIncomeLabel('unknown_key');
      expect(label).toBe('unknown_key');
    });
  });

  describe('getIncomeColor', () => {
    it('returns color for known key', async () => {
      mockGetFinanceCategories.mockResolvedValue(mockIncomeCategories);

      await act(async () => {
        await useFinanceCategoriesStore.getState().loadCategories();
      });

      const color = useFinanceCategoriesStore.getState().getIncomeColor('weekly_payment');
      expect(color).toBe('#22c55e');
    });

    it('returns light green fallback for unknown key', () => {
      const color = useFinanceCategoriesStore.getState().getIncomeColor('unknown_key');
      expect(color).toBe('#86efac');
    });
  });
});
