/**
 * Hook for fetching and managing vehicle finances (income/expenses) from Firebase
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getVehicleIncome,
  createVehicleIncome,
  updateVehicleIncome,
  deleteVehicleIncome,
  getVehicleExpenses,
  createVehicleExpense,
  updateVehicleExpense,
  deleteVehicleExpense,
  calculatePLSummary,
  convertFirestoreIncome,
  convertFirestoreExpense,
  type FirestoreVehicleIncome,
  type FirestoreVehicleExpense,
} from '@/core/firebase';
import type {
  VehicleIncome,
  VehicleExpense,
  VehicleIncomeCreateInput,
  VehicleIncomeUpdateInput,
  VehicleExpenseCreateInput,
  VehicleExpenseUpdateInput,
  VehiclePLSummary,
  IncomeType,
  ExpenseCategory,
} from '@/core/types';

interface UseVehicleFinancesOptions {
  startDate?: Date;
  endDate?: Date;
  incomeType?: IncomeType;
  expenseCategory?: ExpenseCategory;
}

interface UseVehicleFinancesReturn {
  income: VehicleIncome[];
  expenses: VehicleExpense[];
  summary: VehiclePLSummary | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addIncome: (
    input: VehicleIncomeCreateInput
  ) => Promise<{ success: boolean; id?: string; error?: string }>;
  updateIncome: (incomeId: string, updates: VehicleIncomeUpdateInput) => Promise<void>;
  deleteIncome: (incomeId: string) => Promise<void>;
  addExpense: (
    input: VehicleExpenseCreateInput
  ) => Promise<{ success: boolean; id?: string; error?: string }>;
  updateExpense: (expenseId: string, updates: VehicleExpenseUpdateInput) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
}

export const useVehicleFinances = (
  ownerId: string | undefined,
  vehicleId: string | undefined,
  options?: UseVehicleFinancesOptions
): UseVehicleFinancesReturn => {
  const [income, setIncome] = useState<VehicleIncome[]>([]);
  const [expenses, setExpenses] = useState<VehicleExpense[]>([]);
  const [rawIncome, setRawIncome] = useState<FirestoreVehicleIncome[]>([]);
  const [rawExpenses, setRawExpenses] = useState<FirestoreVehicleExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default date range to current month if not specified
  // Memoize dates to prevent new object creation on every render
  const effectiveStartDate = useMemo(
    () => options?.startDate ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    [options?.startDate]
  );
  const effectiveEndDate = useMemo(() => options?.endDate ?? new Date(), [options?.endDate]);

  const fetchData = useCallback(async () => {
    if (!ownerId || !vehicleId) {
      setIncome([]);
      setExpenses([]);
      setRawIncome([]);
      setRawExpenses([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [fetchedIncome, fetchedExpenses] = await Promise.all([
        getVehicleIncome(vehicleId, {
          startDate: effectiveStartDate,
          endDate: effectiveEndDate,
          type: options?.incomeType,
        }),
        getVehicleExpenses(vehicleId, {
          startDate: effectiveStartDate,
          endDate: effectiveEndDate,
          category: options?.expenseCategory,
        }),
      ]);

      setRawIncome(fetchedIncome);
      setRawExpenses(fetchedExpenses);
      setIncome(fetchedIncome.map(convertFirestoreIncome));
      setExpenses(fetchedExpenses.map(convertFirestoreExpense));
    } catch (err) {
      console.error('[useVehicleFinances] Error fetching data:', err);
      const message = err instanceof Error ? err.message : 'Error al cargar las finanzas';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [
    ownerId,
    vehicleId,
    effectiveStartDate,
    effectiveEndDate,
    options?.incomeType,
    options?.expenseCategory,
  ]);

  // Calculate summary from raw data
  const summary = useMemo(() => {
    if (!vehicleId || (rawIncome.length === 0 && rawExpenses.length === 0)) {
      return null;
    }
    return calculatePLSummary(
      vehicleId,
      rawIncome,
      rawExpenses,
      effectiveStartDate,
      effectiveEndDate
    );
  }, [vehicleId, rawIncome, rawExpenses, effectiveStartDate, effectiveEndDate]);

  // Income CRUD
  const handleAddIncome = useCallback(
    async (input: VehicleIncomeCreateInput) => {
      if (!ownerId || !vehicleId) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      const result = await createVehicleIncome(vehicleId, ownerId, input);
      if (result.success) {
        await fetchData();
      }
      return { success: result.success, id: result.incomeId, error: result.error };
    },
    [ownerId, vehicleId, fetchData]
  );

  const handleUpdateIncome = useCallback(
    async (incomeId: string, updates: VehicleIncomeUpdateInput) => {
      if (!ownerId || !vehicleId) {
        setError('Usuario no autenticado');
        return;
      }

      // Optimistic update
      setIncome((prev) =>
        prev.map((i) => {
          if (i.id !== incomeId) return i;
          return {
            ...i,
            ...(updates.type !== undefined && { type: updates.type }),
            ...(updates.amount !== undefined && { amount: updates.amount }),
            ...(updates.description !== undefined && { description: updates.description }),
            ...(updates.notes !== undefined && { notes: updates.notes }),
            ...(updates.driver_name !== undefined && { driver_name: updates.driver_name }),
          };
        })
      );

      try {
        const result = await updateVehicleIncome(vehicleId, incomeId, updates);
        if (!result.success) {
          setError(result.error || 'Error al actualizar el ingreso');
          await fetchData();
        }
      } catch (err) {
        console.error('[useVehicleFinances] Error updating income:', err);
        const message = err instanceof Error ? err.message : 'Error al actualizar el ingreso';
        setError(message);
        await fetchData();
      }
    },
    [ownerId, vehicleId, fetchData]
  );

  const handleDeleteIncome = useCallback(
    async (incomeId: string) => {
      if (!ownerId || !vehicleId) {
        setError('Usuario no autenticado');
        return;
      }

      // Optimistic removal
      setIncome((prev) => prev.filter((i) => i.id !== incomeId));
      setRawIncome((prev) => prev.filter((i) => i.id !== incomeId));

      try {
        const result = await deleteVehicleIncome(vehicleId, incomeId);
        if (!result.success) {
          setError(result.error || 'Error al eliminar el ingreso');
          await fetchData();
        }
      } catch (err) {
        console.error('[useVehicleFinances] Error deleting income:', err);
        const message = err instanceof Error ? err.message : 'Error al eliminar el ingreso';
        setError(message);
        await fetchData();
      }
    },
    [ownerId, vehicleId, fetchData]
  );

  // Expense CRUD
  const handleAddExpense = useCallback(
    async (input: VehicleExpenseCreateInput) => {
      if (!ownerId || !vehicleId) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      const result = await createVehicleExpense(vehicleId, ownerId, input);
      if (result.success) {
        await fetchData();
      }
      return { success: result.success, id: result.expenseId, error: result.error };
    },
    [ownerId, vehicleId, fetchData]
  );

  const handleUpdateExpense = useCallback(
    async (expenseId: string, updates: VehicleExpenseUpdateInput) => {
      if (!ownerId || !vehicleId) {
        setError('Usuario no autenticado');
        return;
      }

      // Optimistic update
      setExpenses((prev) =>
        prev.map((e) => {
          if (e.id !== expenseId) return e;
          return {
            ...e,
            ...(updates.category !== undefined && { category: updates.category }),
            ...(updates.amount !== undefined && { amount: updates.amount }),
            ...(updates.description !== undefined && { description: updates.description }),
            ...(updates.notes !== undefined && { notes: updates.notes }),
            ...(updates.vendor !== undefined && { vendor: updates.vendor }),
          };
        })
      );

      try {
        const result = await updateVehicleExpense(vehicleId, expenseId, updates);
        if (!result.success) {
          setError(result.error || 'Error al actualizar el gasto');
          await fetchData();
        }
      } catch (err) {
        console.error('[useVehicleFinances] Error updating expense:', err);
        const message = err instanceof Error ? err.message : 'Error al actualizar el gasto';
        setError(message);
        await fetchData();
      }
    },
    [ownerId, vehicleId, fetchData]
  );

  const handleDeleteExpense = useCallback(
    async (expenseId: string) => {
      if (!ownerId || !vehicleId) {
        setError('Usuario no autenticado');
        return;
      }

      // Optimistic removal
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
      setRawExpenses((prev) => prev.filter((e) => e.id !== expenseId));

      try {
        const result = await deleteVehicleExpense(vehicleId, expenseId);
        if (!result.success) {
          setError(result.error || 'Error al eliminar el gasto');
          await fetchData();
        }
      } catch (err) {
        console.error('[useVehicleFinances] Error deleting expense:', err);
        const message = err instanceof Error ? err.message : 'Error al eliminar el gasto';
        setError(message);
        await fetchData();
      }
    },
    [ownerId, vehicleId, fetchData]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    income,
    expenses,
    summary,
    isLoading,
    error,
    refetch: fetchData,
    addIncome: handleAddIncome,
    updateIncome: handleUpdateIncome,
    deleteIncome: handleDeleteIncome,
    addExpense: handleAddExpense,
    updateExpense: handleUpdateExpense,
    deleteExpense: handleDeleteExpense,
  };
};
