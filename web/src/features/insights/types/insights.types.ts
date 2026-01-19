/**
 * Proactive Insights Types for Frontend
 *
 * Defines types for daily AI-generated business insights
 */

/**
 * Insight priority levels for UI display
 */
export type InsightPriority = 'high' | 'medium' | 'low';

/**
 * Insight categories for filtering and icons
 */
export type InsightType =
  | 'growth_opportunity'
  | 'anomaly_alert'
  | 'performance_comparison'
  | 'action_recommendation'
  | 'trend_analysis';

/**
 * Single AI-generated insight
 */
export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  priority: InsightPriority;
  metric_reference?: string;
  value_change?: number;
}

/**
 * Source breakdown for the day
 */
export interface InsightSourceBreakdown {
  indriver: {
    count: number;
    revenue: number;
    percentage: number;
  };
  external: {
    count: number;
    revenue: number;
    percentage: number;
  };
}

/**
 * Daily aggregated metrics stored with insights
 */
export interface DailyMetrics {
  total_rides: number;
  completed_rides: number;
  total_revenue: number;
  total_commissions: number;
  average_per_ride: number;
  source_breakdown: InsightSourceBreakdown;
  rides_change_percent: number | null;
  revenue_change_percent: number | null;
}

/**
 * Complete daily insights document
 */
export interface DailyInsights {
  id: string;
  date: Date;
  metrics: DailyMetrics;
  insights: Insight[];
  generated_at: Date;
  generated_by: string;
  generation_duration_ms?: number;
}

/**
 * Hook return type
 */
export interface UseInsightsDataReturn {
  insights: DailyInsights | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// ============ Weekly Insights Types ============

/**
 * Weekly insight (simpler than daily - just priority based)
 */
export interface WeeklyInsight {
  id: string;
  priority: InsightPriority;
  title: string;
  description: string;
  metric_reference?: string;
  value_change?: number;
}

/**
 * Source breakdown for rides (weekly)
 */
export interface WeeklySourceBreakdown {
  indriver: {
    count: number;
    revenue: number;
    percentage: number;
  };
  external: {
    count: number;
    revenue: number;
    percentage: number;
  };
}

/**
 * Rides section of weekly summary
 */
export interface WeeklyRidesData {
  total: number;
  completed: number;
  total_revenue: number;
  average_per_ride: number;
  change_vs_previous_week: number | null;
  by_source: WeeklySourceBreakdown;
}

/**
 * Cancellations section of weekly summary
 */
export interface WeeklyCancellationsData {
  total: number;
  rate: number;
  by_reason: {
    by_passenger: number;
    by_driver: number;
  };
  change_vs_previous_week: number | null;
}

/**
 * Kilometers section of weekly summary
 */
export interface WeeklyKilometersData {
  total_km: number;
  average_per_ride: number;
  revenue_per_km: number;
}

/**
 * Top expense category for a vehicle
 */
export interface TopExpenseCategory {
  category: string;
  label: string;
  amount: number;
}

/**
 * Vehicle finance summary for the week
 */
export interface WeeklyVehicleFinance {
  vehicle_id: string;
  vehicle_plate: string;
  vehicle_name: string;
  rides_count: number;
  total_km: number;
  total_income: number;
  expenses: {
    total: number;
    top_categories: TopExpenseCategory[];
  };
  net_profit: number;
  cost_per_km: number;
}

/**
 * Complete weekly insights document
 */
export interface WeeklyInsights {
  id: string; // week_id e.g., "2026-W02"
  week_id: string;
  week_start: Date;
  week_end: Date;
  rides: WeeklyRidesData;
  cancellations: WeeklyCancellationsData;
  kilometers: WeeklyKilometersData;
  vehicle_finances: WeeklyVehicleFinance[];
  insights: WeeklyInsight[];
  generated_at: Date;
  generated_by: string;
  generation_duration_ms?: number;
}

/**
 * Weekly insights hook return type
 */
export interface UseWeeklyInsightsReturn {
  insights: WeeklyInsights | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  triggerGeneration: () => Promise<void>;
  isGenerating: boolean;
}

// ============ Period-Agnostic Types ============

/**
 * Supported insight period types
 */
export type PeriodType = 'daily' | 'weekly' | 'biweekly' | 'monthly';

/**
 * Period range with start/end dates and identification
 */
export interface PeriodRange {
  type: PeriodType;
  id: string; // e.g., "2026-01-15", "2026-W02", "2026-BW02", "2026-01"
  start: Date;
  end: Date;
  displayLabel: string; // Spanish label, e.g., "5-11 ene 2026"
}

/**
 * Extended insight type for period-agnostic insights
 */
export type ExtendedInsightType =
  | InsightType
  | 'revenue_trend'
  | 'ride_volume'
  | 'cancellation_alert'
  | 'efficiency'
  | 'vehicle_performance'
  | 'general';

/**
 * Period insight structure (period-agnostic)
 */
export interface PeriodInsight {
  id: string;
  priority: InsightPriority;
  type?: ExtendedInsightType;
  title: string;
  description: string;
  metric_reference?: string;
  value_change?: number;
}

/**
 * Source breakdown for period insights
 */
export interface SourceBreakdown {
  indriver: {
    count: number;
    revenue: number;
    percentage: number;
  };
  external: {
    count: number;
    revenue: number;
    percentage: number;
  };
}

/**
 * Unified rides metrics
 */
export interface RidesMetrics {
  total: number;
  completed: number;
  total_revenue: number;
  average_per_ride: number;
  change_vs_previous: number | null;
  by_source: SourceBreakdown;
}

/**
 * Unified cancellations metrics
 */
export interface CancellationsMetrics {
  total: number;
  rate: number;
  by_reason: {
    by_passenger: number;
    by_driver: number;
  };
  change_vs_previous: number | null;
}

/**
 * Unified kilometers metrics
 */
export interface KilometersMetrics {
  total_km: number;
  average_per_ride: number;
  revenue_per_km: number;
}

/**
 * Unified vehicle finance metrics
 */
export interface VehicleFinanceMetrics {
  vehicle_id: string;
  vehicle_plate: string;
  vehicle_name: string;
  rides_count: number;
  total_km: number;
  total_income: number;
  expenses: {
    total: number;
    top_categories: TopExpenseCategory[];
  };
  net_profit: number;
  cost_per_km: number;
}

/**
 * Unified insights metrics structure
 */
export interface InsightsMetrics {
  rides: RidesMetrics;
  cancellations: CancellationsMetrics;
  kilometers: KilometersMetrics;
  vehicle_finances?: VehicleFinanceMetrics[];
}

/**
 * Period insights document (period-agnostic)
 */
export interface PeriodInsights {
  id: string;
  period_type: PeriodType;
  period_id: string;
  period_start: Date;
  period_end: Date;
  metrics: InsightsMetrics;
  insights: PeriodInsight[];
  generated_at: Date;
  generated_by: string;
  generation_duration_ms?: number;
}

/**
 * Period insights hook return type
 */
export interface UsePeriodInsightsReturn {
  insights: PeriodInsights | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  triggerGeneration: () => Promise<void>;
  isGenerating: boolean;
}

/**
 * Period type labels (Spanish)
 */
export const PERIOD_TYPE_LABELS: Record<PeriodType, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
};

/**
 * Format document ID for the insights collection
 */
export function formatInsightsDocumentId(periodType: PeriodType, periodId: string): string {
  return `${periodType}_${periodId}`;
}

/**
 * Parse document ID to extract period type and period ID
 */
export function parseInsightsDocumentId(
  documentId: string
): { periodType: PeriodType; periodId: string } | null {
  const match = documentId.match(/^(daily|weekly|biweekly|monthly)_(.+)$/);
  if (!match) return null;
  return {
    periodType: match[1] as PeriodType,
    periodId: match[2],
  };
}
