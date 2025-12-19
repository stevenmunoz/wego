/**
 * Firestore vehicle finances service for P/L tracking
 *
 * Income and expenses are stored as subcollections under vehicles:
 * - vehicles/{vehicleId}/income/{incomeId}
 * - vehicles/{vehicleId}/expenses/{expenseId}
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firestore';
import type {
  IncomeType,
  ExpenseCategory,
  RecurrenceFrequency,
  VehicleIncomeCreateInput,
  VehicleIncomeUpdateInput,
  VehicleExpenseCreateInput,
  VehicleExpenseUpdateInput,
  VehiclePLSummary,
} from '../types/vehicle-finance.types';

// ============ Firestore Types ============

export interface FirestoreRecurrencePattern {
  frequency: RecurrenceFrequency;
  start_date: Timestamp;
  end_date?: Timestamp;
  next_occurrence?: Timestamp;
}

export interface FirestoreVehicleIncome {
  id: string;
  vehicle_id: string;
  owner_id: string;
  type: IncomeType;
  amount: number;
  description: string;
  date: Timestamp;
  is_recurring: boolean;
  recurrence_pattern?: FirestoreRecurrencePattern;
  recurring_parent_id?: string;
  driver_id?: string;
  driver_name?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  notes?: string;
}

export interface FirestoreVehicleExpense {
  id: string;
  vehicle_id: string;
  owner_id: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: Timestamp;
  is_recurring: boolean;
  recurrence_pattern?: FirestoreRecurrencePattern;
  recurring_parent_id?: string;
  receipt_url?: string;
  vendor?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  notes?: string;
}

// ============ Vehicle Income CRUD ============

/**
 * Get income entries for a vehicle
 */
export async function getVehicleIncome(
  vehicleId: string,
  options?: { startDate?: Date; endDate?: Date; type?: IncomeType }
): Promise<FirestoreVehicleIncome[]> {
  const incomeCollection = collection(db, 'vehicles', vehicleId, 'income');

  const q = query(incomeCollection, orderBy('date', 'desc'));

  // Note: Firestore requires composite indexes for multiple where clauses
  // For now, we'll filter in memory if needed
  const snapshot = await getDocs(q);
  let results = snapshot.docs.map((doc) => doc.data() as FirestoreVehicleIncome);

  // Apply filters in memory
  if (options?.startDate) {
    const startTs = Timestamp.fromDate(options.startDate);
    results = results.filter((r) => r.date.toMillis() >= startTs.toMillis());
  }
  if (options?.endDate) {
    const endTs = Timestamp.fromDate(options.endDate);
    results = results.filter((r) => r.date.toMillis() <= endTs.toMillis());
  }
  if (options?.type) {
    results = results.filter((r) => r.type === options.type);
  }

  return results;
}

/**
 * Create a new income entry
 */
export async function createVehicleIncome(
  vehicleId: string,
  ownerId: string,
  input: VehicleIncomeCreateInput
): Promise<{ success: boolean; incomeId?: string; error?: string }> {
  try {
    const incomeCollection = collection(db, 'vehicles', vehicleId, 'income');
    const incomeRef = doc(incomeCollection);

    const now = Timestamp.now();
    // Build income object without undefined values (Firestore doesn't accept undefined)
    const income: Record<string, unknown> = {
      id: incomeRef.id,
      vehicle_id: vehicleId,
      owner_id: ownerId,
      type: input.type,
      amount: input.amount,
      description: input.description,
      date: Timestamp.fromDate(new Date(input.date)),
      is_recurring: input.is_recurring ?? false,
      created_at: now,
      updated_at: now,
    };

    // Only add optional fields if they have values
    if (input.driver_id) income.driver_id = input.driver_id;
    if (input.driver_name) income.driver_name = input.driver_name;
    if (input.notes) income.notes = input.notes;

    // Add recurrence pattern if recurring
    if (input.is_recurring && input.recurrence_pattern) {
      const recurrence: Record<string, unknown> = {
        frequency: input.recurrence_pattern.frequency,
        start_date: Timestamp.fromDate(new Date(input.recurrence_pattern.start_date)),
      };
      if (input.recurrence_pattern.end_date) {
        recurrence.end_date = Timestamp.fromDate(new Date(input.recurrence_pattern.end_date));
      }
      income.recurrence_pattern = recurrence;
    }

    await setDoc(incomeRef, income);

    return { success: true, incomeId: incomeRef.id };
  } catch (error) {
    console.error('[Firestore] Error creating income:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Update an income entry
 */
export async function updateVehicleIncome(
  vehicleId: string,
  incomeId: string,
  updates: VehicleIncomeUpdateInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const incomeRef = doc(db, 'vehicles', vehicleId, 'income', incomeId);

    // Build updates object without undefined values (Firestore doesn't accept undefined)
    const firestoreUpdates: Record<string, unknown> = {
      updated_at: serverTimestamp(),
    };

    // Only add fields that have defined values
    if (updates.type !== undefined) firestoreUpdates.type = updates.type;
    if (updates.amount !== undefined) firestoreUpdates.amount = updates.amount;
    if (updates.description !== undefined) firestoreUpdates.description = updates.description;
    if (updates.is_recurring !== undefined) firestoreUpdates.is_recurring = updates.is_recurring;
    if (updates.driver_id !== undefined) firestoreUpdates.driver_id = updates.driver_id;
    if (updates.driver_name !== undefined) firestoreUpdates.driver_name = updates.driver_name;
    if (updates.notes !== undefined) firestoreUpdates.notes = updates.notes;

    // Convert date string to Timestamp
    if (updates.date) {
      firestoreUpdates.date = Timestamp.fromDate(new Date(updates.date));
    }

    // Handle recurrence pattern
    if (updates.recurrence_pattern) {
      const recurrence: Record<string, unknown> = {
        frequency: updates.recurrence_pattern.frequency,
        start_date: Timestamp.fromDate(new Date(updates.recurrence_pattern.start_date)),
      };
      if (updates.recurrence_pattern.end_date) {
        recurrence.end_date = Timestamp.fromDate(new Date(updates.recurrence_pattern.end_date));
      }
      firestoreUpdates.recurrence_pattern = recurrence;
    }

    await updateDoc(incomeRef, firestoreUpdates);

    return { success: true };
  } catch (error) {
    console.error('[Firestore] Error updating income:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Delete an income entry
 */
export async function deleteVehicleIncome(
  vehicleId: string,
  incomeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const incomeRef = doc(db, 'vehicles', vehicleId, 'income', incomeId);
    await deleteDoc(incomeRef);

    return { success: true };
  } catch (error) {
    console.error('[Firestore] Error deleting income:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

// ============ Vehicle Expenses CRUD ============

/**
 * Get expense entries for a vehicle
 */
export async function getVehicleExpenses(
  vehicleId: string,
  options?: { startDate?: Date; endDate?: Date; category?: ExpenseCategory }
): Promise<FirestoreVehicleExpense[]> {
  const expenseCollection = collection(db, 'vehicles', vehicleId, 'expenses');

  const q = query(expenseCollection, orderBy('date', 'desc'));

  const snapshot = await getDocs(q);
  let results = snapshot.docs.map((doc) => doc.data() as FirestoreVehicleExpense);

  // Apply filters in memory
  if (options?.startDate) {
    const startTs = Timestamp.fromDate(options.startDate);
    results = results.filter((r) => r.date.toMillis() >= startTs.toMillis());
  }
  if (options?.endDate) {
    const endTs = Timestamp.fromDate(options.endDate);
    results = results.filter((r) => r.date.toMillis() <= endTs.toMillis());
  }
  if (options?.category) {
    results = results.filter((r) => r.category === options.category);
  }

  return results;
}

/**
 * Create a new expense entry
 */
export async function createVehicleExpense(
  vehicleId: string,
  ownerId: string,
  input: VehicleExpenseCreateInput
): Promise<{ success: boolean; expenseId?: string; error?: string }> {
  try {
    const expenseCollection = collection(db, 'vehicles', vehicleId, 'expenses');
    const expenseRef = doc(expenseCollection);

    const now = Timestamp.now();
    // Build expense object without undefined values (Firestore doesn't accept undefined)
    const expense: Record<string, unknown> = {
      id: expenseRef.id,
      vehicle_id: vehicleId,
      owner_id: ownerId,
      category: input.category,
      amount: input.amount,
      description: input.description,
      date: Timestamp.fromDate(new Date(input.date)),
      is_recurring: input.is_recurring ?? false,
      created_at: now,
      updated_at: now,
    };

    // Only add optional fields if they have values
    if (input.vendor) expense.vendor = input.vendor;
    if (input.notes) expense.notes = input.notes;
    if (input.receipt_url) expense.receipt_url = input.receipt_url;

    // Add recurrence pattern if recurring
    if (input.is_recurring && input.recurrence_pattern) {
      const recurrence: Record<string, unknown> = {
        frequency: input.recurrence_pattern.frequency,
        start_date: Timestamp.fromDate(new Date(input.recurrence_pattern.start_date)),
      };
      if (input.recurrence_pattern.end_date) {
        recurrence.end_date = Timestamp.fromDate(new Date(input.recurrence_pattern.end_date));
      }
      expense.recurrence_pattern = recurrence;
    }

    await setDoc(expenseRef, expense);

    return { success: true, expenseId: expenseRef.id };
  } catch (error) {
    console.error('[Firestore] Error creating expense:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Update an expense entry
 */
export async function updateVehicleExpense(
  vehicleId: string,
  expenseId: string,
  updates: VehicleExpenseUpdateInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const expenseRef = doc(db, 'vehicles', vehicleId, 'expenses', expenseId);

    // Build updates object without undefined values (Firestore doesn't accept undefined)
    const firestoreUpdates: Record<string, unknown> = {
      updated_at: serverTimestamp(),
    };

    // Only add fields that have defined values
    if (updates.category !== undefined) firestoreUpdates.category = updates.category;
    if (updates.amount !== undefined) firestoreUpdates.amount = updates.amount;
    if (updates.description !== undefined) firestoreUpdates.description = updates.description;
    if (updates.is_recurring !== undefined) firestoreUpdates.is_recurring = updates.is_recurring;
    if (updates.vendor !== undefined) firestoreUpdates.vendor = updates.vendor;
    if (updates.notes !== undefined) firestoreUpdates.notes = updates.notes;
    if (updates.receipt_url !== undefined) firestoreUpdates.receipt_url = updates.receipt_url;

    // Convert date string to Timestamp
    if (updates.date) {
      firestoreUpdates.date = Timestamp.fromDate(new Date(updates.date));
    }

    // Handle recurrence pattern
    if (updates.recurrence_pattern) {
      const recurrence: Record<string, unknown> = {
        frequency: updates.recurrence_pattern.frequency,
        start_date: Timestamp.fromDate(new Date(updates.recurrence_pattern.start_date)),
      };
      if (updates.recurrence_pattern.end_date) {
        recurrence.end_date = Timestamp.fromDate(new Date(updates.recurrence_pattern.end_date));
      }
      firestoreUpdates.recurrence_pattern = recurrence;
    }

    await updateDoc(expenseRef, firestoreUpdates);

    return { success: true };
  } catch (error) {
    console.error('[Firestore] Error updating expense:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Delete an expense entry
 */
export async function deleteVehicleExpense(
  vehicleId: string,
  expenseId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const expenseRef = doc(db, 'vehicles', vehicleId, 'expenses', expenseId);
    await deleteDoc(expenseRef);

    return { success: true };
  } catch (error) {
    console.error('[Firestore] Error deleting expense:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

// ============ P/L Summary ============

/**
 * Calculate P/L summary from income and expense data
 */
export function calculatePLSummary(
  vehicleId: string,
  income: FirestoreVehicleIncome[],
  expenses: FirestoreVehicleExpense[],
  startDate: Date,
  endDate: Date
): VehiclePLSummary {
  // Calculate totals
  const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  // Group income by type
  const incomeByType: Record<IncomeType, number> = {
    weekly_payment: 0,
    tip_share: 0,
    bonus: 0,
    other: 0,
  };
  income.forEach((i) => {
    incomeByType[i.type] += i.amount;
  });

  // Group expenses by category
  const expensesByCategory: Record<ExpenseCategory, number> = {
    fuel: 0,
    maintenance: 0,
    insurance_soat: 0,
    tecnomecanica: 0,
    taxes: 0,
    fines: 0,
    parking: 0,
    car_wash: 0,
    accessories: 0,
    other: 0,
  };
  expenses.forEach((e) => {
    expensesByCategory[e.category] += e.amount;
  });

  return {
    vehicle_id: vehicleId,
    period: {
      start_date: startDate,
      end_date: endDate,
    },
    total_income: totalIncome,
    total_expenses: totalExpenses,
    net_profit: netProfit,
    profit_margin: Math.round(profitMargin * 10) / 10,
    income_by_type: incomeByType,
    expenses_by_category: expensesByCategory,
    income_count: income.length,
    expense_count: expenses.length,
  };
}

// ============ Helper: Convert Firestore to App types ============

/**
 * Convert Firestore income to app type
 */
export function convertFirestoreIncome(
  income: FirestoreVehicleIncome
): import('../types/vehicle-finance.types').VehicleIncome {
  return {
    ...income,
    date: income.date.toDate(),
    created_at: income.created_at.toDate(),
    updated_at: income.updated_at.toDate(),
    recurrence_pattern: income.recurrence_pattern
      ? {
          frequency: income.recurrence_pattern.frequency,
          start_date: income.recurrence_pattern.start_date.toDate(),
          end_date: income.recurrence_pattern.end_date?.toDate(),
          next_occurrence: income.recurrence_pattern.next_occurrence?.toDate(),
        }
      : undefined,
  };
}

/**
 * Convert Firestore expense to app type
 */
export function convertFirestoreExpense(
  expense: FirestoreVehicleExpense
): import('../types/vehicle-finance.types').VehicleExpense {
  return {
    ...expense,
    date: expense.date.toDate(),
    created_at: expense.created_at.toDate(),
    updated_at: expense.updated_at.toDate(),
    recurrence_pattern: expense.recurrence_pattern
      ? {
          frequency: expense.recurrence_pattern.frequency,
          start_date: expense.recurrence_pattern.start_date.toDate(),
          end_date: expense.recurrence_pattern.end_date?.toDate(),
          next_occurrence: expense.recurrence_pattern.next_occurrence?.toDate(),
        }
      : undefined,
  };
}
