/**
 * Insights Types for Cloud Functions
 *
 * Period-agnostic types supporting daily, weekly, bi-weekly, and monthly insights.
 * These types replace the separate daily and weekly insights types.
 */

import type { Timestamp } from 'firebase-admin/firestore';

// ============ Period Types ============

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

// ============ Insight Types ============

/**
 * Insight priority levels for UI display
 */
export type InsightPriority = 'high' | 'medium' | 'low';

/**
 * Insight categories for filtering and icons
 */
export type InsightType =
  | 'revenue_trend'
  | 'ride_volume'
  | 'cancellation_alert'
  | 'efficiency'
  | 'vehicle_performance'
  | 'growth_opportunity'
  | 'anomaly_alert'
  | 'performance_comparison'
  | 'action_recommendation'
  | 'trend_analysis'
  | 'general';

/**
 * Single AI-generated insight
 */
export interface Insight {
  id: string;
  priority: InsightPriority;
  type?: InsightType;
  title: string;
  description: string;
  metric_reference?: string;
  value_change?: number;
}

// ============ Metrics Types ============

/**
 * Source breakdown for rides (InDriver vs External)
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
 * Rides metrics section
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
 * Cancellations metrics section
 */
export interface CancellationsMetrics {
  total: number;
  rate: number; // percentage of total rides
  by_reason: {
    by_passenger: number;
    by_driver: number;
  };
  change_vs_previous: number | null;
}

/**
 * Kilometers metrics section
 */
export interface KilometersMetrics {
  total_km: number;
  average_per_ride: number;
  revenue_per_km: number;
}

/**
 * Top expense category for a vehicle
 */
export interface TopExpenseCategory {
  category: string; // 'fuel', 'car_wash', etc.
  label: string; // Spanish label: 'Combustible', 'Lavado'
  amount: number;
}

/**
 * Vehicle finance summary for the period
 */
export interface VehicleFinanceMetrics {
  vehicle_id: string;
  vehicle_plate: string;
  vehicle_name: string; // e.g., "Kia Picanto 2022"
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
 * Unified metrics structure for all period types
 */
export interface InsightsMetrics {
  rides: RidesMetrics;
  cancellations: CancellationsMetrics;
  kilometers: KilometersMetrics;
  vehicle_finances?: VehicleFinanceMetrics[]; // Optional for daily, included for weekly+
}

// ============ Document Types ============

/**
 * Complete insights document stored in Firestore
 * Collection: /insights/{period_type}_{period_id}
 * e.g., "daily_2026-01-15", "weekly_2026-W02", "biweekly_2026-BW02", "monthly_2026-01"
 */
export interface InsightsDocument {
  // Identity
  id: string; // Same as document ID
  period_type: PeriodType;
  period_id: string; // "2026-01-15", "2026-W02", etc.

  // Period bounds
  period_start: Timestamp;
  period_end: Timestamp;

  // Metrics and insights
  metrics: InsightsMetrics;
  insights: Insight[];

  // Metadata
  generated_at: Timestamp;
  generated_by: string;
  generation_duration_ms?: number;
}

/**
 * Firestore document format for reading (with Timestamps)
 */
export interface FirestoreInsightsDocument {
  period_type: PeriodType;
  period_id: string;
  period_start: Timestamp;
  period_end: Timestamp;
  metrics: InsightsMetrics;
  insights: Insight[];
  generated_at: Timestamp;
  generated_by: string;
  generation_duration_ms?: number;
}

// ============ Claude API Types ============

/**
 * Claude API response for insights generation
 */
export interface ClaudeInsightsResponse {
  insights: Array<{
    priority: InsightPriority;
    type?: InsightType;
    title: string;
    description: string;
    metric_reference?: string;
    value_change?: number;
  }>;
}

// ============ Generation Options ============

/**
 * Options for generating insights
 */
export interface GenerateInsightsOptions {
  periodType: PeriodType;
  periodRange: PeriodRange;
  includeVehicleFinances?: boolean; // Default: true for weekly+, false for daily
  createNotification?: boolean; // Default: true for weekly+
}

/**
 * Result of insights generation
 */
export interface GenerateInsightsResult {
  success: boolean;
  documentId: string;
  periodType: PeriodType;
  periodId: string;
  ridesCount: number;
  vehiclesCount: number;
  insightsCount: number;
  durationMs: number;
}

// ============ Aggregation Types ============

/**
 * Ride data structure for aggregation (with distance)
 */
export interface RideForAggregation {
  id: string;
  driver_id: string;
  vehicle_id?: string;
  date: Timestamp | null;
  time: string;
  status: string;
  cancellation_reason?: string;
  category: string;
  total_received: number;
  service_commission: number;
  total_paid: number;
  distance_value?: number | null;
  distance_unit?: string | null;
}

/**
 * Vehicle expense for aggregation
 */
export interface VehicleExpenseForAggregation {
  id: string;
  vehicle_id: string;
  category: string;
  amount: number;
  date: Timestamp;
}

/**
 * Vehicle income for aggregation
 */
export interface VehicleIncomeForAggregation {
  id: string;
  vehicle_id: string;
  type: string;
  amount: number;
  date: Timestamp;
}

/**
 * Vehicle data for display
 */
export interface VehicleForDisplay {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
}

// ============ Constants ============

/**
 * Expense category labels (Spanish)
 */
export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
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
 * Format document ID for the unified insights collection
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

