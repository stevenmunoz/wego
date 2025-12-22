/**
 * Goals Settings Modal Component
 *
 * Modal for configuring global reporting goals.
 */

import { type FC, useState, useEffect } from 'react';
import type { ReportingGoal, GoalTargetType, ReportingGoalInput } from '../types';
import './GoalsSettingsModal.css';

interface GoalsSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: ReportingGoal[];
  onSave: (input: ReportingGoalInput) => Promise<{ success: boolean; error?: string }>;
  onDelete: (goalId: string) => Promise<{ success: boolean; error?: string }>;
}

const GOAL_TYPE_OPTIONS: Array<{ value: GoalTargetType; label: string; placeholder: string }> = [
  { value: 'rides_per_week', label: 'Viajes por semana', placeholder: 'ej: 50' },
  { value: 'rides_per_month', label: 'Viajes por mes', placeholder: 'ej: 200' },
  { value: 'revenue_per_week', label: 'Ingresos por semana (COP)', placeholder: 'ej: 2000000' },
  { value: 'revenue_per_month', label: 'Ingresos por mes (COP)', placeholder: 'ej: 8000000' },
];

// Currency formatting
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const GoalsSettingsModal: FC<GoalsSettingsModalProps> = ({
  isOpen,
  onClose,
  goals,
  onSave,
  onDelete,
}) => {
  const [selectedType, setSelectedType] = useState<GoalTargetType>('rides_per_week');
  const [targetValue, setTargetValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing goal value when type changes
  useEffect(() => {
    const existingGoal = goals.find((g) => g.target_type === selectedType);
    if (existingGoal) {
      setTargetValue(existingGoal.target_value.toString());
    } else {
      setTargetValue('');
    }
  }, [selectedType, goals]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsSaving(false);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!targetValue || isNaN(Number(targetValue)) || Number(targetValue) <= 0) {
      setError('Por favor ingresa un valor valido mayor a 0');
      return;
    }

    setIsSaving(true);
    setError(null);

    const result = await onSave({
      target_type: selectedType,
      target_value: Number(targetValue),
    });

    setIsSaving(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Error al guardar la meta');
    }
  };

  const handleDelete = async (goalId: string) => {
    if (!confirm('¿Estas seguro de eliminar esta meta?')) return;

    setIsSaving(true);
    setError(null);

    const result = await onDelete(goalId);

    setIsSaving(false);

    if (!result.success) {
      setError(result.error || 'Error al eliminar la meta');
    }
  };

  const getPlaceholder = (): string => {
    const option = GOAL_TYPE_OPTIONS.find((o) => o.value === selectedType);
    return option?.placeholder || '';
  };

  const isRevenue = selectedType.includes('revenue');

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Configurar Metas</h2>
          <button className="close-button" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Existing Goals */}
          {goals.length > 0 && (
            <div className="existing-goals">
              <h4 className="subsection-title">Metas Actuales</h4>
              <ul className="goals-list">
                {goals.map((goal) => {
                  const option = GOAL_TYPE_OPTIONS.find((o) => o.value === goal.target_type);
                  const isGoalRevenue = goal.target_type.includes('revenue');

                  return (
                    <li key={goal.id} className="goal-item">
                      <div className="goal-info">
                        <span className="goal-type">{option?.label}</span>
                        <span className="goal-value">
                          {isGoalRevenue
                            ? formatCurrency(goal.target_value)
                            : `${goal.target_value} viajes`}
                        </span>
                      </div>
                      <button
                        className="delete-goal-btn"
                        onClick={() => handleDelete(goal.id)}
                        disabled={isSaving}
                        aria-label="Eliminar meta"
                      >
                        🗑️
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Add/Update Goal */}
          <div className="goal-form">
            <h4 className="subsection-title">
              {goals.find((g) => g.target_type === selectedType) ? 'Actualizar Meta' : 'Nueva Meta'}
            </h4>

            <div className="form-group">
              <label htmlFor="goal-type">Tipo de Meta</label>
              <select
                id="goal-type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as GoalTargetType)}
                disabled={isSaving}
              >
                {GOAL_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="target-value">Valor Objetivo {isRevenue && '(COP)'}</label>
              <input
                type="number"
                id="target-value"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder={getPlaceholder()}
                min="1"
                disabled={isSaving}
              />
              {isRevenue && targetValue && !isNaN(Number(targetValue)) && (
                <span className="value-preview">{formatCurrency(Number(targetValue))}</span>
              )}
            </div>

            {error && <div className="error-message">{error}</div>}
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose} disabled={isSaving}>
            Cancelar
          </button>
          <button className="save-button" onClick={handleSave} disabled={isSaving || !targetValue}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};
