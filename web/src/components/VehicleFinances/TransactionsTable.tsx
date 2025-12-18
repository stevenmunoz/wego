/**
 * Transactions Table Component
 *
 * Displays combined income and expenses in a table format
 */

import { type FC, useState, useMemo } from 'react';
import type { VehicleIncome, VehicleExpense } from '@/core/types';
import { INCOME_TYPE_LABELS, EXPENSE_CATEGORY_LABELS } from '@/core/types';
import './TransactionsTable.css';

interface TransactionsTableProps {
  income: VehicleIncome[];
  expenses: VehicleExpense[];
  isLoading: boolean;
  onEditIncome?: (income: VehicleIncome) => void;
  onDeleteIncome?: (id: string) => void;
  onEditExpense?: (expense: VehicleExpense) => void;
  onDeleteExpense?: (id: string) => void;
}

type TransactionType = 'all' | 'income' | 'expense';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  date: Date;
  category: string;
  description: string;
  amount: number;
  isRecurring: boolean;
  original: VehicleIncome | VehicleExpense;
}

// Currency formatting for Colombian locale
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Date formatting
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const TransactionsTable: FC<TransactionsTableProps> = ({
  income,
  expenses,
  isLoading,
  onEditIncome,
  onDeleteIncome,
  onEditExpense,
  onDeleteExpense,
}) => {
  const [filter, setFilter] = useState<TransactionType>('all');

  // Combine and sort transactions
  const transactions = useMemo(() => {
    const incomeTransactions: Transaction[] = income.map((i) => ({
      id: i.id,
      type: 'income' as const,
      date: i.date,
      category: INCOME_TYPE_LABELS[i.type],
      description: i.description,
      amount: i.amount,
      isRecurring: i.is_recurring,
      original: i,
    }));

    const expenseTransactions: Transaction[] = expenses.map((e) => ({
      id: e.id,
      type: 'expense' as const,
      date: e.date,
      category: EXPENSE_CATEGORY_LABELS[e.category],
      description: e.description,
      amount: e.amount,
      isRecurring: e.is_recurring,
      original: e,
    }));

    let combined = [...incomeTransactions, ...expenseTransactions];

    // Apply filter
    if (filter === 'income') {
      combined = incomeTransactions;
    } else if (filter === 'expense') {
      combined = expenseTransactions;
    }

    // Sort by date descending
    return combined.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [income, expenses, filter]);

  const handleEdit = (transaction: Transaction) => {
    if (transaction.type === 'income' && onEditIncome) {
      onEditIncome(transaction.original as VehicleIncome);
    } else if (transaction.type === 'expense' && onEditExpense) {
      onEditExpense(transaction.original as VehicleExpense);
    }
  };

  const handleDelete = (transaction: Transaction) => {
    if (transaction.type === 'income' && onDeleteIncome) {
      onDeleteIncome(transaction.id);
    } else if (transaction.type === 'expense' && onDeleteExpense) {
      onDeleteExpense(transaction.id);
    }
  };

  if (isLoading) {
    return (
      <div className="transactions-table-loading">
        <div className="spinner"></div>
        <p>Cargando transacciones...</p>
      </div>
    );
  }

  if (transactions.length === 0 && filter === 'all') {
    return (
      <div className="transactions-table-empty">
        <div className="empty-icon">💰</div>
        <h3>No hay transacciones registradas</h3>
        <p>Usa los botones de arriba para agregar un ingreso o gasto</p>
      </div>
    );
  }

  return (
    <div className="transactions-table-container">
      {/* Filter Tabs */}
      <div className="table-header">
        <div className="filter-tabs">
          <button
            type="button"
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todos ({income.length + expenses.length})
          </button>
          <button
            type="button"
            className={`filter-tab tab-income ${filter === 'income' ? 'active' : ''}`}
            onClick={() => setFilter('income')}
          >
            Ingresos ({income.length})
          </button>
          <button
            type="button"
            className={`filter-tab tab-expense ${filter === 'expense' ? 'active' : ''}`}
            onClick={() => setFilter('expense')}
          >
            Gastos ({expenses.length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th className="th-amount">Monto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={`${transaction.type}-${transaction.id}`}>
                <td className="cell-date">
                  <span className="date-value">{formatDate(transaction.date)}</span>
                </td>
                <td className="cell-type">
                  <span className={`type-badge type-${transaction.type}`}>
                    {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                  </span>
                </td>
                <td className="cell-category">
                  {transaction.category}
                  {transaction.isRecurring && (
                    <span className="recurring-badge" title="Recurrente">🔄</span>
                  )}
                </td>
                <td className="cell-description">{transaction.description}</td>
                <td className={`cell-amount amount-${transaction.type}`}>
                  {transaction.type === 'expense' ? '-' : '+'}
                  {formatCurrency(transaction.amount)}
                </td>
                <td className="cell-actions">
                  <button
                    type="button"
                    className="btn-action btn-edit"
                    onClick={() => handleEdit(transaction)}
                    title="Editar"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="btn-action btn-delete"
                    onClick={() => handleDelete(transaction)}
                    title="Eliminar"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {transactions.length === 0 && filter !== 'all' && (
        <div className="no-results">
          <p>
            No hay {filter === 'income' ? 'ingresos' : 'gastos'} registrados en este período
          </p>
        </div>
      )}
    </div>
  );
};
