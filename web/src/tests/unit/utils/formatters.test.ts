/**
 * Tests for InDriver import formatters
 *
 * These tests cover utility functions used in the InDriver import feature.
 */

import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatTime,
  formatDuration,
  formatDistance,
  getStatusLabel,
  getStatusColor,
  formatConfidence,
  getConfidenceLevel,
  formatRating,
  calculateTotals,
} from '@/features/indriver-import/utils/formatters';
import type { ExtractedInDriverRide } from '@/features/indriver-import/types';

describe('formatCurrency', () => {
  it('formats positive amounts in Colombian pesos', () => {
    const result = formatCurrency(125000);
    // Intl formats with $ for COP
    expect(result).toContain('125');
    expect(result).toContain('000');
  });

  it('formats zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });

  it('formats large amounts with thousands separator', () => {
    const result = formatCurrency(1500000);
    expect(result).toContain('1');
    expect(result).toContain('500');
    expect(result).toContain('000');
  });

  it('formats decimal amounts', () => {
    const result = formatCurrency(12500.5);
    expect(result).toContain('12');
    expect(result).toContain('500');
  });
});

describe('formatDate', () => {
  it('returns "-" for null input', () => {
    expect(formatDate(null)).toBe('-');
  });

  it('returns input as-is if already in DD/MM/YYYY format', () => {
    expect(formatDate('15/12/2024')).toBe('15/12/2024');
  });

  it('converts ISO format (YYYY-MM-DD) to DD/MM/YYYY', () => {
    expect(formatDate('2024-12-15')).toBe('15/12/2024');
  });

  it('handles single-digit days and months', () => {
    expect(formatDate('2024-01-05')).toBe('05/01/2024');
  });
});

describe('formatTime', () => {
  it('returns "-" for empty string', () => {
    expect(formatTime('')).toBe('-');
  });

  it('formats morning time (AM)', () => {
    expect(formatTime('09:30')).toBe('9:30 a.m.');
  });

  it('formats afternoon time (PM)', () => {
    expect(formatTime('14:45')).toBe('2:45 p.m.');
  });

  it('formats noon correctly', () => {
    expect(formatTime('12:00')).toBe('12:00 p.m.');
  });

  it('formats midnight correctly', () => {
    expect(formatTime('00:00')).toBe('12:00 a.m.');
  });
});

describe('formatDuration', () => {
  it('returns "-" for null input', () => {
    expect(formatDuration(null)).toBe('-');
  });

  it('formats minutes', () => {
    expect(formatDuration({ value: 15, unit: 'min' })).toBe('15 min');
  });

  it('formats hours', () => {
    expect(formatDuration({ value: 2, unit: 'hr' })).toBe('2 hora(s)');
  });
});

describe('formatDistance', () => {
  it('returns "-" for null input', () => {
    expect(formatDistance(null)).toBe('-');
  });

  it('formats meters', () => {
    expect(formatDistance({ value: 500, unit: 'metro' })).toBe('500 m');
  });

  it('formats kilometers with one decimal', () => {
    expect(formatDistance({ value: 5.75, unit: 'km' })).toBe('5.8 km');
  });
});

describe('getStatusLabel', () => {
  it('returns "Completado" for completed status', () => {
    expect(getStatusLabel('completed')).toBe('Completado');
  });

  it('returns correct label for passenger cancellation', () => {
    expect(getStatusLabel('cancelled_by_passenger')).toBe('Cancelado por pasajero');
  });

  it('returns correct label for driver cancellation', () => {
    expect(getStatusLabel('cancelled_by_driver')).toBe('Cancelado por conductor');
  });
});

describe('getStatusColor', () => {
  it('returns "success" for completed status', () => {
    expect(getStatusColor('completed')).toBe('success');
  });

  it('returns "error" for cancelled_by_passenger', () => {
    expect(getStatusColor('cancelled_by_passenger')).toBe('error');
  });

  it('returns "error" for cancelled_by_driver', () => {
    expect(getStatusColor('cancelled_by_driver')).toBe('error');
  });
});

describe('formatConfidence', () => {
  it('formats 1.0 as 100%', () => {
    expect(formatConfidence(1.0)).toBe('100%');
  });

  it('formats 0.85 as 85%', () => {
    expect(formatConfidence(0.85)).toBe('85%');
  });

  it('formats 0 as 0%', () => {
    expect(formatConfidence(0)).toBe('0%');
  });

  it('rounds to nearest integer', () => {
    expect(formatConfidence(0.856)).toBe('86%');
  });
});

describe('getConfidenceLevel', () => {
  it('returns "high" for confidence >= 0.8', () => {
    expect(getConfidenceLevel(0.8)).toBe('high');
    expect(getConfidenceLevel(1.0)).toBe('high');
    expect(getConfidenceLevel(0.95)).toBe('high');
  });

  it('returns "medium" for confidence >= 0.5 and < 0.8', () => {
    expect(getConfidenceLevel(0.5)).toBe('medium');
    expect(getConfidenceLevel(0.79)).toBe('medium');
    expect(getConfidenceLevel(0.65)).toBe('medium');
  });

  it('returns "low" for confidence < 0.5', () => {
    expect(getConfidenceLevel(0.49)).toBe('low');
    expect(getConfidenceLevel(0)).toBe('low');
    expect(getConfidenceLevel(0.25)).toBe('low');
  });
});

describe('formatRating', () => {
  it('returns "-" for null', () => {
    expect(formatRating(null)).toBe('-');
  });

  it('formats 5-star rating', () => {
    expect(formatRating(5)).toBe('★★★★★');
  });

  it('formats 3-star rating', () => {
    expect(formatRating(3)).toBe('★★★☆☆');
  });

  it('returns "-" for 0 rating (falsy value)', () => {
    // Note: 0 is treated as falsy, so returns '-' like null
    expect(formatRating(0)).toBe('-');
  });
});

describe('calculateTotals', () => {
  const mockRides: ExtractedInDriverRide[] = [
    {
      id: '1',
      date: '2024-01-15',
      time: '10:00',
      status: 'completed',
      mis_ingresos: 10000,
      tarifa: 15000,
      comision_servicio: 3000,
      iva_pago_servicio: 500,
      total_pagado: 15000,
      total_ganado: 10000,
      distancia: { value: 5, unit: 'km' },
      duracion: { value: 15, unit: 'min' },
      confidence: 0.9,
    } as unknown as ExtractedInDriverRide,
    {
      id: '2',
      date: '2024-01-15',
      time: '14:00',
      status: 'completed',
      mis_ingresos: 8000,
      tarifa: 12000,
      comision_servicio: 2500,
      iva_pago_servicio: 400,
      total_pagado: 12000,
      total_ganado: 8000,
      distancia: { value: 4, unit: 'km' },
      duracion: { value: 12, unit: 'min' },
      confidence: 0.85,
    } as unknown as ExtractedInDriverRide,
    {
      id: '3',
      date: '2024-01-15',
      time: '16:00',
      status: 'cancelled_by_passenger',
      mis_ingresos: 0,
      tarifa: 0,
      comision_servicio: 0,
      iva_pago_servicio: 0,
      total_pagado: 0,
      total_ganado: 0,
      distancia: null,
      duracion: null,
      confidence: 0.7,
    } as unknown as ExtractedInDriverRide,
  ];

  it('calculates correct total ingresos from completed rides', () => {
    const totals = calculateTotals(mockRides);
    expect(totals.totalIngresos).toBe(18000); // 10000 + 8000
  });

  it('calculates correct total tarifa from completed rides', () => {
    const totals = calculateTotals(mockRides);
    expect(totals.totalTarifa).toBe(27000); // 15000 + 12000
  });

  it('calculates correct total comision from completed rides', () => {
    const totals = calculateTotals(mockRides);
    expect(totals.totalComision).toBe(5500); // 3000 + 2500
  });

  it('calculates correct total IVA from completed rides', () => {
    const totals = calculateTotals(mockRides);
    expect(totals.totalIva).toBe(900); // 500 + 400
  });

  it('counts completed rides correctly', () => {
    const totals = calculateTotals(mockRides);
    expect(totals.completedCount).toBe(2);
  });

  it('counts cancelled rides correctly', () => {
    const totals = calculateTotals(mockRides);
    expect(totals.cancelledCount).toBe(1);
  });

  it('handles empty array', () => {
    const totals = calculateTotals([]);
    expect(totals.totalIngresos).toBe(0);
    expect(totals.completedCount).toBe(0);
    expect(totals.cancelledCount).toBe(0);
  });
});
