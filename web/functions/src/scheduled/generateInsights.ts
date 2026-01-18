/**
 * Generate Insights - Cloud Functions
 *
 * Period-agnostic Cloud Functions for generating AI-powered business insights.
 * These functions support daily, weekly, bi-weekly, and monthly insights.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { generateInsights } from '../services/insightsService';
import { getPeriodRange, getPeriodRangeFromId } from '../utils/period.utils';
import type { PeriodType } from '../types/insights.types';

// ============ Scheduled Functions ============

/**
 * Scheduled function that runs every Monday at 1:00 AM Colombia time
 * Generates AI insights for the previous week (Mon-Sun)
 */
export const generateWeeklyInsightsScheduled = functions
  .runWith({
    timeoutSeconds: 300, // 5 minutes for weekly processing
    memory: '512MB',
  })
  .pubsub.schedule('0 1 * * 1') // 1:00 AM every Monday
  .timeZone('America/Bogota')
  .onRun(async () => {
    // Calculate previous week's date range
    const now = new Date();
    // Adjust for Colombia timezone (UTC-5)
    const colombiaOffset = -5 * 60 * 60 * 1000;
    const colombiaNow = new Date(now.getTime() + colombiaOffset);

    // Get Monday of LAST week (not current week)
    const lastWeekDate = new Date(colombiaNow);
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);

    const periodRange = getPeriodRange('weekly', lastWeekDate);

    functions.logger.info(
      `[WeeklyInsights] Starting scheduled generation for ${periodRange.id}`
    );

    try {
      const result = await generateInsights({
        periodType: 'weekly',
        periodRange,
        includeVehicleFinances: true,
        createNotification: true,
      });

      functions.logger.info(
        `[WeeklyInsights] Scheduled generation completed: ${result.ridesCount} rides, ${result.insightsCount} insights in ${result.durationMs}ms`
      );
    } catch (error) {
      functions.logger.error(`[WeeklyInsights] Scheduled generation failed:`, error);
      throw error;
    }
  });

// ============ Callable Functions ============

/**
 * HTTP callable function to manually trigger insights generation for any period
 *
 * Supports all period types: daily, weekly, biweekly, monthly
 *
 * @param data.periodType - The type of period: 'daily' | 'weekly' | 'biweekly' | 'monthly'
 * @param data.periodId - The period ID in the appropriate format:
 *   - daily: 'YYYY-MM-DD' (e.g., '2026-01-15')
 *   - weekly: 'YYYY-Www' (e.g., '2026-W02')
 *   - biweekly: 'YYYY-BWww' (e.g., '2026-BW02')
 *   - monthly: 'YYYY-MM' (e.g., '2026-01')
 */
export const generateInsightsForPeriod = functions
  .runWith({
    timeoutSeconds: 300,
    memory: '512MB',
  })
  .https.onCall(async (data, context) => {
    // Verify admin access
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Check admin role
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'User must be an admin');
    }

    const { periodType, periodId } = data;

    // Validate period type
    const validPeriodTypes: PeriodType[] = ['daily', 'weekly', 'biweekly', 'monthly'];
    if (!periodType || !validPeriodTypes.includes(periodType)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `periodType must be one of: ${validPeriodTypes.join(', ')}`
      );
    }

    // Validate period ID format
    const periodIdPatterns: Record<PeriodType, RegExp> = {
      daily: /^\d{4}-\d{2}-\d{2}$/,
      weekly: /^\d{4}-W\d{2}$/,
      biweekly: /^\d{4}-BW\d{2}$/,
      monthly: /^\d{4}-\d{2}$/,
    };

    if (!periodId || !periodIdPatterns[periodType as PeriodType].test(periodId)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Invalid periodId format for ${periodType}`
      );
    }

    // Calculate period range
    const periodRange = getPeriodRangeFromId(periodId, periodType as PeriodType);
    if (!periodRange) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Could not parse period ID: ${periodId}`
      );
    }

    functions.logger.info(
      `[Insights] Manual generation triggered for ${periodType} ${periodId}`
    );

    try {
      // Determine options based on period type
      const includeVehicleFinances = periodType !== 'daily';
      const createNotification = periodType !== 'daily';

      const result = await generateInsights({
        periodType: periodType as PeriodType,
        periodRange,
        includeVehicleFinances,
        createNotification,
      });

      return result;
    } catch (error) {
      functions.logger.error(
        `[Insights] Manual generation failed for ${periodType} ${periodId}:`,
        error
      );
      throw new functions.https.HttpsError(
        'internal',
        `Failed to generate insights: ${(error as Error).message}`
      );
    }
  });

