/**
 * Insights Service
 *
 * Period-agnostic service for generating AI-powered business insights.
 * Supports daily, weekly, bi-weekly, and monthly insights.
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { defineString } from 'firebase-functions/params';
import Anthropic from '@anthropic-ai/sdk';

// Define the Anthropic API key as an environment parameter
const anthropicApiKey = defineString('ANTHROPIC_API_KEY');
import type { PeriodRange, PeriodType } from '../types/insights.types';
import type {
  InsightsDocument,
  InsightsMetrics,
  RidesMetrics,
  CancellationsMetrics,
  KilometersMetrics,
  VehicleFinanceMetrics,
  SourceBreakdown,
  TopExpenseCategory,
  Insight,
  GenerateInsightsOptions,
  GenerateInsightsResult,
  RideForAggregation,
  VehicleExpenseForAggregation,
  VehicleIncomeForAggregation,
  VehicleForDisplay,
} from '../types/insights.types';
import {
  EXPENSE_CATEGORY_LABELS,
  formatInsightsDocumentId,
} from '../types/insights.types';
import {
  getPreviousPeriod,
  formatPeriodDisplaySpanish,
} from '../utils/period.utils';

// ============ Query Functions ============

/**
 * Check if a category should be grouped as "external"
 */
function isExternalCategory(category: string): boolean {
  return ['external', 'independent', 'other'].includes(category);
}

/**
 * Query rides for a date range
 */
export async function queryRidesForPeriod(
  startDate: Date,
  endDate: Date
): Promise<RideForAggregation[]> {
  const db = admin.firestore();

  const startTimestamp = admin.firestore.Timestamp.fromDate(startDate);
  const endTimestamp = admin.firestore.Timestamp.fromDate(endDate);

  functions.logger.info(
    `[Insights] Querying rides from ${startDate.toISOString()} to ${endDate.toISOString()}`
  );

  // Query all rides using collection group query
  const ridesSnapshot = await db
    .collectionGroup('driver_rides')
    .where('date', '>=', startTimestamp)
    .where('date', '<=', endTimestamp)
    .get();

  const rides: RideForAggregation[] = ridesSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      driver_id: data.driver_id || '',
      vehicle_id: data.vehicle_id || undefined,
      date: data.date || null,
      time: data.time || '',
      status: data.status || 'completed',
      cancellation_reason: data.cancellation_reason || undefined,
      category: data.category || 'indriver',
      total_received: data.total_received || 0,
      service_commission: data.service_commission || 0,
      total_paid: data.total_paid || 0,
      distance_value: data.distance_value || null,
      distance_unit: data.distance_unit || null,
    };
  });

  functions.logger.info(`[Insights] Found ${rides.length} rides for period`);
  return rides;
}

/**
 * Query all vehicles
 */
export async function queryVehicles(): Promise<VehicleForDisplay[]> {
  const db = admin.firestore();

  const vehiclesSnapshot = await db.collection('vehicles').get();

  const vehicles: VehicleForDisplay[] = vehiclesSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      plate: data.plate || '',
      brand: data.brand || '',
      model: data.model || '',
      year: data.year || 0,
    };
  });

  functions.logger.info(`[Insights] Found ${vehicles.length} vehicles`);
  return vehicles;
}

/**
 * Query vehicle expenses for a date range
 */
export async function queryVehicleExpenses(
  vehicleId: string,
  startDate: Date,
  endDate: Date
): Promise<VehicleExpenseForAggregation[]> {
  const db = admin.firestore();

  const startTimestamp = admin.firestore.Timestamp.fromDate(startDate);
  const endTimestamp = admin.firestore.Timestamp.fromDate(endDate);

  const expensesSnapshot = await db
    .collection('vehicles')
    .doc(vehicleId)
    .collection('expenses')
    .where('date', '>=', startTimestamp)
    .where('date', '<=', endTimestamp)
    .get();

  return expensesSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      vehicle_id: vehicleId,
      category: data.category || 'other',
      amount: data.amount || 0,
      date: data.date,
    };
  });
}

/**
 * Query vehicle income for a date range
 */
export async function queryVehicleIncome(
  vehicleId: string,
  startDate: Date,
  endDate: Date
): Promise<VehicleIncomeForAggregation[]> {
  const db = admin.firestore();

  const startTimestamp = admin.firestore.Timestamp.fromDate(startDate);
  const endTimestamp = admin.firestore.Timestamp.fromDate(endDate);

  const incomeSnapshot = await db
    .collection('vehicles')
    .doc(vehicleId)
    .collection('income')
    .where('date', '>=', startTimestamp)
    .where('date', '<=', endTimestamp)
    .get();

  return incomeSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      vehicle_id: vehicleId,
      type: data.type || 'other',
      amount: data.amount || 0,
      date: data.date,
    };
  });
}

// ============ Calculation Functions ============

/**
 * Calculate rides metrics for a period
 */
export function calculateRidesMetrics(
  rides: RideForAggregation[],
  previousRides: RideForAggregation[]
): RidesMetrics {
  const completedRides = rides.filter((r) => r.status === 'completed');
  const previousCompleted = previousRides.filter((r) => r.status === 'completed');

  // Calculate totals
  const totalRevenue = completedRides.reduce((sum, r) => sum + r.total_received, 0);
  const averagePerRide = completedRides.length > 0 ? totalRevenue / completedRides.length : 0;

  // Calculate source breakdown
  const indriverRides = completedRides.filter((r) => r.category === 'indriver');
  const externalRides = completedRides.filter((r) => isExternalCategory(r.category));

  const indriverRevenue = indriverRides.reduce((sum, r) => sum + r.total_received, 0);
  const externalRevenue = externalRides.reduce((sum, r) => sum + r.total_received, 0);

  const totalCount = completedRides.length;
  const sourceBreakdown: SourceBreakdown = {
    indriver: {
      count: indriverRides.length,
      revenue: indriverRevenue,
      percentage: totalCount > 0 ? (indriverRides.length / totalCount) * 100 : 0,
    },
    external: {
      count: externalRides.length,
      revenue: externalRevenue,
      percentage: totalCount > 0 ? (externalRides.length / totalCount) * 100 : 0,
    },
  };

  // Calculate change vs previous period
  const changeVsPrevious =
    previousCompleted.length > 0
      ? ((completedRides.length - previousCompleted.length) / previousCompleted.length) * 100
      : null;

  return {
    total: rides.length,
    completed: completedRides.length,
    total_revenue: totalRevenue,
    average_per_ride: averagePerRide,
    change_vs_previous: changeVsPrevious,
    by_source: sourceBreakdown,
  };
}

/**
 * Calculate cancellations metrics for a period
 */
export function calculateCancellationsMetrics(
  rides: RideForAggregation[],
  previousRides: RideForAggregation[]
): CancellationsMetrics {
  const cancelledRides = rides.filter((r) => r.status === 'cancelled');
  const completedRides = rides.filter((r) => r.status === 'completed');

  const previousCancelled = previousRides.filter((r) => r.status === 'cancelled');
  const previousCompleted = previousRides.filter((r) => r.status === 'completed');

  // Calculate cancellation rate
  const totalRelevant = completedRides.length + cancelledRides.length;
  const rate = totalRelevant > 0 ? (cancelledRides.length / totalRelevant) * 100 : 0;

  // Calculate previous period rate
  const previousTotalRelevant = previousCompleted.length + previousCancelled.length;
  const previousRate =
    previousTotalRelevant > 0 ? (previousCancelled.length / previousTotalRelevant) * 100 : 0;

  // Group by reason
  const byPassenger = cancelledRides.filter(
    (r) => r.cancellation_reason === 'by_passenger' || r.cancellation_reason === 'passenger'
  ).length;
  const byDriver = cancelledRides.filter(
    (r) => r.cancellation_reason === 'by_driver' || r.cancellation_reason === 'driver'
  ).length;

  // Change vs previous period (comparing rates)
  const changeVsPrevious = previousTotalRelevant > 0 ? rate - previousRate : null;

  return {
    total: cancelledRides.length,
    rate: Math.round(rate * 10) / 10,
    by_reason: {
      by_passenger: byPassenger,
      by_driver: byDriver,
    },
    change_vs_previous: changeVsPrevious,
  };
}

/**
 * Calculate kilometers metrics for a period
 */
export function calculateKilometersMetrics(
  rides: RideForAggregation[],
  totalRevenue: number
): KilometersMetrics {
  const completedRides = rides.filter((r) => r.status === 'completed');

  // Sum up kilometers (convert to km if needed)
  let totalKm = 0;
  completedRides.forEach((ride) => {
    if (ride.distance_value != null) {
      // Assume distance is in km unless specified as miles
      const km =
        ride.distance_unit === 'miles' ? ride.distance_value * 1.60934 : ride.distance_value;
      totalKm += km;
    }
  });

  const averagePerRide = completedRides.length > 0 ? totalKm / completedRides.length : 0;
  const revenuePerKm = totalKm > 0 ? totalRevenue / totalKm : 0;

  return {
    total_km: Math.round(totalKm * 10) / 10,
    average_per_ride: Math.round(averagePerRide * 10) / 10,
    revenue_per_km: Math.round(revenuePerKm),
  };
}

/**
 * Get top 3 expense categories for a vehicle
 */
function getTopExpenseCategories(expenses: VehicleExpenseForAggregation[]): TopExpenseCategory[] {
  // Group expenses by category
  const byCategory: Record<string, number> = {};
  expenses.forEach((expense) => {
    const category = expense.category;
    if (!byCategory[category]) {
      byCategory[category] = 0;
    }
    byCategory[category] += expense.amount;
  });

  // Sort by amount descending and take top 3
  const sorted = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return sorted.map(([category, amount]) => ({
    category,
    label: EXPENSE_CATEGORY_LABELS[category] || category,
    amount,
  }));
}

/**
 * Calculate vehicle finances for a period
 */
export async function calculateVehicleFinances(
  vehicles: VehicleForDisplay[],
  rides: RideForAggregation[],
  startDate: Date,
  endDate: Date
): Promise<VehicleFinanceMetrics[]> {
  const vehicleFinances: VehicleFinanceMetrics[] = [];

  for (const vehicle of vehicles) {
    // Query expenses and income for this vehicle
    const [expenses, incomes] = await Promise.all([
      queryVehicleExpenses(vehicle.id, startDate, endDate),
      queryVehicleIncome(vehicle.id, startDate, endDate),
    ]);

    // Get rides for this vehicle
    const vehicleRides = rides.filter(
      (r) => r.vehicle_id === vehicle.id && r.status === 'completed'
    );

    // Calculate totals
    const ridesCount = vehicleRides.length;
    const totalKm = vehicleRides.reduce((sum, r) => {
      if (r.distance_value != null) {
        const km = r.distance_unit === 'miles' ? r.distance_value * 1.60934 : r.distance_value;
        return sum + km;
      }
      return sum;
    }, 0);

    // Income from rides (total_received) plus recorded income entries
    const rideIncome = vehicleRides.reduce((sum, r) => sum + r.total_received, 0);
    const recordedIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalIncome = rideIncome + recordedIncome;

    // Total expenses
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Net profit
    const netProfit = totalIncome - totalExpenses;

    // Cost per km
    const costPerKm = totalKm > 0 ? totalExpenses / totalKm : 0;

    // Get top expense categories
    const topCategories = getTopExpenseCategories(expenses);

    // Build vehicle name
    const vehicleName = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`.trim();

    vehicleFinances.push({
      vehicle_id: vehicle.id,
      vehicle_plate: vehicle.plate,
      vehicle_name: vehicleName || vehicle.plate,
      rides_count: ridesCount,
      total_km: Math.round(totalKm * 10) / 10,
      total_income: totalIncome,
      expenses: {
        total: totalExpenses,
        top_categories: topCategories,
      },
      net_profit: netProfit,
      cost_per_km: Math.round(costPerKm),
    });
  }

  // Sort by total income descending
  vehicleFinances.sort((a, b) => b.total_income - a.total_income);

  return vehicleFinances;
}

/**
 * Calculate all metrics for a period
 */
export async function calculateInsightsMetrics(
  periodRange: PeriodRange,
  includeVehicleFinances: boolean = true
): Promise<{
  metrics: InsightsMetrics;
  rides: RideForAggregation[];
  previousRides: RideForAggregation[];
  vehicles: VehicleForDisplay[];
}> {
  // Query rides for the period
  const rides = await queryRidesForPeriod(periodRange.start, periodRange.end);

  // Query previous period for comparison
  const previousPeriod = getPreviousPeriod(periodRange);
  const previousRides = await queryRidesForPeriod(previousPeriod.start, previousPeriod.end);

  // Query vehicles
  const vehicles = await queryVehicles();

  // Calculate all metrics
  const ridesMetrics = calculateRidesMetrics(rides, previousRides);
  const cancellationsMetrics = calculateCancellationsMetrics(rides, previousRides);
  const kilometersMetrics = calculateKilometersMetrics(rides, ridesMetrics.total_revenue);

  // Vehicle finances (optional for daily)
  let vehicleFinances: VehicleFinanceMetrics[] | undefined;
  if (includeVehicleFinances) {
    vehicleFinances = await calculateVehicleFinances(
      vehicles,
      rides,
      periodRange.start,
      periodRange.end
    );
  }

  const metrics: InsightsMetrics = {
    rides: ridesMetrics,
    cancellations: cancellationsMetrics,
    kilometers: kilometersMetrics,
    vehicle_finances: vehicleFinances,
  };

  return { metrics, rides, previousRides, vehicles };
}

// ============ AI Insights Generation ============

/**
 * System prompt for Claude to generate period-agnostic business insights
 */
const INSIGHTS_SYSTEM_PROMPT = `Eres un analista de negocios para WeGo, una plataforma de transporte en Colombia.
Tu rol es analizar las métricas del período y generar 2-3 recomendaciones accionables en español.

CONTEXTO IMPORTANTE:
- WeGo opera en Colombia con moneda en COP (Pesos Colombianos)
- Dos fuentes de viajes: InDriver (plataforma) y Externos (WhatsApp, teléfono, referidos)
- Los viajes externos son más rentables (sin comisión de plataforma)
- Crecer viajes externos es una prioridad estratégica
- Formatea números con locale colombiano (puntos para miles: 1.250.000)

TIPOS DE INSIGHTS A GENERAR (elige 2-3 más relevantes):
1. priority: "high" - Alertas críticas o grandes oportunidades
2. priority: "medium" - Tendencias importantes a monitorear
3. priority: "low" - Observaciones generales o sugerencias

FORMATO DE RESPUESTA:
Devuelve un objeto JSON válido con esta estructura exacta:
{
  "insights": [
    {
      "priority": "high",
      "type": "revenue_trend",
      "title": "Titular corto (máx 60 caracteres)",
      "description": "Explicación detallada con números específicos y recomendación accionable (máx 250 caracteres)",
      "metric_reference": "rides",
      "value_change": 15.0
    }
  ]
}

REGLAS:
- SIEMPRE responde con JSON válido únicamente, sin markdown ni texto extra
- Escribe en español (Colombia) con acentos correctos (vehículo, kilómetro, operación)
- Sé específico con números y porcentajes
- Enfócate en insights accionables, no solo observaciones
- Prioriza insights sobre crecimiento de viajes externos
- Si hay tendencias preocupantes, márcalas con priority "high"
- type options: "revenue_trend", "ride_volume", "cancellation_alert", "efficiency", "vehicle_performance", "general"
- metric_reference options: "rides", "cancellations", "kilometers", "vehicle_finances", "external_rides"`;

/**
 * Format COP currency
 */
function formatCOP(amount: number): string {
  return amount.toLocaleString('es-CO');
}

/**
 * Format percentage with sign
 */
function formatPercent(value: number | null): string {
  if (value === null) return 'N/A';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Build user prompt for AI insights generation
 */
function buildInsightsPrompt(metrics: InsightsMetrics, periodRange: PeriodRange): string {
  const periodLabel = periodRange.displayLabel;

  // Build vehicle finances summary if available
  let vehicleSummary = '';
  if (metrics.vehicle_finances && metrics.vehicle_finances.length > 0) {
    metrics.vehicle_finances.forEach((v) => {
      const topExpenses = v.expenses.top_categories
        .map((c) => `${c.label}: $${formatCOP(c.amount)}`)
        .join(', ');
      vehicleSummary += `
  - ${v.vehicle_plate} (${v.vehicle_name}):
    - Viajes: ${v.rides_count} | KM: ${v.total_km}
    - Ingresos: $${formatCOP(v.total_income)} COP
    - Gastos: $${formatCOP(v.expenses.total)} COP (${topExpenses || 'sin gastos'})
    - Utilidad: $${formatCOP(v.net_profit)} COP
    - Costo/km: $${formatCOP(v.cost_per_km)} COP`;
    });
  }

  return `Analiza estas métricas del período ${periodLabel} y genera 2-3 recomendaciones accionables:

VIAJES DEL PERÍODO:
- Total: ${metrics.rides.total} viajes
- Completados: ${metrics.rides.completed}
- Ingresos totales: $${formatCOP(metrics.rides.total_revenue)} COP
- Promedio por viaje: $${formatCOP(metrics.rides.average_per_ride)} COP
- Cambio vs período anterior: ${formatPercent(metrics.rides.change_vs_previous)}

DESGLOSE POR FUENTE:
- InDriver: ${metrics.rides.by_source.indriver.count} viajes (${metrics.rides.by_source.indriver.percentage.toFixed(1)}%), $${formatCOP(metrics.rides.by_source.indriver.revenue)} COP
- Externos: ${metrics.rides.by_source.external.count} viajes (${metrics.rides.by_source.external.percentage.toFixed(1)}%), $${formatCOP(metrics.rides.by_source.external.revenue)} COP

CANCELACIONES:
- Total: ${metrics.cancellations.total} cancelaciones
- Tasa: ${metrics.cancellations.rate.toFixed(1)}%
- Por pasajero: ${metrics.cancellations.by_reason.by_passenger}
- Por conductor: ${metrics.cancellations.by_reason.by_driver}
- Cambio vs período anterior: ${formatPercent(metrics.cancellations.change_vs_previous)}

KILÓMETROS:
- Total recorrido: ${metrics.kilometers.total_km} km
- Promedio por viaje: ${metrics.kilometers.average_per_ride} km
- Ingreso por km: $${formatCOP(metrics.kilometers.revenue_per_km)} COP/km
${metrics.vehicle_finances ? `
FINANZAS POR VEHÍCULO:${vehicleSummary || '\n  Sin datos de vehículos'}` : ''}

Genera 2-3 insights en español siguiendo el formato JSON especificado.`;
}

/**
 * Generate AI insights using Claude
 */
export async function generateAIInsights(
  metrics: InsightsMetrics,
  periodRange: PeriodRange
): Promise<Insight[]> {
  const apiKey = anthropicApiKey.value();
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const anthropic = new Anthropic({ apiKey });

  functions.logger.info(`[Insights] Generating AI insights for ${periodRange.id}`);

  const userPrompt = buildInsightsPrompt(metrics, periodRange);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 1024,
      messages: [{ role: 'user', content: userPrompt }],
      system: INSIGHTS_SYSTEM_PROMPT,
    });

    // Extract text content from response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    functions.logger.debug(`[Insights] Raw AI response: ${content.text}`);

    // Strip markdown code fences if present
    let jsonText = content.text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, '');
      jsonText = jsonText.replace(/\n?```\s*$/, '');
    }

    // Parse the JSON response
    const parsed = JSON.parse(jsonText);

    // Validate and add IDs to each insight
    const insights: Insight[] = parsed.insights.map(
      (
        insight: {
          priority: 'high' | 'medium' | 'low';
          type?: string;
          title: string;
          description: string;
          metric_reference?: string;
          value_change?: number;
        },
        index: number
      ) => ({
        id: `${periodRange.id}-${index}`,
        priority: insight.priority,
        type: insight.type,
        title: insight.title,
        description: insight.description,
        metric_reference: insight.metric_reference,
        value_change: insight.value_change,
      })
    );

    functions.logger.info(`[Insights] Generated ${insights.length} insights for ${periodRange.id}`);

    return insights;
  } catch (error) {
    functions.logger.error(`[Insights] AI generation failed:`, error);
    throw new Error(`AI insight generation failed: ${(error as Error).message}`);
  }
}

// ============ Notification Creation ============

/**
 * Create a notification for all admin users
 */
export async function createInsightsNotification(
  periodType: PeriodType,
  periodRange: PeriodRange,
  ridesMetrics: RidesMetrics
): Promise<void> {
  const db = admin.firestore();

  // Build title based on period type
  const periodTitles: Record<PeriodType, string> = {
    daily: 'Resumen Diario Listo',
    weekly: 'Resumen Semanal Listo',
    biweekly: 'Resumen Quincenal Listo',
    monthly: 'Resumen Mensual Listo',
  };

  const notification = {
    type: `${periodType}_insights`,
    title: periodTitles[periodType],
    message: `El resumen de ${periodRange.displayLabel} está disponible`,
    source_collection: 'insights',
    source_document_id: formatInsightsDocumentId(periodType, periodRange.id),
    source_driver_id: '', // Not applicable for insights
    target_role: 'admin',
    read_by: [],
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    metadata: {
      period_type: periodType,
      period_id: periodRange.id,
      period_range: periodRange.displayLabel,
      total_rides: ridesMetrics.completed,
      total_revenue: ridesMetrics.total_revenue,
      action_url: `/insights?period=${periodType}&id=${periodRange.id}`,
    },
  };

  try {
    const docRef = await db.collection('notifications').add(notification);
    functions.logger.info(
      `[Insights] Created notification ${docRef.id} for ${periodType} ${periodRange.id}`
    );
  } catch (error) {
    functions.logger.error(
      `[Insights] Failed to create notification for ${periodType} ${periodRange.id}:`,
      error
    );
    // Don't throw - let the main function continue even if notification fails
  }
}

// ============ Main Generation Function ============

/**
 * Generate insights for a period
 *
 * This is the main entry point for generating insights.
 * It orchestrates data fetching, calculations, AI generation, and storage.
 */
export async function generateInsights(
  options: GenerateInsightsOptions
): Promise<GenerateInsightsResult> {
  const startTime = Date.now();
  const { periodType, periodRange, includeVehicleFinances = true, createNotification = true } = options;

  const documentId = formatInsightsDocumentId(periodType, periodRange.id);

  functions.logger.info(
    `[Insights] Starting generation for ${documentId} (${periodRange.start.toISOString()} to ${periodRange.end.toISOString()})`
  );

  try {
    // 1. Calculate all metrics
    const { metrics, vehicles } = await calculateInsightsMetrics(
      periodRange,
      includeVehicleFinances
    );

    functions.logger.info(
      `[Insights] Metrics calculated: ${metrics.rides.completed} completed rides, $${metrics.rides.total_revenue} COP revenue, ${vehicles.length} vehicles`
    );

    // 2. Generate AI insights
    const insights = await generateAIInsights(metrics, periodRange);

    // 3. Store in Firestore
    const db = admin.firestore();
    const document: Omit<InsightsDocument, 'id'> = {
      period_type: periodType,
      period_id: periodRange.id,
      period_start: admin.firestore.Timestamp.fromDate(periodRange.start),
      period_end: admin.firestore.Timestamp.fromDate(periodRange.end),
      metrics,
      insights,
      generated_at: admin.firestore.Timestamp.now(),
      generated_by: 'claude-opus-4-5',
      generation_duration_ms: Date.now() - startTime,
    };

    // Store in unified insights collection
    await db.collection('insights').doc(documentId).set(document);

    // 4. Create notification (if enabled)
    if (createNotification) {
      await createInsightsNotification(periodType, periodRange, metrics.rides);
    }

    const durationMs = Date.now() - startTime;
    functions.logger.info(
      `[Insights] Successfully generated ${documentId} in ${durationMs}ms`
    );

    return {
      success: true,
      documentId,
      periodType,
      periodId: periodRange.id,
      ridesCount: metrics.rides.completed,
      vehiclesCount: metrics.vehicle_finances?.length ?? 0,
      insightsCount: insights.length,
      durationMs,
    };
  } catch (error) {
    functions.logger.error(`[Insights] Failed to generate ${documentId}:`, error);
    throw error;
  }
}

// ============ Legacy Compatibility ============

/**
 * Generate weekly insights using unified service
 * (Backward compatibility wrapper)
 */
export async function generateWeeklyInsightsUnified(
  weekStart: Date,
  weekEnd: Date,
  weekId: string
): Promise<GenerateInsightsResult> {
  const periodRange: PeriodRange = {
    type: 'weekly',
    id: weekId,
    start: weekStart,
    end: weekEnd,
    displayLabel: formatPeriodDisplaySpanish('weekly', weekStart, weekEnd),
  };

  return generateInsights({
    periodType: 'weekly',
    periodRange,
    includeVehicleFinances: true,
    createNotification: true,
  });
}
