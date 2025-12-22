/**
 * Vehicle finance types for P/L tracking
 */

// ============ Enums ============

export type IncomeType = 'weekly_payment' | 'tip_share' | 'bonus' | 'other';

export type ExpenseCategory =
  | 'fuel'
  | 'maintenance'
  | 'insurance_soat'
  | 'tecnomecanica'
  | 'taxes'
  | 'fines'
  | 'parking'
  | 'car_wash'
  | 'accessories'
  | 'other';

export type RecurrenceFrequency = 'weekly' | 'biweekly' | 'monthly';

// ============ Interfaces ============

export interface RecurrencePattern {
  frequency: RecurrenceFrequency;
  start_date: Date;
  end_date?: Date;
  next_occurrence?: Date;
}

export interface VehicleIncome {
  id: string;
  vehicle_id: string;
  owner_id: string;
  type: string; // Dynamic - loaded from finance_categories collection
  amount: number;
  description: string;
  date: Date;
  is_recurring: boolean;
  recurrence_pattern?: RecurrencePattern;
  recurring_parent_id?: string;
  driver_id?: string;
  driver_name?: string;
  created_at: Date;
  updated_at: Date;
  notes?: string;
}

export interface VehicleExpense {
  id: string;
  vehicle_id: string;
  owner_id: string;
  category: string; // Dynamic - loaded from finance_categories collection
  amount: number;
  description: string;
  date: Date;
  is_recurring: boolean;
  recurrence_pattern?: RecurrencePattern;
  recurring_parent_id?: string;
  receipt_url?: string;
  vendor?: string;
  created_at: Date;
  updated_at: Date;
  notes?: string;
}

// ============ Input Types ============

export interface VehicleIncomeCreateInput {
  type: string; // Dynamic - loaded from finance_categories collection
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD
  is_recurring?: boolean;
  recurrence_pattern?: {
    frequency: RecurrenceFrequency;
    start_date: string;
    end_date?: string;
  };
  driver_id?: string;
  driver_name?: string;
  notes?: string;
}

export interface VehicleIncomeUpdateInput extends Partial<VehicleIncomeCreateInput> {}

export interface VehicleExpenseCreateInput {
  category: string; // Dynamic - loaded from finance_categories collection
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD
  is_recurring?: boolean;
  recurrence_pattern?: {
    frequency: RecurrenceFrequency;
    start_date: string;
    end_date?: string;
  };
  vendor?: string;
  receipt_file?: File;
  receipt_url?: string;
  notes?: string;
}

export interface VehicleExpenseUpdateInput extends Partial<VehicleExpenseCreateInput> {
  receipt_url?: string;
}

// ============ Summary Types ============

export interface VehiclePLSummary {
  vehicle_id: string;
  period: {
    start_date: Date;
    end_date: Date;
  };
  total_income: number;
  total_expenses: number;
  net_profit: number;
  profit_margin: number;
  income_by_type: Record<string, number>; // Dynamic keys from finance_categories
  expenses_by_category: Record<string, number>; // Dynamic keys from finance_categories
  income_count: number;
  expense_count: number;
}

// ============ UI Labels (Spanish) ============

export const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  weekly_payment: 'Pago Semanal',
  tip_share: 'Propinas',
  bonus: 'Bonificación',
  other: 'Otros',
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  fuel: 'Combustible',
  maintenance: 'Mantenimiento',
  insurance_soat: 'SOAT',
  tecnomecanica: 'Tecnomecánica',
  taxes: 'Impuestos',
  fines: 'Multas',
  parking: 'Parqueadero',
  car_wash: 'Lavado',
  accessories: 'Accesorios',
  other: 'Otros',
};

export const RECURRENCE_LABELS: Record<RecurrenceFrequency, string> = {
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
};
