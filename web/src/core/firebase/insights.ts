/**
 * Firestore daily insights service
 *
 * Insights are stored in a top-level collection:
 * - daily_insights/{dateId} where dateId is YYYY-MM-DD
 *
 * Admin-only read access. Written by Cloud Functions only.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from './firestore';
import { firebaseApp } from './config';
import type {
  DailyInsights,
  DailyMetrics,
  Insight,
  WeeklyInsights,
  PeriodType,
  PeriodInsights,
  InsightsMetrics,
  PeriodInsight,
} from '@/features/insights/types/insights.types';

// Initialize Firebase Functions
const functions = getFunctions(firebaseApp);

// ============ Firestore Types ============

export interface FirestoreDailyInsights {
  date: Timestamp;
  metrics: DailyMetrics;
  insights: Insight[];
  generated_at: Timestamp;
  generated_by: string;
  generation_duration_ms?: number;
}

// ============ Helper Functions ============

/**
 * Format date as YYYY-MM-DD for document ID
 */
export function formatDateId(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Convert Firestore document to DailyInsights
 */
function toAppInsights(docId: string, data: FirestoreDailyInsights): DailyInsights {
  return {
    id: docId,
    date: data.date.toDate(),
    metrics: data.metrics,
    insights: data.insights,
    generated_at: data.generated_at.toDate(),
    generated_by: data.generated_by,
    generation_duration_ms: data.generation_duration_ms,
  };
}

// ============ Read Operations ============

/**
 * Get insights for a specific date
 *
 * @param date - The date to get insights for
 * @returns DailyInsights or null if not found
 */
export async function getDailyInsights(date: Date): Promise<DailyInsights | null> {
  const dateId = formatDateId(date);
  const docRef = doc(db, 'daily_insights', dateId);

  try {
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return toAppInsights(docSnap.id, docSnap.data() as FirestoreDailyInsights);
  } catch (error) {
    console.error('[insights] Error fetching insights for', dateId, error);
    throw error;
  }
}

/**
 * Get insights by document ID (YYYY-MM-DD)
 *
 * @param dateId - The date ID in YYYY-MM-DD format
 * @returns DailyInsights or null if not found
 */
export async function getDailyInsightsById(dateId: string): Promise<DailyInsights | null> {
  const docRef = doc(db, 'daily_insights', dateId);

  try {
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return toAppInsights(docSnap.id, docSnap.data() as FirestoreDailyInsights);
  } catch (error) {
    console.error('[insights] Error fetching insights for', dateId, error);
    throw error;
  }
}

/**
 * Get the most recent insights
 *
 * @param count - Number of recent insights to fetch (default: 7)
 * @returns Array of DailyInsights sorted by date descending
 */
export async function getRecentInsights(count: number = 7): Promise<DailyInsights[]> {
  const insightsCollection = collection(db, 'daily_insights');
  const q = query(insightsCollection, orderBy('date', 'desc'), limit(count));

  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => toAppInsights(doc.id, doc.data() as FirestoreDailyInsights));
  } catch (error) {
    console.error('[insights] Error fetching recent insights:', error);
    throw error;
  }
}

/**
 * Check if insights exist for a specific date
 *
 * @param date - The date to check
 * @returns true if insights exist, false otherwise
 */
export async function hasInsightsForDate(date: Date): Promise<boolean> {
  const dateId = formatDateId(date);
  const docRef = doc(db, 'daily_insights', dateId);

  try {
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error('[insights] Error checking insights for', dateId, error);
    return false;
  }
}

// ============ Cloud Function Calls ============

interface GenerateInsightsResponse {
  success: boolean;
  dateId: string;
  metricsGenerated: boolean;
  insightsCount: number;
  durationMs: number;
}

/**
 * Trigger the Cloud Function to generate insights for a specific date
 *
 * @param date - The date to generate insights for
 * @returns Result from the Cloud Function
 */
export async function triggerGenerateInsights(date: Date): Promise<GenerateInsightsResponse> {
  const dateString = formatDateId(date);
  const generateFn = httpsCallable<{ dateString: string }, GenerateInsightsResponse>(
    functions,
    'generateInsightsForDate'
  );

  try {
    console.log('[insights] Triggering insight generation for', dateString);
    const result = await generateFn({ dateString });
    console.log('[insights] Generation complete:', result.data);
    return result.data;
  } catch (error) {
    console.error('[insights] Error generating insights for', dateString, error);
    throw error;
  }
}

// ============ Weekly Insights ============

/**
 * Format week ID from year and week number
 */
export function formatWeekId(year: number, week: number): string {
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/**
 * Convert period-agnostic insights to WeeklyInsights format
 */
function periodInsightsToWeeklyInsights(
  docId: string,
  data: FirestorePeriodInsights
): WeeklyInsights {
  return {
    id: docId,
    week_id: data.period_id,
    week_start: data.period_start.toDate(),
    week_end: data.period_end.toDate(),
    rides: {
      total: data.metrics.rides.total,
      completed: data.metrics.rides.completed,
      total_revenue: data.metrics.rides.total_revenue,
      average_per_ride: data.metrics.rides.average_per_ride,
      change_vs_previous_week: data.metrics.rides.change_vs_previous,
      by_source: data.metrics.rides.by_source,
    },
    cancellations: {
      total: data.metrics.cancellations.total,
      rate: data.metrics.cancellations.rate,
      by_reason: data.metrics.cancellations.by_reason,
      change_vs_previous_week: data.metrics.cancellations.change_vs_previous,
    },
    kilometers: data.metrics.kilometers,
    vehicle_finances: data.metrics.vehicle_finances || [],
    insights: data.insights.map((insight) => ({
      id: insight.id,
      priority: insight.priority,
      type: insight.type,
      title: insight.title,
      description: insight.description,
      metric_reference: insight.metric_reference,
      value_change: insight.value_change,
    })),
    generated_at: data.generated_at.toDate(),
    generated_by: data.generated_by,
    generation_duration_ms: data.generation_duration_ms,
  };
}

/**
 * Get weekly insights for a specific week
 *
 * Reads from the unified `insights` collection with document ID format: weekly_{weekId}
 *
 * @param year - The year
 * @param week - The week number (1-53)
 * @returns WeeklyInsights or null if not found
 */
export async function getWeeklyInsights(
  year: number,
  week: number
): Promise<WeeklyInsights | null> {
  const weekId = formatWeekId(year, week);
  const docId = `weekly_${weekId}`;
  const docRef = doc(db, 'insights', docId);

  try {
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return periodInsightsToWeeklyInsights(docSnap.id, docSnap.data() as FirestorePeriodInsights);
  } catch (error) {
    console.error('[insights] Error fetching weekly insights for', weekId, error);
    throw error;
  }
}

/**
 * Get weekly insights by week ID
 *
 * Reads from the unified `insights` collection with document ID format: weekly_{weekId}
 *
 * @param weekId - The week ID in YYYY-Www format (e.g., "2026-W02")
 * @returns WeeklyInsights or null if not found
 */
export async function getWeeklyInsightsById(weekId: string): Promise<WeeklyInsights | null> {
  // Parse year and week from weekId format "YYYY-Www"
  const match = weekId.match(/^(\d{4})-W(\d{2})$/);
  if (!match) {
    console.error('[insights] Invalid weekId format:', weekId);
    return null;
  }
  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);
  return getWeeklyInsights(year, week);
}

/**
 * Get the most recent weekly insights
 *
 * Reads from the unified `insights` collection and filters by period_type='weekly'
 *
 * @param count - Number of recent weeks to fetch (default: 4)
 * @returns Array of WeeklyInsights sorted by week descending
 */
export async function getRecentWeeklyInsights(count: number = 4): Promise<WeeklyInsights[]> {
  const insightsCollection = collection(db, 'insights');
  // Fetch more since we filter by period_type
  const q = query(insightsCollection, orderBy('period_start', 'desc'), limit(count * 4));

  try {
    const snapshot = await getDocs(q);
    const results: WeeklyInsights[] = [];

    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data() as FirestorePeriodInsights;
      if (data.period_type === 'weekly') {
        results.push(periodInsightsToWeeklyInsights(docSnapshot.id, data));
        if (results.length >= count) break;
      }
    }

    return results;
  } catch (error) {
    console.error('[insights] Error fetching recent weekly insights:', error);
    throw error;
  }
}

/**
 * Check if weekly insights exist for a specific week
 *
 * Checks the unified `insights` collection with document ID format: weekly_{weekId}
 *
 * @param year - The year
 * @param week - The week number
 * @returns true if insights exist, false otherwise
 */
export async function hasWeeklyInsights(year: number, week: number): Promise<boolean> {
  const weekId = formatWeekId(year, week);
  const docId = `weekly_${weekId}`;
  const docRef = doc(db, 'insights', docId);

  try {
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error('[insights] Error checking weekly insights for', weekId, error);
    return false;
  }
}

// ============ Weekly Cloud Function Calls ============

interface GenerateWeeklyInsightsResponse {
  success: boolean;
  weekId: string;
  ridesCount: number;
  vehiclesCount: number;
  insightsCount: number;
  durationMs: number;
}

interface GeneratePeriodInsightsResponse {
  success: boolean;
  documentId: string;
  periodType: PeriodType;
  periodId: string;
  ridesCount: number;
  vehiclesCount: number;
  insightsCount: number;
  durationMs: number;
}

/**
 * Trigger the Cloud Function to generate weekly insights for a specific week
 *
 * @param year - The year
 * @param week - The week number
 * @returns Result from the Cloud Function
 */
export async function triggerGenerateWeeklyInsights(
  year: number,
  week: number
): Promise<GenerateWeeklyInsightsResponse> {
  const weekId = formatWeekId(year, week);
  const generateFn = httpsCallable<
    { periodType: PeriodType; periodId: string },
    GeneratePeriodInsightsResponse
  >(functions, 'generateInsightsForPeriod');

  try {
    console.log('[insights] Triggering weekly insight generation for', weekId);
    const result = await generateFn({ periodType: 'weekly', periodId: weekId });
    console.log('[insights] Weekly generation complete:', result.data);
    // Map the response to the expected format
    return {
      success: result.data.success,
      weekId: result.data.periodId,
      ridesCount: result.data.ridesCount,
      vehiclesCount: result.data.vehiclesCount,
      insightsCount: result.data.insightsCount,
      durationMs: result.data.durationMs,
    };
  } catch (error) {
    console.error('[insights] Error generating weekly insights for', weekId, error);
    throw error;
  }
}

// ============ Weekly Insights History ============

/**
 * Summary of weekly insights for history sidebar
 */
export interface WeeklyInsightsSummary {
  weekId: string;
  weekStart: Date;
  weekEnd: Date;
  totalRides: number;
  totalRevenue: number;
  generatedAt: Date;
}

/**
 * Result of paginated weekly insights list
 */
export interface WeeklyInsightsListResult {
  summaries: WeeklyInsightsSummary[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

/**
 * Get paginated list of weekly insights summaries for history sidebar
 *
 * Reads from the unified `insights` collection and filters by period_type='weekly'
 *
 * @param pageSize - Number of items per page (default: 10)
 * @param lastDocument - Last document from previous page for pagination
 * @returns Paginated list of summaries
 */
export async function getWeeklyInsightsList(
  pageSize: number = 10,
  lastDocument?: QueryDocumentSnapshot<DocumentData> | null
): Promise<WeeklyInsightsListResult> {
  const insightsCollection = collection(db, 'insights');

  // Build query with optional pagination - fetch more since we filter by period_type
  let q = query(insightsCollection, orderBy('period_start', 'desc'), limit(pageSize * 4 + 1));

  if (lastDocument) {
    q = query(
      insightsCollection,
      orderBy('period_start', 'desc'),
      startAfter(lastDocument),
      limit(pageSize * 4 + 1)
    );
  }

  try {
    const snapshot = await getDocs(q);
    const docs = snapshot.docs;

    // Filter by period_type='weekly' and collect summaries
    const summaries: WeeklyInsightsSummary[] = [];
    let lastProcessedDoc: QueryDocumentSnapshot<DocumentData> | null = null;

    for (const docSnapshot of docs) {
      const data = docSnapshot.data() as FirestorePeriodInsights;
      if (data.period_type === 'weekly') {
        summaries.push({
          weekId: data.period_id,
          weekStart: data.period_start.toDate(),
          weekEnd: data.period_end.toDate(),
          totalRides: data.metrics?.rides?.completed ?? 0,
          totalRevenue: data.metrics?.rides?.total_revenue ?? 0,
          generatedAt: data.generated_at.toDate(),
        });

        if (summaries.length >= pageSize) {
          lastProcessedDoc = docSnapshot;
          break;
        }
      }
      lastProcessedDoc = docSnapshot;
    }

    // Check if there are more items
    const hasMore = summaries.length >= pageSize && docs.length > summaries.length;
    const itemSummaries = summaries.slice(0, pageSize);

    return {
      summaries: itemSummaries,
      lastDoc: hasMore ? lastProcessedDoc : null,
      hasMore,
    };
  } catch (error) {
    console.error('[insights] Error fetching weekly insights list:', error);
    throw error;
  }
}

// ============ Period Insights (Period-Agnostic) ============

/**
 * Firestore document format for period insights
 */
export interface FirestorePeriodInsights {
  period_type: PeriodType;
  period_id: string;
  period_start: Timestamp;
  period_end: Timestamp;
  metrics: InsightsMetrics;
  insights: PeriodInsight[];
  generated_at: Timestamp;
  generated_by: string;
  generation_duration_ms?: number;
}

/**
 * Convert Firestore document to PeriodInsights
 */
function toAppPeriodInsights(docId: string, data: FirestorePeriodInsights): PeriodInsights {
  return {
    id: docId,
    period_type: data.period_type,
    period_id: data.period_id,
    period_start: data.period_start.toDate(),
    period_end: data.period_end.toDate(),
    metrics: data.metrics,
    insights: data.insights,
    generated_at: data.generated_at.toDate(),
    generated_by: data.generated_by,
    generation_duration_ms: data.generation_duration_ms,
  };
}

/**
 * Format document ID for insights collection
 */
export function formatInsightsDocId(periodType: PeriodType, periodId: string): string {
  return `${periodType}_${periodId}`;
}

/**
 * Get insights by period type and period ID
 *
 * @param periodType - The period type (daily, weekly, biweekly, monthly)
 * @param periodId - The period ID in appropriate format
 * @returns PeriodInsights or null if not found
 */
export async function getInsights(
  periodType: PeriodType,
  periodId: string
): Promise<PeriodInsights | null> {
  const docId = formatInsightsDocId(periodType, periodId);
  const docRef = doc(db, 'insights', docId);

  try {
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return toAppPeriodInsights(docSnap.id, docSnap.data() as FirestorePeriodInsights);
  } catch (error) {
    console.error('[insights] Error fetching insights for', docId, error);
    throw error;
  }
}

/**
 * Get insights by document ID
 *
 * @param docId - The document ID (e.g., "weekly_2026-W02")
 * @returns PeriodInsights or null if not found
 */
export async function getInsightsById(docId: string): Promise<PeriodInsights | null> {
  const docRef = doc(db, 'insights', docId);

  try {
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return toAppPeriodInsights(docSnap.id, docSnap.data() as FirestorePeriodInsights);
  } catch (error) {
    console.error('[insights] Error fetching insights for', docId, error);
    throw error;
  }
}

/**
 * Get recent insights by period type
 *
 * @param periodType - The period type to filter by
 * @param count - Number of recent insights to fetch (default: 10)
 * @returns Array of PeriodInsights sorted by period start descending
 */
export async function getRecentPeriodInsights(
  periodType: PeriodType,
  count: number = 10
): Promise<PeriodInsights[]> {
  const insightsCollection = collection(db, 'insights');
  const q = query(
    insightsCollection,
    orderBy('period_start', 'desc'),
    limit(count * 4) // Fetch more since we filter by period_type
  );

  try {
    const snapshot = await getDocs(q);
    const results: PeriodInsights[] = [];

    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data() as FirestorePeriodInsights;
      if (data.period_type === periodType) {
        results.push(toAppPeriodInsights(docSnapshot.id, data));
        if (results.length >= count) break;
      }
    }

    return results;
  } catch (error) {
    console.error('[insights] Error fetching recent insights:', error);
    throw error;
  }
}

/**
 * Check if insights exist for a specific period
 *
 * @param periodType - The period type
 * @param periodId - The period ID
 * @returns true if insights exist, false otherwise
 */
export async function hasPeriodInsights(
  periodType: PeriodType,
  periodId: string
): Promise<boolean> {
  const docId = formatInsightsDocId(periodType, periodId);
  const docRef = doc(db, 'insights', docId);

  try {
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error('[insights] Error checking insights for', docId, error);
    return false;
  }
}

// ============ Period Cloud Function Calls ============

/**
 * Trigger the Cloud Function to generate insights for any period
 *
 * @param periodType - The period type (daily, weekly, biweekly, monthly)
 * @param periodId - The period ID in appropriate format
 * @returns Result from the Cloud Function
 */
export async function triggerGeneratePeriodInsights(
  periodType: PeriodType,
  periodId: string
): Promise<GeneratePeriodInsightsResponse> {
  const generateFn = httpsCallable<
    { periodType: PeriodType; periodId: string },
    GeneratePeriodInsightsResponse
  >(functions, 'generateInsightsForPeriod');

  try {
    console.log('[insights] Triggering insight generation for', periodType, periodId);
    const result = await generateFn({ periodType, periodId });
    console.log('[insights] Generation complete:', result.data);
    return result.data;
  } catch (error) {
    console.error('[insights] Error generating insights:', error);
    throw error;
  }
}

// ============ Period Insights History ============

/**
 * Summary of insights for history sidebar
 */
export interface InsightsSummary {
  documentId: string;
  periodType: PeriodType;
  periodId: string;
  periodStart: Date;
  periodEnd: Date;
  totalRides: number;
  totalRevenue: number;
  generatedAt: Date;
}

/**
 * Result of paginated insights list
 */
export interface InsightsListResult {
  summaries: InsightsSummary[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

/**
 * Get paginated list of insights summaries for history sidebar
 *
 * @param periodType - Filter by period type (optional - if not provided, returns all types)
 * @param pageSize - Number of items per page (default: 10)
 * @param lastDocument - Last document from previous page for pagination
 * @returns Paginated list of summaries
 */
export async function getInsightsList(
  periodType?: PeriodType,
  pageSize: number = 10,
  lastDocument?: QueryDocumentSnapshot<DocumentData> | null
): Promise<InsightsListResult> {
  const insightsCollection = collection(db, 'insights');

  // Build query with optional pagination
  let q = query(insightsCollection, orderBy('period_start', 'desc'), limit(pageSize * 4 + 1));

  if (lastDocument) {
    q = query(
      insightsCollection,
      orderBy('period_start', 'desc'),
      startAfter(lastDocument),
      limit(pageSize * 4 + 1)
    );
  }

  try {
    const snapshot = await getDocs(q);
    const docs = snapshot.docs;

    // Filter by period type if specified and collect summaries
    const summaries: InsightsSummary[] = [];
    let lastProcessedDoc: QueryDocumentSnapshot<DocumentData> | null = null;

    for (const docSnapshot of docs) {
      const data = docSnapshot.data() as FirestorePeriodInsights;

      if (!periodType || data.period_type === periodType) {
        summaries.push({
          documentId: docSnapshot.id,
          periodType: data.period_type,
          periodId: data.period_id,
          periodStart: data.period_start.toDate(),
          periodEnd: data.period_end.toDate(),
          totalRides: data.metrics?.rides?.completed ?? 0,
          totalRevenue: data.metrics?.rides?.total_revenue ?? 0,
          generatedAt: data.generated_at.toDate(),
        });

        if (summaries.length >= pageSize) {
          lastProcessedDoc = docSnapshot;
          break;
        }
      }

      lastProcessedDoc = docSnapshot;
    }

    // Check if there are more items
    const hasMore = summaries.length >= pageSize && docs.length > summaries.length;
    const itemSummaries = summaries.slice(0, pageSize);

    return {
      summaries: itemSummaries,
      lastDoc: hasMore ? lastProcessedDoc : null,
      hasMore,
    };
  } catch (error) {
    console.error('[insights] Error fetching insights list:', error);
    throw error;
  }
}
