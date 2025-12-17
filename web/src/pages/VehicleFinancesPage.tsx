/**
 * Vehicle Finances page - P/L tracking for vehicles
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/core/store/auth-store';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PLSummaryCards } from '@/components/VehicleFinances/PLSummaryCards';
import { TransactionsTable } from '@/components/VehicleFinances/TransactionsTable';
import { IncomeForm } from '@/components/VehicleFinances/IncomeForm';
import { ExpenseForm } from '@/components/VehicleFinances/ExpenseForm';
import { useDriverVehicles } from '@/hooks/useDriverVehicles';
import { useAllVehicles } from '@/hooks/useAllVehicles';
import { useVehicleFinances } from '@/hooks/useVehicleFinances';
import type {
  VehicleIncomeCreateInput,
  VehicleExpenseCreateInput,
  VehicleIncome,
  VehicleExpense,
} from '@/core/types';
import './VehicleFinancesPage.css';

type FormType = 'income' | 'expense' | null;

export const VehicleFinancesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const userRole = useAuthStore((state) => state.userRole);
  const isAdmin = userRole === 'admin';

  // Get vehicle ID from URL params
  const selectedVehicleId = searchParams.get('vehicleId');

  // Date range state
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState<Date>(() => new Date());

  // Form state
  const [showForm, setShowForm] = useState<FormType>(null);
  const [editingIncome, setEditingIncome] = useState<VehicleIncome | null>(null);
  const [editingExpense, setEditingExpense] = useState<VehicleExpense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch vehicles - use different hooks based on role
  const driverVehiclesHook = useDriverVehicles(user?.id);
  const allVehiclesHook = useAllVehicles();
  const vehicles = isAdmin ? allVehiclesHook.vehicles : driverVehiclesHook.vehicles;
  const vehiclesLoading = isAdmin ? allVehiclesHook.isLoading : driverVehiclesHook.isLoading;

  // Get the first vehicle if none selected
  const effectiveVehicleId = selectedVehicleId || (vehicles.length > 0 ? vehicles[0].id : undefined);

  // Get owner ID from selected vehicle (for admin), or use current user
  const selectedVehicle = vehicles.find((v) => v.id === effectiveVehicleId);
  const effectiveOwnerId = isAdmin && selectedVehicle
    ? (selectedVehicle.owner_id || selectedVehicle.driver_id)
    : user?.id;

  // Fetch finances for selected vehicle
  const {
    income,
    expenses,
    summary,
    isLoading: financesLoading,
    error,
    refetch,
    addIncome,
    updateIncome,
    deleteIncome,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useVehicleFinances(effectiveOwnerId, effectiveVehicleId, { startDate, endDate });

  // Handle vehicle selection
  const handleVehicleChange = (vehicleId: string) => {
    setSearchParams({ vehicleId });
  };

  // Quick date range presets
  const setDatePreset = (preset: 'week' | 'month' | 'quarter' | 'year') => {
    const end = new Date();
    const start = new Date();

    switch (preset) {
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(end.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
    }

    setStartDate(start);
    setEndDate(end);
  };

  // Income handlers
  const handleAddIncome = async (data: VehicleIncomeCreateInput) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      // Auto-populate driver_name only for non-admin users (they are the drivers)
      // For admins, leave it empty since they're recording on behalf of drivers
      const incomeData: VehicleIncomeCreateInput = {
        ...data,
        driver_name: !isAdmin ? (data.driver_name || user?.full_name || undefined) : undefined,
      };
      console.log('[VehicleFinancesPage] Adding income:', { incomeData, effectiveOwnerId, effectiveVehicleId });
      const result = await addIncome(incomeData);
      console.log('[VehicleFinancesPage] Add income result:', result);
      if (result.success) {
        setShowForm(null);
        setEditingIncome(null);
      } else {
        setFormError(result.error || 'Error al guardar el ingreso');
      }
    } catch (err) {
      console.error('[VehicleFinancesPage] Error adding income:', err);
      setFormError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditIncome = (incomeItem: VehicleIncome) => {
    setEditingIncome(incomeItem);
    setShowForm('income');
  };

  const handleUpdateIncome = async (data: VehicleIncomeCreateInput) => {
    if (!editingIncome) return;
    setIsSubmitting(true);
    try {
      await updateIncome(editingIncome.id, data);
      setShowForm(null);
      setEditingIncome(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteIncome = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este ingreso?')) {
      await deleteIncome(id);
    }
  };

  // Expense handlers
  const handleAddExpense = async (data: VehicleExpenseCreateInput) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      console.log('[VehicleFinancesPage] Adding expense:', { data, effectiveOwnerId, effectiveVehicleId });
      const result = await addExpense(data);
      console.log('[VehicleFinancesPage] Add expense result:', result);
      if (result.success) {
        setShowForm(null);
        setEditingExpense(null);
      } else {
        setFormError(result.error || 'Error al guardar el gasto');
      }
    } catch (err) {
      console.error('[VehicleFinancesPage] Error adding expense:', err);
      setFormError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditExpense = (expenseItem: VehicleExpense) => {
    setEditingExpense(expenseItem);
    setShowForm('expense');
  };

  const handleUpdateExpense = async (data: VehicleExpenseCreateInput) => {
    if (!editingExpense) return;
    setIsSubmitting(true);
    try {
      await updateExpense(editingExpense.id, data);
      setShowForm(null);
      setEditingExpense(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este gasto?')) {
      await deleteExpense(id);
    }
  };

  // Close form handler
  const handleCloseForm = () => {
    setShowForm(null);
    setEditingIncome(null);
    setEditingExpense(null);
    setFormError(null);
  };

  const isLoading = vehiclesLoading || financesLoading;

  return (
    <DashboardLayout>
      <div className="finances-page">
        <header className="page-header">
          <div className="page-header-content">
            <h1 className="page-title">Finanzas del Vehículo</h1>
            <p className="page-subtitle">Control de ingresos y gastos por vehículo</p>
          </div>
          <div className="page-header-actions">
            <button type="button" className="btn btn-outline" onClick={refetch}>
              <span>🔄</span> Actualizar
            </button>
            <button
              type="button"
              className="btn btn-success"
              onClick={() => setShowForm('income')}
              disabled={!effectiveVehicleId}
            >
              <span>+</span> Agregar Ingreso
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setShowForm('expense')}
              disabled={!effectiveVehicleId}
            >
              <span>+</span> Agregar Gasto
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className="filters-bar">
          {/* Vehicle Selector */}
          <div className="filter-group">
            <label htmlFor="vehicle-select">Vehículo:</label>
            <select
              id="vehicle-select"
              value={effectiveVehicleId || ''}
              onChange={(e) => handleVehicleChange(e.target.value)}
              disabled={vehiclesLoading || vehicles.length === 0}
            >
              {vehicles.length === 0 ? (
                <option value="">No hay vehículos</option>
              ) : (
                vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate} - {v.brand} {v.model}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Date Range */}
          <div className="filter-group">
            <label htmlFor="start-date">Desde:</label>
            <input
              id="start-date"
              type="date"
              value={startDate.toISOString().split('T')[0]}
              onChange={(e) => setStartDate(new Date(e.target.value))}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="end-date">Hasta:</label>
            <input
              id="end-date"
              type="date"
              value={endDate.toISOString().split('T')[0]}
              onChange={(e) => setEndDate(new Date(e.target.value))}
            />
          </div>

          {/* Date Presets */}
          <div className="date-presets">
            <button
              type="button"
              className="btn-preset"
              onClick={() => setDatePreset('week')}
            >
              7 días
            </button>
            <button
              type="button"
              className="btn-preset"
              onClick={() => setDatePreset('month')}
            >
              30 días
            </button>
            <button
              type="button"
              className="btn-preset"
              onClick={() => setDatePreset('quarter')}
            >
              3 meses
            </button>
            <button
              type="button"
              className="btn-preset"
              onClick={() => setDatePreset('year')}
            >
              1 año
            </button>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <span className="error-icon">!</span>
            <span>{error}</span>
            <button type="button" className="btn-retry" onClick={refetch}>
              Reintentar
            </button>
          </div>
        )}

        {/* P/L Summary Cards */}
        {summary && <PLSummaryCards summary={summary} />}

        {/* Transactions Table */}
        <TransactionsTable
          income={income}
          expenses={expenses}
          isLoading={isLoading}
          onEditIncome={handleEditIncome}
          onDeleteIncome={handleDeleteIncome}
          onEditExpense={handleEditExpense}
          onDeleteExpense={handleDeleteExpense}
          onAddIncome={() => setShowForm('income')}
          onAddExpense={() => setShowForm('expense')}
        />

        {/* Income Form Modal */}
        {showForm === 'income' && (
          <div className="modal-overlay" onClick={handleCloseForm}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <IncomeForm
                income={editingIncome || undefined}
                onSubmit={editingIncome ? handleUpdateIncome : handleAddIncome}
                onCancel={handleCloseForm}
                isSubmitting={isSubmitting}
                error={formError}
              />
            </div>
          </div>
        )}

        {/* Expense Form Modal */}
        {showForm === 'expense' && (
          <div className="modal-overlay" onClick={handleCloseForm}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <ExpenseForm
                expense={editingExpense || undefined}
                onSubmit={editingExpense ? handleUpdateExpense : handleAddExpense}
                onCancel={handleCloseForm}
                isSubmitting={isSubmitting}
                error={formError}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
