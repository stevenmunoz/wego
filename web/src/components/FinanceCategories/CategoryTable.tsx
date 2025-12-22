/**
 * Category Table Component
 *
 * Displays finance categories in a table with edit/toggle actions
 */

import { type FC } from 'react';
import type { FinanceCategory } from '@/core/types/finance-category.types';
import './CategoryTable.css';

interface CategoryTableProps {
  categories: FinanceCategory[];
  onEdit: (category: FinanceCategory) => void;
  onToggleActive: (categoryId: string, isActive: boolean) => void;
  isLoading: boolean;
}

export const CategoryTable: FC<CategoryTableProps> = ({
  categories,
  onEdit,
  onToggleActive,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="category-table-loading">
        <div className="spinner"></div>
        <p>Cargando categorías...</p>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="category-table-empty">
        <div className="empty-icon">📁</div>
        <h3>No hay categorías</h3>
        <p>Usa el botón "Agregar" para crear una nueva categoría</p>
      </div>
    );
  }

  return (
    <div className="category-table-wrapper">
      <table className="category-table">
        <thead>
          <tr>
            <th className="th-color">Color</th>
            <th className="th-label">Etiqueta</th>
            <th className="th-key">Clave</th>
            <th className="th-order">Orden</th>
            <th className="th-status">Estado</th>
            <th className="th-actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id} className={!category.is_active ? 'inactive' : ''}>
              <td className="cell-color">
                <span
                  className="color-swatch"
                  style={{ backgroundColor: category.color }}
                  title={category.color}
                />
              </td>
              <td className="cell-label">{category.label}</td>
              <td className="cell-key">
                <code>{category.key}</code>
              </td>
              <td className="cell-order">{category.sort_order}</td>
              <td className="cell-status">
                <button
                  type="button"
                  className={`status-toggle ${category.is_active ? 'active' : 'inactive'}`}
                  onClick={() => onToggleActive(category.id, !category.is_active)}
                  title={category.is_active ? 'Desactivar' : 'Activar'}
                >
                  {category.is_active ? 'Activo' : 'Inactivo'}
                </button>
              </td>
              <td className="cell-actions">
                <button
                  type="button"
                  className="btn-action btn-edit"
                  onClick={() => onEdit(category)}
                  title="Editar"
                >
                  ✎
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
