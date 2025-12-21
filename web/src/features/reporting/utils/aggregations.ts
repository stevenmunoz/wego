/**
 * Data Aggregation Utilities for Reporting Dashboard
 *
 * Client-side aggregation functions to process ride data
 * into summary statistics, charts, and tables.
 */

import type { Timestamp } from 'firebase/firestore';
import type { FirestoreInDriverRide } from '@/core/firebase/firestore';
import type {
  ReportingAggregations,
  SourceBreakdown,
  DailyTrend,
  DriverEfficiency,
  VehicleEfficiency,
  CancellationBreakdown,
  PaymentMethodBreakdown,
  PeakHoursMatrix,
  DateRange,
} from '../types';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a category should be grouped as "external"
 * External includes: 'external', 'independent', 'other'
 */
export function isExternalCategory(category: string): boolean {
  return ['external', 'independent', 'other'].includes(category);
}

/**
 * Convert Firestore Timestamp to Date (with validation)
 */
function toDate(timestamp: Timestamp | null): Date | null {
  if (!timestamp) return null;
  try {
    const date = timestamp.toDate();
    // Validate the date is actually valid
    if (isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
}

/**
 * Format date as YYYY-MM-DD (with validation)
 */
function formatDateKey(date: Date): string {
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

/**
 * Calculate number of days in a date range
 */
function getDaysDiff(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

// ============================================================================
// AGGREGATION FUNCTIONS
// ============================================================================

/**
 * Aggregate summary metrics
 */
export function aggregateSummary(rides: FirestoreInDriverRide[]): {
  totalRides: number;
  completedRides: number;
  totalRevenue: number;
  totalCommissions: number;
  averagePerRide: number;
} {
  const completedRides = rides.filter((r) => r.status === 'completed');

  const totalRevenue = completedRides.reduce((sum, r) => sum + (r.total_received || 0), 0);
  const totalCommissions = completedRides.reduce((sum, r) => sum + (r.service_commission || 0), 0);
  const averagePerRide = completedRides.length > 0 ? totalRevenue / completedRides.length : 0;

  return {
    totalRides: rides.length,
    completedRides: completedRides.length,
    totalRevenue,
    totalCommissions,
    averagePerRide,
  };
}

/**
 * Aggregate by source (InDriver vs External)
 */
export function aggregateBySource(rides: FirestoreInDriverRide[]): SourceBreakdown {
  const completedRides = rides.filter((r) => r.status === 'completed');

  const indriver = completedRides.filter((r) => r.category === 'indriver');
  const external = completedRides.filter((r) => isExternalCategory(r.category));

  return {
    indriver: {
      count: indriver.length,
      revenue: indriver.reduce((sum, r) => sum + (r.total_received || 0), 0),
    },
    external: {
      count: external.length,
      revenue: external.reduce((sum, r) => sum + (r.total_received || 0), 0),
    },
  };
}

/**
 * Aggregate daily trends
 */
export function aggregateDailyTrends(rides: FirestoreInDriverRide[]): DailyTrend[] {
  const trendsMap = new Map<string, DailyTrend>();

  for (const ride of rides) {
    const date = toDate(ride.date);
    if (!date) continue;

    const dateKey = formatDateKey(date);
    // Skip if date key is empty (invalid date)
    if (!dateKey) continue;

    const isCompleted = ride.status === 'completed';
    const isIndriver = ride.category === 'indriver';
    const isExternal = isExternalCategory(ride.category);

    if (!trendsMap.has(dateKey)) {
      trendsMap.set(dateKey, {
        date: dateKey,
        totalRides: 0,
        indriverRides: 0,
        externalRides: 0,
        totalRevenue: 0,
        indriverRevenue: 0,
        externalRevenue: 0,
      });
    }

    const trend = trendsMap.get(dateKey)!;
    trend.totalRides += 1;

    if (isIndriver) {
      trend.indriverRides += 1;
      if (isCompleted) {
        trend.indriverRevenue += ride.total_received || 0;
      }
    }

    if (isExternal) {
      trend.externalRides += 1;
      if (isCompleted) {
        trend.externalRevenue += ride.total_received || 0;
      }
    }

    if (isCompleted) {
      trend.totalRevenue += ride.total_received || 0;
    }
  }

  // Sort by date ascending
  return Array.from(trendsMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Aggregate by driver
 */
export function aggregateByDriver(
  rides: FirestoreInDriverRide[],
  driverNames: Map<string, string>
): DriverEfficiency[] {
  const driverMap = new Map<
    string,
    {
      driverId: string;
      driverName: string;
      completedCount: number;
      totalCount: number;
      revenue: number;
    }
  >();

  for (const ride of rides) {
    const driverId = ride.driver_id;
    if (!driverId) continue;

    if (!driverMap.has(driverId)) {
      driverMap.set(driverId, {
        driverId,
        driverName: driverNames.get(driverId) || 'Conductor desconocido',
        completedCount: 0,
        totalCount: 0,
        revenue: 0,
      });
    }

    const driver = driverMap.get(driverId)!;
    driver.totalCount += 1;

    if (ride.status === 'completed') {
      driver.completedCount += 1;
      driver.revenue += ride.total_received || 0;
    }
  }

  return Array.from(driverMap.values())
    .map((d) => ({
      driverId: d.driverId,
      driverName: d.driverName,
      rideCount: d.completedCount,
      revenue: d.revenue,
      avgPerRide: d.completedCount > 0 ? d.revenue / d.completedCount : 0,
      completionRate: d.totalCount > 0 ? (d.completedCount / d.totalCount) * 100 : 0,
    }))
    .sort((a, b) => b.rideCount - a.rideCount);
}

/**
 * Aggregate by vehicle
 */
export function aggregateByVehicle(
  rides: FirestoreInDriverRide[],
  vehiclePlates: Map<string, string>,
  dateRange: DateRange
): VehicleEfficiency[] {
  const totalDays = getDaysDiff(dateRange.startDate, dateRange.endDate);

  const vehicleMap = new Map<
    string,
    {
      vehicleId: string;
      plate: string;
      completedCount: number;
      revenue: number;
      activeDates: Set<string>;
    }
  >();

  for (const ride of rides) {
    const vehicleId = ride.vehicle_id;
    if (!vehicleId) continue;

    if (!vehicleMap.has(vehicleId)) {
      vehicleMap.set(vehicleId, {
        vehicleId,
        plate: vehiclePlates.get(vehicleId) || 'Sin placa',
        completedCount: 0,
        revenue: 0,
        activeDates: new Set(),
      });
    }

    const vehicle = vehicleMap.get(vehicleId)!;

    if (ride.status === 'completed') {
      vehicle.completedCount += 1;
      vehicle.revenue += ride.total_received || 0;

      // Track active days
      const date = toDate(ride.date);
      if (date) {
        vehicle.activeDates.add(formatDateKey(date));
      }
    }
  }

  return Array.from(vehicleMap.values())
    .map((v) => ({
      vehicleId: v.vehicleId,
      plate: v.plate,
      rideCount: v.completedCount,
      revenue: v.revenue,
      activeDays: v.activeDates.size,
      totalDays,
      utilizationPercent: totalDays > 0 ? (v.activeDates.size / totalDays) * 100 : 0,
    }))
    .sort((a, b) => b.rideCount - a.rideCount);
}

/**
 * Aggregate cancellation breakdown
 */
export function aggregateCancellations(rides: FirestoreInDriverRide[]): CancellationBreakdown {
  const byPassenger = rides.filter((r) => r.status === 'cancelled_by_passenger').length;
  const byDriver = rides.filter((r) => r.status === 'cancelled_by_driver').length;
  const totalCancelled = byPassenger + byDriver;
  const totalRides = rides.length;

  return {
    byPassenger,
    byDriver,
    totalCancelled,
    totalRides,
    cancellationRate: totalRides > 0 ? (totalCancelled / totalRides) * 100 : 0,
  };
}

/**
 * Aggregate peak hours into a 7x24 matrix
 * Matrix[dayOfWeek][hour] = count of rides
 * dayOfWeek: 0=Sunday to 6=Saturday
 * hour: 0-23
 */
export function aggregatePeakHours(rides: FirestoreInDriverRide[]): PeakHoursMatrix {
  // Initialize 7x24 matrix with zeros
  const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

  for (const ride of rides) {
    const date = toDate(ride.date);
    if (!date) continue;

    // Only count completed rides
    if (ride.status !== 'completed') continue;

    const dayOfWeek = date.getDay(); // 0=Sunday to 6=Saturday

    // Parse time string (expected format: "HH:mm" or similar)
    let hour = 0;
    if (ride.time) {
      const timeParts = ride.time.match(/(\d{1,2})/);
      if (timeParts) {
        hour = Math.min(23, Math.max(0, parseInt(timeParts[1], 10)));
      }
    }

    matrix[dayOfWeek][hour] += 1;
  }

  return matrix;
}

/**
 * Aggregate by payment method
 */
export function aggregateByPaymentMethod(rides: FirestoreInDriverRide[]): PaymentMethodBreakdown {
  const completedRides = rides.filter((r) => r.status === 'completed');

  const breakdown: PaymentMethodBreakdown = {
    cash: 0,
    nequi: 0,
    daviplata: 0,
    bancolombia: 0,
    other: 0,
  };

  for (const ride of completedRides) {
    const method = ride.payment_method?.toLowerCase() || 'other';

    if (method === 'cash' || method === 'efectivo') {
      breakdown.cash += 1;
    } else if (method === 'nequi') {
      breakdown.nequi += 1;
    } else if (method === 'daviplata') {
      breakdown.daviplata += 1;
    } else if (method === 'bancolombia') {
      breakdown.bancolombia += 1;
    } else {
      breakdown.other += 1;
    }
  }

  return breakdown;
}

// ============================================================================
// MAIN AGGREGATION FUNCTION
// ============================================================================

/**
 * Run all aggregations on a set of rides
 */
export function aggregateAllData(
  rides: FirestoreInDriverRide[],
  driverNames: Map<string, string>,
  vehiclePlates: Map<string, string>,
  dateRange: DateRange
): ReportingAggregations {
  const summary = aggregateSummary(rides);

  return {
    ...summary,
    bySource: aggregateBySource(rides),
    dailyTrends: aggregateDailyTrends(rides),
    byDriver: aggregateByDriver(rides, driverNames),
    byVehicle: aggregateByVehicle(rides, vehiclePlates, dateRange),
    cancellations: aggregateCancellations(rides),
    peakHours: aggregatePeakHours(rides),
    byPaymentMethod: aggregateByPaymentMethod(rides),
  };
}
