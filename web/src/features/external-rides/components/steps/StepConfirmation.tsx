/**
 * StepConfirmation Component
 *
 * Summary of all entered data before submission
 */

import { type FC } from 'react';
import type { StepProps } from '../../types';
import {
  PAYMENT_METHOD_LABELS,
  REQUEST_SOURCE_LABELS,
  TRIP_REASON_LABELS,
  TIME_OF_DAY_LABELS,
  MESSAGES,
} from '../../constants';
import './Steps.css';

/**
 * Format date for display (DD/MM/YYYY)
 */
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Format currency for display
 */
function formatCurrency(value: number | undefined): string {
  if (value === undefined) return '-';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export const StepConfirmation: FC<StepProps> = ({ formData }) => {
  return (
    <div className="wizard-step wizard-step-confirmation">
      <div className="confirmation-card">
        {/* Date & Time */}
        <div className="confirmation-row">
          <span className="confirmation-label">Fecha y hora</span>
          <span className="confirmation-value">
            {formatDate(formData.date)} - {formData.time || '-'}
          </span>
        </div>

        {/* Origin */}
        <div className="confirmation-row">
          <span className="confirmation-label">Origen</span>
          <span className="confirmation-value">{formData.origin_address || '-'}</span>
        </div>

        {/* Destination */}
        <div className="confirmation-row">
          <span className="confirmation-label">Destino</span>
          <span className="confirmation-value">{formData.destination_address || '-'}</span>
        </div>

        {/* Fare */}
        <div className="confirmation-row confirmation-row-highlight">
          <span className="confirmation-label">Valor del viaje</span>
          <span className="confirmation-value confirmation-value-currency">
            {formatCurrency(formData.total_received)}
          </span>
        </div>

        {/* Request source */}
        <div className="confirmation-row">
          <span className="confirmation-label">Fuente de contacto</span>
          <span className="confirmation-value">
            {REQUEST_SOURCE_LABELS[formData.request_source || ''] || '-'}
          </span>
        </div>

        {/* Trip reason */}
        <div className="confirmation-row">
          <span className="confirmation-label">Motivo</span>
          <span className="confirmation-value">
            {TRIP_REASON_LABELS[formData.trip_reason || ''] || '-'}
          </span>
        </div>

        {/* Time of day */}
        <div className="confirmation-row">
          <span className="confirmation-label">Horario</span>
          <span className="confirmation-value">
            {TIME_OF_DAY_LABELS[formData.time_of_day || ''] || '-'}
          </span>
        </div>

        {/* Recurring */}
        <div className="confirmation-row">
          <span className="confirmation-label">Pasajero frecuente</span>
          <span className="confirmation-value">
            {formData.is_recurring === true
              ? MESSAGES.YES
              : formData.is_recurring === false
                ? MESSAGES.NO
                : '-'}
          </span>
        </div>

        {/* Payment method */}
        <div className="confirmation-row">
          <span className="confirmation-label">Forma de pago</span>
          <span className="confirmation-value">
            {PAYMENT_METHOD_LABELS[formData.payment_method || ''] || '-'}
          </span>
        </div>

        {/* Tip */}
        {formData.tip_received && (
          <div className="confirmation-row">
            <span className="confirmation-label">Propina</span>
            <span className="confirmation-value">{formatCurrency(formData.tip_amount)}</span>
          </div>
        )}

        {/* Comments */}
        {formData.comments && (
          <div className="confirmation-row confirmation-row-full">
            <span className="confirmation-label">Comentarios</span>
            <span className="confirmation-value confirmation-value-text">
              {formData.comments}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
