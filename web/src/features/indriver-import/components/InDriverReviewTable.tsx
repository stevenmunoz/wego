/**
 * InDriver Review Table Component
 *
 * Displays extracted ride data in an editable table format
 */

import { type FC, useState } from 'react';
import type { ExtractedInDriverRide, ExtractionSummary } from '../types';
import {
  formatCurrency,
  formatDate,
  formatTime,
  formatDuration,
  formatDistance,
  formatConfidence,
  getStatusLabel,
  getStatusColor,
  getConfidenceLevel,
  calculateTotals,
} from '../utils/formatters';
import './InDriverReviewTable.css';

interface InDriverReviewTableProps {
  rides: ExtractedInDriverRide[];
  summary: ExtractionSummary | null;
  isImporting: boolean;
  onUpdateRide: (id: string, updates: Partial<ExtractedInDriverRide>) => void;
  onRemoveRide: (id: string) => void;
  onImport: () => void;
  onBack: () => void;
}

export const InDriverReviewTable: FC<InDriverReviewTableProps> = ({
  rides,
  summary,
  isImporting,
  onUpdateRide: _onUpdateRide,
  onRemoveRide,
  onImport,
  onBack,
}) => {
  // Reserved for future inline editing feature
  const [_editingId, _setEditingId] = useState<string | null>(null);

  // Suppress unused variable warnings - will be used for edit feature
  void _onUpdateRide;
  void _editingId;
  void _setEditingId;

  const totals = calculateTotals(rides);

  const renderConfidenceBadge = (confidence: number) => {
    const level = getConfidenceLevel(confidence);
    return (
      <span className={`confidence-badge confidence-${level}`}>
        {formatConfidence(confidence)}
      </span>
    );
  };

  const renderStatusBadge = (status: ExtractedInDriverRide['status']) => {
    const color = getStatusColor(status);
    const label = getStatusLabel(status);
    return <span className={`status-badge status-${color}`}>{label}</span>;
  };

  if (rides.length === 0) {
    return (
      <div className="review-table-empty">
        <p>No hay viajes extraídos para mostrar</p>
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          Volver a subir archivos
        </button>
      </div>
    );
  }

  return (
    <div className="review-table-container">
      {/* Header */}
      <div className="review-header">
        <div className="review-title-section">
          <div>
            <h2 className="review-title">Revisar Datos Extraídos</h2>
            {summary && (
              <p className="review-subtitle">
                {summary.successful_extractions} viaje
                {summary.successful_extractions !== 1 ? 's' : ''} extraído
                {summary.successful_extractions !== 1 ? 's' : ''} | Confianza
                promedio: {formatConfidence(summary.average_confidence)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <span className="summary-label">Total Recibí</span>
          <span className="summary-value">
            {formatCurrency(totals.totalTarifa)}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Pagué</span>
          <span className="summary-value">
            {formatCurrency(totals.totalComision + totals.totalIva)}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Neto</span>
          <span className="summary-value success">
            {formatCurrency(totals.totalIngresos)}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Viajes Completados</span>
          <span className="summary-value">{totals.completedCount}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Viajes Cancelados</span>
          <span className="summary-value error">{totals.cancelledCount}</span>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="review-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Duración</th>
              <th>Distancia</th>
              <th>Estado</th>
              <th>Recibí</th>
              <th>Pagué</th>
              <th>Neto</th>
              <th>Confianza</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rides.map((ride, index) => (
              <tr
                key={ride.id}
                className={ride.status !== 'completed' ? 'row-cancelled' : ''}
              >
                <td className="cell-index">{index + 1}</td>
                <td className="cell-date">{formatDate(ride.date)}</td>
                <td className="cell-time">{formatTime(ride.time)}</td>
                <td className="cell-duration">{formatDuration(ride.duration)}</td>
                <td className="cell-distance">{formatDistance(ride.distance)}</td>
                <td className="cell-status">{renderStatusBadge(ride.status)}</td>
                <td className="cell-income">
                  <div className="income-breakdown">
                    <span className="income-value">
                      {formatCurrency(ride.tarifa)}
                    </span>
                    {ride.total_recibido !== ride.tarifa && (
                      <span className="income-detail">
                        Recibido: {formatCurrency(ride.total_recibido)}
                      </span>
                    )}
                    <span className="income-detail">
                      {ride.payment_method_label || 'Efectivo'}
                    </span>
                  </div>
                </td>
                <td className="cell-deductions">
                  <div className="deductions-breakdown">
                    <span className="deduction-value">
                      {formatCurrency(ride.total_pagado)}
                    </span>
                    {ride.comision_servicio > 0 && (
                      <span className="deduction-detail">
                        Comisión: {formatCurrency(ride.comision_servicio)}
                      </span>
                    )}
                    {ride.iva_pago_servicio > 0 && (
                      <span className="deduction-detail">
                        IVA: {formatCurrency(ride.iva_pago_servicio)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="cell-net">
                  <span className="net-value">
                    {formatCurrency(ride.mis_ingresos)}
                  </span>
                </td>
                <td className="cell-confidence">
                  {renderConfidenceBadge(ride.extraction_confidence)}
                </td>
                <td className="cell-actions">
                  <button
                    type="button"
                    className="btn-action btn-delete"
                    onClick={() => onRemoveRide(ride.id)}
                    title="Eliminar"
                    aria-label="Eliminar viaje"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="totals-row">
              <td colSpan={6} className="totals-label">
                <strong>
                  Totales ({rides.length} viajes: {totals.completedCount} completados
                  {totals.cancelledCount > 0 && `, ${totals.cancelledCount} cancelados`})
                </strong>
              </td>
              <td className="cell-income">
                <strong>{formatCurrency(totals.totalTarifa)}</strong>
              </td>
              <td className="cell-deductions">
                <strong>{formatCurrency(totals.totalComision + totals.totalIva)}</strong>
              </td>
              <td className="cell-net">
                <strong>{formatCurrency(totals.totalIngresos)}</strong>
              </td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Import Action */}
      <div className="review-footer">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onBack}
          disabled={isImporting}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onImport}
          disabled={isImporting || rides.length === 0}
        >
          {isImporting ? (
            <>
              <span className="spinner"></span>
              Importando...
            </>
          ) : (
            `Confirmar Importación (${rides.length})`
          )}
        </button>
      </div>
    </div>
  );
};
