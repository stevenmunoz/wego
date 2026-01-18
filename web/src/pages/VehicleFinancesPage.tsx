/**
 * Vehicle Finances page - P/L tracking for vehicles
 */

import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/core/store/auth-store';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PLSummaryCards } from '@/components/VehicleFinances/PLSummaryCards';
import { TransactionsTable } from '@/components/VehicleFinances/TransactionsTable';
import { IncomeForm } from '@/components/VehicleFinances/IncomeForm';
import { ExpenseForm } from '@/components/VehicleFinances/ExpenseForm';
import {
  DateRangePicker,
  getStartOfDay,
  getEndOfDay,
} from '@/components/DateRangePicker';
import type { DateRange, DatePreset } from '@/components/DateRangePicker';
import { useDriverVehicles } from '@/hooks/useDriverVehicles';
import { useAllVehicles } from '@/hooks/useAllVehicles';
import { useVehicleFinances } from '@/hooks/useVehicleFinances';
import { uploadExpenseReceipt, uploadIncomeReceipt } from '@/core/firebase';
import type {
  VehicleIncomeCreateInput,
  VehicleExpenseCreateInput,
  VehicleIncome,
  VehicleExpense,
} from '@/core/types';
import './VehicleFinancesPage.css';

// Custom presets for vehicle finances
const financePresets: DatePreset[] = [
  {
    id: 'last7days',
    label: 'Últimos 7 días',
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      return { startDate: getStartOfDay(start), endDate: getEndOfDay(end) };
    },
  },
  {
    id: 'last30days',
    label: 'Últimos 30 días',
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      return { startDate: getStartOfDay(start), endDate: getEndOfDay(end) };
    },
  },
  {
    id: 'last3months',
    label: 'Últimos 3 meses',
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 3);
      return { startDate: getStartOfDay(start), endDate: getEndOfDay(end) };
    },
  },
  {
    id: 'last12months',
    label: 'Último año',
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setFullYear(start.getFullYear() - 1);
      return { startDate: getStartOfDay(start), endDate: getEndOfDay(end) };
    },
  },
  {
    id: 'thisMonth',
    label: 'Este mes',
    getRange: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: getStartOfDay(start), endDate: getEndOfDay(end) };
    },
  },
  {
    id: 'lastMonth',
    label: 'Mes anterior',
    getRange: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: getStartOfDay(start), endDate: getEndOfDay(end) };
    },
  },
];

type FormType = 'income' | 'expense' | null;

export const VehicleFinancesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const userRole = useAuthStore((state) => state.userRole);
  const isAdmin = userRole === 'admin';

  // Get vehicle ID from URL params
  const selectedVehicleId = searchParams.get('vehicleId');

  // Date range state - default to last 30 days
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return { startDate: getStartOfDay(start), endDate: getEndOfDay(end) };
  });

  // Extract start/end for hook compatibility
  const startDate = useMemo(() => dateRange.startDate, [dateRange]);
  const endDate = useMemo(() => dateRange.endDate, [dateRange]);

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
  const effectiveVehicleId =
    selectedVehicleId || (vehicles.length > 0 ? vehicles[0].id : undefined);

  // Get owner ID from selected vehicle (for admin), or use current user
  const selectedVehicle = vehicles.find((v) => v.id === effectiveVehicleId);
  const effectiveOwnerId = isAdmin && selectedVehicle ? selectedVehicle.owner_id : user?.id;

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

  // Income handlers
  const handleAddIncome = async (data: VehicleIncomeCreateInput) => {
    if (!effectiveOwnerId || !effectiveVehicleId) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      // Extract receipt file from data
      const { receipt_file, ...incomeDataWithoutFile } = data;

      // Upload receipt if provided
      let receiptUrl: string | undefined;
      if (receipt_file) {
        console.log('[VehicleFinancesPage] Uploading income receipt...');
        const uploadResult = await uploadIncomeReceipt(effectiveVehicleId, receipt_file);
        if (uploadResult.success && uploadResult.url) {
          receiptUrl = uploadResult.url;
          console.log('[VehicleFinancesPage] Income receipt uploaded:', receiptUrl);
        } else {
          console.error('[VehicleFinancesPage] Income receipt upload failed:', uploadResult.error);
          // Continue without receipt if upload fails
        }
      }

      // Auto-populate driver_name only for non-admin users (they are the drivers)
      // For admins, leave it empty since they're recording on behalf of drivers
      const incomeData: VehicleIncomeCreateInput = {
        ...incomeDataWithoutFile,
        driver_name: !isAdmin ? data.driver_name || user?.full_name || undefined : undefined,
        ...(receiptUrl && { receipt_url: receiptUrl }),
      };
      console.log('[VehicleFinancesPage] Adding income:', {
        incomeData,
        effectiveOwnerId,
        effectiveVehicleId,
      });
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
    if (!editingIncome || !effectiveVehicleId) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      // Extract receipt file from data
      const { receipt_file, ...incomeData } = data;

      // Upload receipt if new file provided
      let receiptUrl: string | undefined;
      if (receipt_file) {
        console.log('[VehicleFinancesPage] Uploading income receipt...');
        const uploadResult = await uploadIncomeReceipt(effectiveVehicleId, receipt_file);
        if (uploadResult.success && uploadResult.url) {
          receiptUrl = uploadResult.url;
          console.log('[VehicleFinancesPage] Income receipt uploaded:', receiptUrl);
        }
      }

      // Update income with receipt URL if available
      const finalIncomeData = {
        ...incomeData,
        ...(receiptUrl && { receipt_url: receiptUrl }),
      };

      await updateIncome(editingIncome.id, finalIncomeData);
      setShowForm(null);
      setEditingIncome(null);
    } catch (err) {
      console.error('[VehicleFinancesPage] Error updating income:', err);
      setFormError(err instanceof Error ? err.message : 'Error inesperado');
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
    if (!effectiveOwnerId || !effectiveVehicleId) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      // Extract receipt file from data
      const { receipt_file, ...expenseData } = data;

      // Upload receipt if provided (now uses vehicleId only)
      let receiptUrl: string | undefined;
      if (receipt_file) {
        console.log('[VehicleFinancesPage] Uploading receipt...');
        const uploadResult = await uploadExpenseReceipt(effectiveVehicleId, receipt_file);
        if (uploadResult.success && uploadResult.url) {
          receiptUrl = uploadResult.url;
          console.log('[VehicleFinancesPage] Receipt uploaded:', receiptUrl);
        } else {
          console.error('[VehicleFinancesPage] Receipt upload failed:', uploadResult.error);
          // Continue without receipt if upload fails
        }
      }

      // Create expense with receipt URL if available
      const finalExpenseData = {
        ...expenseData,
        ...(receiptUrl && { receipt_url: receiptUrl }),
      };

      console.log('[VehicleFinancesPage] Adding expense:', {
        finalExpenseData,
        effectiveOwnerId,
        effectiveVehicleId,
      });
      const result = await addExpense(finalExpenseData);
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
    if (!editingExpense || !effectiveOwnerId || !effectiveVehicleId) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      // Extract receipt file from data
      const { receipt_file, ...expenseData } = data;

      // Upload receipt if new file provided (now uses vehicleId only)
      let receiptUrl: string | undefined;
      if (receipt_file) {
        console.log('[VehicleFinancesPage] Uploading receipt...');
        const uploadResult = await uploadExpenseReceipt(effectiveVehicleId, receipt_file);
        if (uploadResult.success && uploadResult.url) {
          receiptUrl = uploadResult.url;
          console.log('[VehicleFinancesPage] Receipt uploaded:', receiptUrl);
        }
      }

      // Update expense with receipt URL if available
      const finalExpenseData = {
        ...expenseData,
        ...(receiptUrl && { receipt_url: receiptUrl }),
      };

      await updateExpense(editingExpense.id, finalExpenseData);
      setShowForm(null);
      setEditingExpense(null);
    } catch (err) {
      console.error('[VehicleFinancesPage] Error updating expense:', err);
      setFormError(err instanceof Error ? err.message : 'Error inesperado');
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
          <div className="page-header-top">
            <div className="page-header-title">
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

          {/* Date Range Picker */}
          <div className="filter-group">
            <label>Período:</label>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              presets={financePresets}
            />
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
