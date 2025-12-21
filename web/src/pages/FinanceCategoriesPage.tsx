/**
 * Finance Categories Management Page - Admin only
 *
 * Allows admins to manage expense categories and income types
 */

import { useState, type FC } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/core/store/auth-store';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CategoryForm, CategoryTable } from '@/components/FinanceCategories';
import { useFinanceCategories } from '@/hooks/useFinanceCategories';
import {
  createFinanceCategory,
  updateFinanceCategory,
  toggleCategoryActive,
  seedDefaultCategories,
} from '@/core/firebase/finance-categories';
import type {
  FinanceCategory,
  FinanceCategoryType,
  FinanceCategoryCreateInput,
} from '@/core/types/finance-category.types';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_TYPES,
} from '@/core/types/finance-category.types';
import './FinanceCategoriesPage.css';

type TabType = 'expense' | 'income';

export const FinanceCategoriesPage: FC = () => {
  const userRole = useAuthStore((state) => state.userRole);
  const isAdmin = userRole === 'admin';

  const [activeTab, setActiveTab] = useState<TabType>('expense');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FinanceCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const {
    expenseCategories,
    incomeCategories,
    isLoading,
    error,
    refreshCategories,
  } = useFinanceCategories();

  // Redirect non-admins
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const currentCategories = activeTab === 'expense' ? expenseCategories : incomeCategories;

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (category: FinanceCategory) => {
    setEditingCategory(category);
    setFormError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormError(null);
  };

  const handleSubmit = async (data: {
    key: string;
    label: string;
    color: string;
    sort_order: number;
    is_active: boolean;
  }) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingCategory) {
        // Update existing
        const result = await updateFinanceCategory(editingCategory.id, {
          label: data.label,
          color: data.color,
          sort_order: data.sort_order,
          is_active: data.is_active,
        });

        if (!result.success) {
          setFormError(result.error || 'Error al actualizar categoría');
          return;
        }
      } else {
        // Create new
        const input: FinanceCategoryCreateInput = {
          category_type: activeTab as FinanceCategoryType,
          key: data.key,
          label: data.label,
          color: data.color,
          sort_order: data.sort_order,
          is_active: data.is_active,
        };

        const result = await createFinanceCategory(input);

        if (!result.success) {
          setFormError(result.error || 'Error al crear categoría');
          return;
        }
      }

      // Refresh categories and close modal
      await refreshCategories();
      handleCloseModal();
    } catch (err) {
      console.error('Error saving category:', err);
      setFormError('Error inesperado al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (categoryId: string, isActive: boolean) => {
    const result = await toggleCategoryActive(categoryId, isActive);
    if (result.success) {
      await refreshCategories();
    } else {
      console.error('Error toggling category:', result.error);
    }
  };

  const handleSeedDefaults = async () => {
    if (isSeeding) return;

    setIsSeeding(true);
    setSeedResult(null);

    try {
      // Seed expense categories
      const expenseDefaults = DEFAULT_EXPENSE_CATEGORIES.map((c) => ({
        ...c,
        category_type: 'expense' as const,
      }));
      const expenseResult = await seedDefaultCategories(expenseDefaults);

      // Seed income types
      const incomeDefaults = DEFAULT_INCOME_TYPES.map((c) => ({
        ...c,
        category_type: 'income' as const,
      }));
      const incomeResult = await seedDefaultCategories(incomeDefaults);

      const totalCreated = expenseResult.created + incomeResult.created;
      const totalSkipped = expenseResult.skipped + incomeResult.skipped;
      const totalErrors = [...expenseResult.errors, ...incomeResult.errors];

      if (totalErrors.length > 0) {
        setSeedResult(`Creadas: ${totalCreated}, Existentes: ${totalSkipped}, Errores: ${totalErrors.length}`);
      } else if (totalCreated === 0) {
        setSeedResult('Todas las categorías ya existen');
      } else {
        setSeedResult(`${totalCreated} categorías creadas exitosamente`);
      }

      await refreshCategories();
    } catch (err) {
      console.error('Error seeding categories:', err);
      setSeedResult('Error al crear categorías por defecto');
    } finally {
      setIsSeeding(false);
      // Clear result after 5 seconds
      setTimeout(() => setSeedResult(null), 5000);
    }
  };

  return (
    <DashboardLayout>
      <div className="finance-categories-page">
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <h1>Categorías de Finanzas</h1>
            <p className="subtitle">Administra las categorías de gastos e ingresos</p>
          </div>
          <div className="header-actions">
            {currentCategories.length === 0 && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleSeedDefaults}
                disabled={isSeeding}
              >
                {isSeeding ? 'Creando...' : 'Crear por defecto'}
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={handleOpenCreate}>
              + Agregar categoría
            </button>
          </div>
        </div>

        {/* Seed result message */}
        {seedResult && (
          <div className="seed-result-message">
            {seedResult}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="error-banner">
            <span className="error-icon">!</span>
            <span>{error}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs-container">
          <div className="tabs">
            <button
              type="button"
              className={`tab ${activeTab === 'expense' ? 'active' : ''}`}
              onClick={() => setActiveTab('expense')}
            >
              Categorías de Gastos ({expenseCategories.length})
            </button>
            <button
              type="button"
              className={`tab ${activeTab === 'income' ? 'active' : ''}`}
              onClick={() => setActiveTab('income')}
            >
              Tipos de Ingreso ({incomeCategories.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="page-content">
          <CategoryTable
            categories={currentCategories}
            onEdit={handleOpenEdit}
            onToggleActive={handleToggleActive}
            isLoading={isLoading}
          />
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <CategoryForm
                category={editingCategory || undefined}
                categoryType={activeTab as FinanceCategoryType}
                onSubmit={handleSubmit}
                onCancel={handleCloseModal}
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
