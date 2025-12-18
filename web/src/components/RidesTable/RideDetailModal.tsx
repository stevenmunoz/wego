/**
 * RideDetailModal Component
 *
 * Modal displaying detailed ride information in a card style
 */

import { type FC, useEffect } from 'react';
import type { FirestoreInDriverRide } from '@/core/firebase';

interface RideDetailModalProps {
  ride: (FirestoreInDriverRide & { driver_name?: string; vehicle_plate?: string }) | null;
  isOpen: boolean;
  onClose: () => void;
}

// Label maps for external ride fields
const REQUEST_SOURCE_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  phone: 'Llamada telefónica',
  referral: 'Referido',
  other: 'Otro',
};

const TRIP_REASON_LABELS: Record<string, string> = {
  personal: 'Personal',
  work: 'Trabajo',
  emergency: 'Emergencia',
  other: 'Otro',
};

const TIME_OF_DAY_LABELS: Record<string, string> = {
  morning: 'Mañana',
  afternoon: 'Tarde',
  evening: 'Noche',
  night: 'Madrugada',
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  ocr_import: 'Importación OCR',
  public_form: 'Formulario público',
  manual: 'Manual',
};

const CATEGORY_LABELS: Record<string, string> = {
  indriver: 'InDriver',
  external: 'Externo',
  independent: 'Independiente',
  other: 'Otro',
};

/**
 * Format date for display (DD/MM/YYYY)
 */
function formatDate(timestamp: { toDate: () => Date } | string | null): string {
  if (!timestamp) return '-';
  let date: Date;
  if (typeof timestamp === 'string') {
    const isoMatch = timestamp.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
    } else {
      date = new Date(timestamp + 'T12:00:00');
    }
  } else {
    date = timestamp.toDate();
  }
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Format currency for display
 */
function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format duration
 */
function formatDuration(value: number | null, unit: string | null): string {
  if (value === null) return '-';
  return `${value} ${unit || 'min'}`;
}

/**
 * Format distance
 */
function formatDistance(value: number | null, unit: string | null): string {
  if (value === null) return '-';
  return `${value.toFixed(1)} ${unit || 'km'}`;
}

/**
 * Get status label
 */
function getStatusLabel(status: string): string {
  switch (status) {
    case 'completed':
      return 'Completado';
    case 'cancelled_by_passenger':
      return 'Cancelado (pasajero)';
    case 'cancelled_by_driver':
      return 'Cancelado (conductor)';
    default:
      return status;
  }
}

export const RideDetailModal: FC<RideDetailModalProps> = ({ ride, isOpen, onClose }) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !ride) return null;

  const isExternalRide = ride.category === 'external';

  return (
    <div className="ride-detail-overlay" onClick={onClose}>
      <div className="ride-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ride-detail-header">
          <h2 className="ride-detail-title">Detalles del viaje</h2>
          <button
            type="button"
            className="ride-detail-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="ride-detail-content">
          <div className="ride-detail-card">
            {/* Date & Time */}
            <div className="ride-detail-row">
              <span className="ride-detail-label">Fecha y hora</span>
              <span className="ride-detail-value">
                {formatDate(ride.date)} - {ride.time || '-'}
              </span>
            </div>

            {/* Origin (external rides only) */}
            {ride.origin_address && (
              <div className="ride-detail-row">
                <span className="ride-detail-label">Origen</span>
                <span className="ride-detail-value">{ride.origin_address}</span>
              </div>
            )}

            {/* Destination */}
            <div className="ride-detail-row">
              <span className="ride-detail-label">Destino</span>
              <span className="ride-detail-value">{ride.destination_address || '-'}</span>
            </div>

            {/* Duration & Distance */}
            {(ride.duration_value !== null || ride.distance_value !== null) && (
              <div className="ride-detail-row">
                <span className="ride-detail-label">Duración / Distancia</span>
                <span className="ride-detail-value">
                  {formatDuration(ride.duration_value, ride.duration_unit)} /{' '}
                  {formatDistance(ride.distance_value, ride.distance_unit)}
                </span>
              </div>
            )}

            {/* Fare - highlighted */}
            <div className="ride-detail-row ride-detail-row-highlight">
              <span className="ride-detail-label">Valor del viaje</span>
              <span className="ride-detail-value ride-detail-value-currency">
                {formatCurrency(ride.base_fare)}
              </span>
            </div>

            {/* Status */}
            <div className="ride-detail-row">
              <span className="ride-detail-label">Estado</span>
              <span className="ride-detail-value">{getStatusLabel(ride.status)}</span>
            </div>

            {/* Cancellation reason (if applicable) */}
            {ride.cancellation_reason && (
              <div className="ride-detail-row">
                <span className="ride-detail-label">Motivo cancelación</span>
                <span className="ride-detail-value">{ride.cancellation_reason}</span>
              </div>
            )}

            {/* Source / Category */}
            <div className="ride-detail-row">
              <span className="ride-detail-label">Fuente</span>
              <span className="ride-detail-value">
                {CATEGORY_LABELS[ride.category] || ride.category}
              </span>
            </div>

            {/* Source type (how it was entered) */}
            {ride.source_type && (
              <div className="ride-detail-row">
                <span className="ride-detail-label">Método de registro</span>
                <span className="ride-detail-value">
                  {SOURCE_TYPE_LABELS[ride.source_type] || ride.source_type}
                </span>
              </div>
            )}

            {/* Driver (admin view) */}
            {ride.driver_name && (
              <div className="ride-detail-row">
                <span className="ride-detail-label">Conductor</span>
                <span className="ride-detail-value">{ride.driver_name}</span>
              </div>
            )}

            {/* Vehicle */}
            {ride.vehicle_plate && (
              <div className="ride-detail-row">
                <span className="ride-detail-label">Vehículo</span>
                <span className="ride-detail-value">{ride.vehicle_plate}</span>
              </div>
            )}

            {/* External ride specific fields */}
            {isExternalRide && (
              <>
                {/* Request source */}
                {ride.request_source && (
                  <div className="ride-detail-row">
                    <span className="ride-detail-label">Fuente de contacto</span>
                    <span className="ride-detail-value">
                      {REQUEST_SOURCE_LABELS[ride.request_source] || ride.request_source}
                    </span>
                  </div>
                )}

                {/* Trip reason */}
                {ride.trip_reason && (
                  <div className="ride-detail-row">
                    <span className="ride-detail-label">Motivo</span>
                    <span className="ride-detail-value">
                      {TRIP_REASON_LABELS[ride.trip_reason] || ride.trip_reason}
                    </span>
                  </div>
                )}

                {/* Time of day */}
                {ride.time_of_day && (
                  <div className="ride-detail-row">
                    <span className="ride-detail-label">Horario</span>
                    <span className="ride-detail-value">
                      {TIME_OF_DAY_LABELS[ride.time_of_day] || ride.time_of_day}
                    </span>
                  </div>
                )}

                {/* Recurring */}
                {ride.is_recurring !== undefined && (
                  <div className="ride-detail-row">
                    <span className="ride-detail-label">Pasajero frecuente</span>
                    <span className="ride-detail-value">{ride.is_recurring ? 'Sí' : 'No'}</span>
                  </div>
                )}
              </>
            )}

            {/* Passenger (InDriver rides) */}
            {ride.passenger_name && (
              <div className="ride-detail-row">
                <span className="ride-detail-label">Pasajero</span>
                <span className="ride-detail-value">{ride.passenger_name}</span>
              </div>
            )}

            {/* Rating */}
            {ride.rating_given !== null && ride.rating_given !== undefined && (
              <div className="ride-detail-row">
                <span className="ride-detail-label">Calificación</span>
                <span className="ride-detail-value">{'⭐'.repeat(ride.rating_given)}</span>
              </div>
            )}

            {/* Payment method */}
            <div className="ride-detail-row">
              <span className="ride-detail-label">Forma de pago</span>
              <span className="ride-detail-value">
                {ride.payment_method_label || ride.payment_method || '-'}
              </span>
            </div>

            {/* Financial breakdown section */}
            <div className="ride-detail-section-title">Desglose financiero</div>

            <div className="ride-detail-row">
              <span className="ride-detail-label">Total recibido</span>
              <span className="ride-detail-value">{formatCurrency(ride.total_received)}</span>
            </div>

            {ride.service_commission > 0 && (
              <div className="ride-detail-row">
                <span className="ride-detail-label">Comisión servicio</span>
                <span className="ride-detail-value ride-detail-value-deduction">
                  -{formatCurrency(ride.service_commission)}
                </span>
              </div>
            )}

            {ride.service_tax > 0 && (
              <div className="ride-detail-row">
                <span className="ride-detail-label">IVA</span>
                <span className="ride-detail-value ride-detail-value-deduction">
                  -{formatCurrency(ride.service_tax)}
                </span>
              </div>
            )}

            <div className="ride-detail-row ride-detail-row-highlight">
              <span className="ride-detail-label">Ganancia neta</span>
              <span className="ride-detail-value ride-detail-value-net">
                {formatCurrency(ride.net_earnings)}
              </span>
            </div>

            {/* Tip */}
            {ride.tip_received && ride.tip_amount && (
              <div className="ride-detail-row">
                <span className="ride-detail-label">Propina</span>
                <span className="ride-detail-value">{formatCurrency(ride.tip_amount)}</span>
              </div>
            )}

            {/* Comments */}
            {ride.comments && (
              <div className="ride-detail-row ride-detail-row-full">
                <span className="ride-detail-label">Comentarios</span>
                <span className="ride-detail-value ride-detail-value-text">{ride.comments}</span>
              </div>
            )}
          </div>
        </div>

        <div className="ride-detail-footer">
          <button type="button" className="ride-detail-btn-close" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
