/**
 * Formatting utilities for InDriver import feature
 */

import type { ExtractedInDriverRide, RideStatus } from '../types';

/**
 * Format currency in Colombian Peso format
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format date in Spanish Colombian format (DD/MM/YYYY)
 * Handles YYYY-MM-DD input without timezone conversion
 */
export const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  try {
    // If already in DD/MM/YYYY format, return as-is
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      return dateStr;
    }

    // Handle YYYY-MM-DD format (from date picker) - parse manually to avoid timezone issues
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${day}/${month}/${year}`;
    }

    // Fallback: try parsing with Date but use local methods
    const date = new Date(dateStr + 'T12:00:00'); // Add noon time to avoid timezone edge cases
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }

    return dateStr;
  } catch {
    return dateStr;
  }
};

/**
 * Format time in 12-hour format
 */
export const formatTime = (time: string): string => {
  if (!time) return '-';
  try {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'p.m.' : 'a.m.';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch {
    return time;
  }
};

/**
 * Format duration
 */
export const formatDuration = (duration: { value: number; unit: string } | null): string => {
  if (!duration) return '-';
  return `${duration.value} ${duration.unit === 'hr' ? 'hora(s)' : 'min'}`;
};

/**
 * Format distance
 */
export const formatDistance = (distance: { value: number; unit: string } | null): string => {
  if (!distance) return '-';
  if (distance.unit === 'metro') {
    return `${distance.value} m`;
  }
  return `${distance.value.toFixed(1)} km`;
};

/**
 * Get status label in Spanish
 */
export const getStatusLabel = (status: RideStatus): string => {
  const labels: Record<RideStatus, string> = {
    completed: 'Completado',
    cancelled_by_passenger: 'Cancelado por pasajero',
    cancelled_by_driver: 'Cancelado por conductor',
  };
  return labels[status] || status;
};

/**
 * Get status color class
 */
export const getStatusColor = (status: RideStatus): string => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'cancelled_by_passenger':
    case 'cancelled_by_driver':
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Format confidence as percentage
 */
export const formatConfidence = (confidence: number): string => {
  return `${(confidence * 100).toFixed(0)}%`;
};

/**
 * Get confidence level class
 */
export const getConfidenceLevel = (confidence: number): 'high' | 'medium' | 'low' => {
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.5) return 'medium';
  return 'low';
};

/**
 * Calculate totals from extracted rides
 */
export const calculateTotals = (
  rides: ExtractedInDriverRide[]
): {
  totalIngresos: number;
  totalTarifa: number;
  totalComision: number;
  totalIva: number;
  totalPagado: number;
  completedCount: number;
  cancelledCount: number;
} => {
  const completed = rides.filter((r) => r.status === 'completed');
  const cancelled = rides.filter((r) => r.status !== 'completed');

  return {
    totalIngresos: completed.reduce((sum, r) => sum + r.mis_ingresos, 0),
    totalTarifa: completed.reduce((sum, r) => sum + r.tarifa, 0),
    totalComision: completed.reduce((sum, r) => sum + r.comision_servicio, 0),
    totalIva: completed.reduce((sum, r) => sum + r.iva_pago_servicio, 0),
    totalPagado: completed.reduce((sum, r) => sum + r.total_pagado, 0),
    completedCount: completed.length,
    cancelledCount: cancelled.length,
  };
};

/**
 * Format rating as stars
 */
export const formatRating = (rating: number | null): string => {
  if (!rating) return '-';
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
};
