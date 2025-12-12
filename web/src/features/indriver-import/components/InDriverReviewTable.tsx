/**
 * InDriver Review Table Component
 *
 * Displays extracted ride data in an editable table format
 * with inline editing for correcting OCR extraction errors
 */

import { type FC, useState, useRef, useEffect } from 'react';
import type { ExtractedInDriverRide, ExtractionSummary, RideStatus } from '../types';
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
  onImport: () => void;
  onBack: () => void;
}

type EditableField =
  | 'date'
  | 'time'
  | 'duration'
  | 'distance'
  | 'tarifa'
  | 'total_pagado'
  | 'comision_servicio'
  | 'iva_pago_servicio'
  | 'mis_ingresos'
  | 'status';

interface EditingState {
  rideId: string;
  field: EditableField;
}

// Helper to convert date string to YYYY-MM-DD for HTML date input
const toInputDateFormat = (dateStr: string): string => {
  if (!dateStr) return '';

  // If already in YYYY-MM-DD format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  try {
    // Try DD/MM/YYYY format first (Colombian format)
    const slashParts = dateStr.split('/');
    if (slashParts.length === 3) {
      const [day, month, year] = slashParts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Parse as date and use LOCAL date methods (not UTC) to avoid timezone shift
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return dateStr;
  } catch {
    return dateStr;
  }
};

// Editable Cell Component for inline editing
interface EditableCellProps {
  value: string | number;
  displayValue: string;
  isEditing: boolean;
  type: 'text' | 'number' | 'date' | 'time' | 'select';
  options?: { value: string; label: string }[];
  onStartEdit: () => void;
  onSave: (value: string | number) => void;
  onCancel: () => void;
  className?: string;
}

const EditableCell: FC<EditableCellProps> = ({
  value,
  displayValue,
  isEditing,
  type,
  options,
  onStartEdit,
  onSave,
  onCancel,
  className = '',
}) => {
  // For date type, convert to YYYY-MM-DD format for HTML input
  const getInitialValue = () => {
    if (type === 'date') {
      return toInputDateFormat(String(value));
    }
    return String(value);
  };

  const [editValue, setEditValue] = useState(getInitialValue);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();

      if (inputRef.current instanceof HTMLInputElement) {
        // For date and time inputs, automatically open the picker
        if (type === 'date' || type === 'time') {
          // Small delay to ensure the input is ready
          setTimeout(() => {
            try {
              (inputRef.current as HTMLInputElement)?.showPicker();
            } catch {
              // showPicker() may not be supported in all browsers
            }
          }, 50);
        } else {
          inputRef.current.select();
        }
      } else if (inputRef.current instanceof HTMLSelectElement && type === 'select') {
        // For select inputs, automatically open the dropdown
        setTimeout(() => {
          try {
            (inputRef.current as HTMLSelectElement)?.showPicker();
          } catch {
            // showPicker() may not be supported - try click as fallback
            inputRef.current?.click();
          }
        }, 50);
      }
    }
  }, [isEditing, type]);

  useEffect(() => {
    if (type === 'date') {
      setEditValue(toInputDateFormat(String(value)));
    } else {
      setEditValue(String(value));
    }
  }, [value, type]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleSave = () => {
    if (type === 'number') {
      const numValue = parseFloat(editValue.replace(/[^\d.-]/g, ''));
      onSave(isNaN(numValue) ? 0 : numValue);
    } else {
      // For date, the value is already in YYYY-MM-DD (ISO format)
      onSave(editValue);
    }
  };

  if (isEditing) {
    if (type === 'select' && options) {
      return (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            onSave(e.target.value);
          }}
          onBlur={onCancel}
          onKeyDown={handleKeyDown}
          className="editable-input editable-select"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    // Date picker input - auto-saves on change
    if (type === 'date') {
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="date"
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            // Auto-save when date is selected from picker
            if (e.target.value) {
              onSave(e.target.value);
            }
          }}
          onBlur={() => {
            if (editValue) {
              handleSave();
            } else {
              onCancel();
            }
          }}
          onKeyDown={handleKeyDown}
          className="editable-input editable-date"
        />
      );
    }

    const getInputClassName = () => {
      if (type === 'number') return 'editable-input editable-number';
      if (type === 'time') return 'editable-input editable-time';
      return 'editable-input';
    };

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={type === 'number' ? 'text' : type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={getInputClassName()}
      />
    );
  }

  return (
    <span
      className={`editable-cell ${className}`}
      onClick={onStartEdit}
      title="Haz clic para editar"
    >
      {displayValue}
      <span className="edit-icon">✎</span>
    </span>
  );
};

export const InDriverReviewTable: FC<InDriverReviewTableProps> = ({
  rides,
  summary,
  isImporting,
  onUpdateRide,
  onImport,
  onBack,
}) => {
  const [editing, setEditing] = useState<EditingState | null>(null);

  const totals = calculateTotals(rides);

  const startEditing = (rideId: string, field: EditableField) => {
    setEditing({ rideId, field });
  };

  const stopEditing = () => {
    setEditing(null);
  };

  const handleUpdateField = (
    ride: ExtractedInDriverRide,
    field: EditableField,
    value: string | number
  ) => {
    const updates: Partial<ExtractedInDriverRide> = {};

    switch (field) {
      case 'date':
        updates.date = value as string;
        break;
      case 'time':
        updates.time = value as string;
        break;
      case 'duration':
        if (ride.duration) {
          updates.duration = { ...ride.duration, value: value as number };
        } else {
          updates.duration = { value: value as number, unit: 'min' };
        }
        break;
      case 'distance':
        if (ride.distance) {
          updates.distance = { ...ride.distance, value: value as number };
        } else {
          updates.distance = { value: value as number, unit: 'km' };
        }
        break;
      case 'tarifa':
        updates.tarifa = value as number;
        updates.total_recibido = value as number;
        // Recalculate net earnings
        updates.mis_ingresos = (value as number) - ride.comision_servicio - ride.iva_pago_servicio;
        break;
      case 'total_pagado':
        updates.total_pagado = value as number;
        // Adjust comision to match the new total (keep IVA unchanged)
        updates.comision_servicio = (value as number) - ride.iva_pago_servicio;
        // Recalculate net earnings
        updates.mis_ingresos = ride.tarifa - (value as number);
        break;
      case 'comision_servicio':
        updates.comision_servicio = value as number;
        updates.total_pagado = (value as number) + ride.iva_pago_servicio;
        // Recalculate net earnings
        updates.mis_ingresos = ride.tarifa - (value as number) - ride.iva_pago_servicio;
        break;
      case 'iva_pago_servicio':
        updates.iva_pago_servicio = value as number;
        updates.total_pagado = ride.comision_servicio + (value as number);
        // Recalculate net earnings
        updates.mis_ingresos = ride.tarifa - ride.comision_servicio - (value as number);
        break;
      case 'mis_ingresos':
        updates.mis_ingresos = value as number;
        // Adjust tarifa to match the new net earnings (keep deductions unchanged)
        updates.tarifa = (value as number) + ride.comision_servicio + ride.iva_pago_servicio;
        updates.total_recibido = updates.tarifa;
        break;
      case 'status':
        updates.status = value as RideStatus;
        break;
    }

    onUpdateRide(ride.id, updates);
    stopEditing();
  };

  const isEditingField = (rideId: string, field: EditableField) => {
    return editing?.rideId === rideId && editing?.field === field;
  };

  const renderConfidenceBadge = (confidence: number) => {
    const level = getConfidenceLevel(confidence);
    return (
      <span className={`confidence-badge confidence-${level}`}>{formatConfidence(confidence)}</span>
    );
  };

  const renderStatusBadge = (ride: ExtractedInDriverRide, isEditingStatus: boolean) => {
    const statusOptions = [
      { value: 'completed', label: 'Completado' },
      { value: 'cancelled_by_passenger', label: 'Cancelado por pasajero' },
      { value: 'cancelled_by_driver', label: 'Cancelado por conductor' },
    ];

    if (isEditingStatus) {
      return (
        <EditableCell
          value={ride.status}
          displayValue={getStatusLabel(ride.status)}
          isEditing={true}
          type="select"
          options={statusOptions}
          onStartEdit={() => {}}
          onSave={(value) => handleUpdateField(ride, 'status', value)}
          onCancel={stopEditing}
        />
      );
    }

    const color = getStatusColor(ride.status);
    const label = getStatusLabel(ride.status);
    return (
      <span
        className={`status-badge status-${color} editable-cell`}
        onClick={() => startEditing(ride.id, 'status')}
        title="Haz clic para editar"
      >
        {label}
        <span className="edit-icon">✎</span>
      </span>
    );
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
                {summary.successful_extractions !== 1 ? 's' : ''} | Confianza promedio:{' '}
                {formatConfidence(summary.average_confidence)}
              </p>
            )}
            <p className="review-edit-hint">Haz clic en cualquier valor resaltado para editarlo</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <span className="summary-label">Total Recibí</span>
          <span className="summary-value">{formatCurrency(totals.totalTarifa)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Pagué</span>
          <span className="summary-value">{formatCurrency(totals.totalPagado)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Neto</span>
          <span className="summary-value success">{formatCurrency(totals.totalIngresos)}</span>
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
            </tr>
          </thead>
          <tbody>
            {rides.map((ride, index) => (
              <tr key={ride.id} className={ride.status !== 'completed' ? 'row-cancelled' : ''}>
                <td className="cell-index">{index + 1}</td>
                <td className="cell-date">
                  <EditableCell
                    value={ride.date || ''}
                    displayValue={formatDate(ride.date)}
                    isEditing={isEditingField(ride.id, 'date')}
                    type="date"
                    onStartEdit={() => startEditing(ride.id, 'date')}
                    onSave={(value) => handleUpdateField(ride, 'date', value)}
                    onCancel={stopEditing}
                  />
                </td>
                <td className="cell-time">
                  <EditableCell
                    value={ride.time}
                    displayValue={formatTime(ride.time)}
                    isEditing={isEditingField(ride.id, 'time')}
                    type="time"
                    onStartEdit={() => startEditing(ride.id, 'time')}
                    onSave={(value) => handleUpdateField(ride, 'time', value)}
                    onCancel={stopEditing}
                  />
                </td>
                <td className="cell-duration">
                  <EditableCell
                    value={ride.duration?.value ?? 0}
                    displayValue={formatDuration(ride.duration)}
                    isEditing={isEditingField(ride.id, 'duration')}
                    type="number"
                    onStartEdit={() => startEditing(ride.id, 'duration')}
                    onSave={(value) => handleUpdateField(ride, 'duration', value)}
                    onCancel={stopEditing}
                  />
                </td>
                <td className="cell-distance">
                  <EditableCell
                    value={ride.distance?.value ?? 0}
                    displayValue={formatDistance(ride.distance)}
                    isEditing={isEditingField(ride.id, 'distance')}
                    type="number"
                    onStartEdit={() => startEditing(ride.id, 'distance')}
                    onSave={(value) => handleUpdateField(ride, 'distance', value)}
                    onCancel={stopEditing}
                  />
                </td>
                <td className="cell-status">
                  {renderStatusBadge(ride, isEditingField(ride.id, 'status'))}
                </td>
                <td className="cell-income">
                  <div className="income-breakdown">
                    <EditableCell
                      value={ride.tarifa}
                      displayValue={formatCurrency(ride.tarifa)}
                      isEditing={isEditingField(ride.id, 'tarifa')}
                      type="number"
                      onStartEdit={() => startEditing(ride.id, 'tarifa')}
                      onSave={(value) => handleUpdateField(ride, 'tarifa', value)}
                      onCancel={stopEditing}
                      className="income-value"
                    />
                    <span className="income-detail">{ride.payment_method_label || 'Efectivo'}</span>
                  </div>
                </td>
                <td className="cell-deductions">
                  <div className="deductions-breakdown">
                    <EditableCell
                      value={ride.total_pagado}
                      displayValue={formatCurrency(ride.total_pagado)}
                      isEditing={isEditingField(ride.id, 'total_pagado')}
                      type="number"
                      onStartEdit={() => startEditing(ride.id, 'total_pagado')}
                      onSave={(value) => handleUpdateField(ride, 'total_pagado', value)}
                      onCancel={stopEditing}
                      className="deduction-value"
                    />
                    <EditableCell
                      value={ride.comision_servicio}
                      displayValue={`Comisión: ${formatCurrency(ride.comision_servicio)}`}
                      isEditing={isEditingField(ride.id, 'comision_servicio')}
                      type="number"
                      onStartEdit={() => startEditing(ride.id, 'comision_servicio')}
                      onSave={(value) => handleUpdateField(ride, 'comision_servicio', value)}
                      onCancel={stopEditing}
                      className="deduction-detail"
                    />
                    <EditableCell
                      value={ride.iva_pago_servicio}
                      displayValue={`IVA: ${formatCurrency(ride.iva_pago_servicio)}`}
                      isEditing={isEditingField(ride.id, 'iva_pago_servicio')}
                      type="number"
                      onStartEdit={() => startEditing(ride.id, 'iva_pago_servicio')}
                      onSave={(value) => handleUpdateField(ride, 'iva_pago_servicio', value)}
                      onCancel={stopEditing}
                      className="deduction-detail"
                    />
                  </div>
                </td>
                <td className="cell-net">
                  <EditableCell
                    value={ride.mis_ingresos}
                    displayValue={formatCurrency(ride.mis_ingresos)}
                    isEditing={isEditingField(ride.id, 'mis_ingresos')}
                    type="number"
                    onStartEdit={() => startEditing(ride.id, 'mis_ingresos')}
                    onSave={(value) => handleUpdateField(ride, 'mis_ingresos', value)}
                    onCancel={stopEditing}
                    className="net-value"
                  />
                </td>
                <td className="cell-confidence">
                  {renderConfidenceBadge(ride.extraction_confidence)}
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
                <strong>{formatCurrency(totals.totalPagado)}</strong>
              </td>
              <td className="cell-net">
                <strong>{formatCurrency(totals.totalIngresos)}</strong>
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Import Action */}
      <div className="review-footer">
        <button type="button" className="btn btn-secondary" onClick={onBack} disabled={isImporting}>
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
