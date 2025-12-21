/**
 * Reporting Dashboard Types
 *
 * Type definitions for the reporting feature including goals,
 * aggregations, and chart data structures.
 */

import type { Timestamp } from 'firebase/firestore';

// ============================================================================
// GOAL TYPES
// ============================================================================

export type GoalTargetType =
  | 'rides_per_week'
  | 'rides_per_month'
  | 'revenue_per_week'
  | 'revenue_per_month';

export interface ReportingGoal {
  id: string;
  owner_id: string;
  target_type: GoalTargetType;
  target_value: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ReportingGoalInput {
  target_type: GoalTargetType;
  target_value: number;
}

// ============================================================================
// DATE FILTER TYPES
// ============================================================================

export type ReportingDateFilterOption =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'thisMonth'
  | 'lastMonth'
  | 'custom';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// ============================================================================
// AGGREGATION TYPES
// ============================================================================

export interface SourceBreakdown {
  indriver: {
    count: number;
    revenue: number;
  };
  external: {
    count: number;
    revenue: number;
  };
}

// Vehicle finance breakdowns
export interface IncomeByTypeBreakdown {
  weekly_payment: number;
  tip_share: number;
  bonus: number;
  other: number;
}

export interface ExpensesByCategoryBreakdown {
  fuel: number;
  maintenance: number;
  insurance_soat: number;
  tecnomecanica: number;
  taxes: number;
  fines: number;
  parking: number;
  car_wash: number;
  accessories: number;
  other: number;
}

export interface DailyTrend {
  date: string; // YYYY-MM-DD format
  totalRides: number;
  indriverRides: number;
  externalRides: number;
  totalRevenue: number;
  indriverRevenue: number;
  externalRevenue: number;
}

export interface DriverEfficiency {
  driverId: string;
  driverName: string;
  rideCount: number;
  revenue: number;
  avgPerRide: number;
  completionRate: number;
}

export interface VehicleEfficiency {
  vehicleId: string;
  plate: string;
  rideCount: number;
  revenue: number;
  activeDays: number;
  totalDays: number;
  utilizationPercent: number;
}

export interface CancellationBreakdown {
  byPassenger: number;
  byDriver: number;
  totalCancelled: number;
  totalRides: number;
  cancellationRate: number;
}

export interface PaymentMethodBreakdown {
  cash: number;
  nequi: number;
  daviplata: number;
  bancolombia: number;
  other: number;
}

// Peak hours: 7 days (0=Sunday to 6=Saturday) x 24 hours
export type PeakHoursMatrix = number[][];

export interface ReportingAggregations {
  // Summary metrics (from rides)
  totalRides: number;
  completedRides: number;
  totalRevenue: number; // Platform-reported revenue from rides (total_received)
  totalPaid: number; // Total paid by passengers (total_paid)
  totalCommissions: number;
  averagePerRide: number;
  averageRidesPerDay: number; // Average rides per day in the period

  // Vehicle finance metrics (from /finances)
  totalVehicleIncome: number; // Actual income received
  totalVehicleExpenses: number;
  netProfit: number;

  // Vehicle finance breakdown for charts
  incomeByType: IncomeByTypeBreakdown;
  expensesByCategory: ExpensesByCategoryBreakdown;

  // Source breakdown
  bySource: SourceBreakdown;

  // Trend data
  dailyTrends: DailyTrend[];

  // Efficiency tables
  byDriver: DriverEfficiency[];
  byVehicle: VehicleEfficiency[];

  // Cancellation breakdown
  cancellations: CancellationBreakdown;

  // Peak hours matrix [dayOfWeek][hour]
  peakHours: PeakHoursMatrix;

  // Payment methods
  byPaymentMethod: PaymentMethodBreakdown;
}

// ============================================================================
// CHART DATA TYPES (for Recharts)
// ============================================================================

export interface SourceChartData {
  name: string;
  value: number;
  revenue: number;
  color: string;
}

export interface TrendChartData {
  date: string;
  displayDate: string;
  total: number;
  indriver: number;
  external: number;
}

export interface PaymentChartData {
  name: string;
  value: number;
  color: string;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

export interface UseReportingDataOptions {
  startDate: Date;
  endDate: Date;
}

export interface UseReportingDataReturn {
  aggregations: ReportingAggregations | null;
  isLoading: boolean;
  error: string | null;
  isRealtime: boolean;
  refetch: () => void;
}

export interface UseReportingGoalsReturn {
  goals: ReportingGoal[];
  activeGoal: ReportingGoal | null;
  isLoading: boolean;
  error: string | null;
  createGoal: (input: ReportingGoalInput) => Promise<{ success: boolean; error?: string }>;
  updateGoal: (
    goalId: string,
    input: Partial<ReportingGoalInput>
  ) => Promise<{ success: boolean; error?: string }>;
  deleteGoal: (goalId: string) => Promise<{ success: boolean; error?: string }>;
  refetch: () => Promise<void>;
}
