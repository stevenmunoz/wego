/**
 * Tests for ExpenseForm Component
 *
 * Tests the expense form including receipt upload functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@/tests/test-utils';
import userEvent from '@testing-library/user-event';
import type { VehicleExpense } from '@/core/types';

// Mock the finance categories hook
vi.mock('@/hooks/useFinanceCategories', () => ({
  useExpenseCategories: () => ({
    activeCategories: [
      { key: 'fuel', label: 'Combustible' },
      { key: 'maintenance', label: 'Mantenimiento' },
    ],
    labels: {
      fuel: 'Combustible',
      maintenance: 'Mantenimiento',
    },
    isLoading: false,
  }),
  useExpenseCategoryKeys: () => ['fuel', 'maintenance'],
}));

// Import after mocking
import { ExpenseForm } from '@/components/VehicleFinances/ExpenseForm';

// Helper to create a mock File
function createMockFile(name: string, type: string, size: number = 1024): File {
  const content = new Array(size).fill('a').join('');
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
}

// Helper to create mock expense data
function createMockExpense(overrides: Partial<VehicleExpense> = {}): VehicleExpense {
  return {
    id: 'expense-123',
    vehicle_id: 'vehicle-456',
    owner_id: 'owner-789',
    category: 'fuel',
    amount: 80000,
    description: 'Tanqueo gasolina',
    date: new Date('2024-12-15'),
    is_recurring: false,
    created_at: new Date('2024-12-15'),
    updated_at: new Date('2024-12-15'),
    ...overrides,
  };
}

describe('ExpenseForm Component', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Receipt Upload Section', () => {
    it('should render the receipt upload section', () => {
      render(<ExpenseForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByText('Comprobante')).toBeInTheDocument();
      expect(screen.getByText(/Recibo o factura/i)).toBeInTheDocument();
      expect(screen.getByText(/Subir comprobante/i)).toBeInTheDocument();
    });

    it('should show upload button when no receipt exists (new expense)', () => {
      render(<ExpenseForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const uploadButton = screen.getByText(/Subir comprobante/i);
      expect(uploadButton).toBeInTheDocument();
      expect(uploadButton.tagName).toBe('BUTTON');
    });

    it('should show existing receipt info when editing expense with receipt', () => {
      const expenseWithReceipt = createMockExpense({
        receipt_url: 'https://storage.example.com/expense-receipt.jpg',
      });

      render(
        <ExpenseForm expense={expenseWithReceipt} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(screen.getByText('✓ Recibo cargado')).toBeInTheDocument();
      expect(screen.getByText('Ver actual')).toBeInTheDocument();
      expect(screen.getByText('Reemplazar')).toBeInTheDocument();
    });

    it('should have a link to view the existing receipt', () => {
      const receiptUrl = 'https://storage.example.com/expense-receipt.pdf';
      const expenseWithReceipt = createMockExpense({ receipt_url: receiptUrl });

      render(
        <ExpenseForm expense={expenseWithReceipt} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const viewLink = screen.getByText('Ver actual');
      expect(viewLink).toHaveAttribute('href', receiptUrl);
      expect(viewLink).toHaveAttribute('target', '_blank');
      expect(viewLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should not show receipt info when editing expense without receipt', () => {
      const expenseWithoutReceipt = createMockExpense({ receipt_url: undefined });

      render(
        <ExpenseForm
          expense={expenseWithoutReceipt}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText('✓ Recibo cargado')).not.toBeInTheDocument();
      expect(screen.queryByText('Ver actual')).not.toBeInTheDocument();
      expect(screen.getByText(/Subir comprobante/i)).toBeInTheDocument();
    });

    it('should show selected file name after file selection', async () => {
      const user = userEvent.setup();

      render(<ExpenseForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const fileInput = screen.getByLabelText(/Subir comprobante/i);
      const mockFile = createMockFile('expense-receipt.jpg', 'image/jpeg');

      await user.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(screen.getByText(/expense-receipt.jpg/i)).toBeInTheDocument();
      });
    });

    it('should accept PDF files', async () => {
      const user = userEvent.setup();

      render(<ExpenseForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const fileInput = screen.getByLabelText(/Subir comprobante/i);
      const pdfFile = createMockFile('factura.pdf', 'application/pdf');

      await user.upload(fileInput, pdfFile);

      await waitFor(() => {
        expect(screen.getByText(/factura.pdf/i)).toBeInTheDocument();
      });
      expect(screen.queryByText(/Tipo de archivo no permitido/i)).not.toBeInTheDocument();
    });

    it('should accept PNG files', async () => {
      const user = userEvent.setup();

      render(<ExpenseForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const fileInput = screen.getByLabelText(/Subir comprobante/i);
      const pngFile = createMockFile('receipt.png', 'image/png');

      await user.upload(fileInput, pngFile);

      await waitFor(() => {
        expect(screen.getByText(/receipt.png/i)).toBeInTheDocument();
      });
    });

    it('should accept WebP files', async () => {
      const user = userEvent.setup();

      render(<ExpenseForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const fileInput = screen.getByLabelText(/Subir comprobante/i);
      const webpFile = createMockFile('receipt.webp', 'image/webp');

      await user.upload(fileInput, webpFile);

      await waitFor(() => {
        expect(screen.getByText(/receipt.webp/i)).toBeInTheDocument();
      });
    });

    it('should allow removing selected file', async () => {
      const user = userEvent.setup();

      render(<ExpenseForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const fileInput = screen.getByLabelText(/Subir comprobante/i);
      const mockFile = createMockFile('receipt.jpg', 'image/jpeg');

      await user.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(screen.getByText(/receipt.jpg/i)).toBeInTheDocument();
      });

      // Find and click the remove button
      const removeButton = screen.getByTitle('Eliminar');
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText(/receipt.jpg/i)).not.toBeInTheDocument();
        expect(screen.getByText(/Subir comprobante/i)).toBeInTheDocument();
      });
    });

    it('should include receipt file in form submission', async () => {
      const user = userEvent.setup();

      render(<ExpenseForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Fill required fields
      await user.clear(screen.getByLabelText(/Monto/i));
      await user.type(screen.getByLabelText(/Monto/i), '80000');
      await user.type(screen.getByLabelText(/Descripción/i), 'Test expense');

      // Upload receipt
      const fileInput = screen.getByLabelText(/Subir comprobante/i);
      const mockFile = createMockFile('factura.pdf', 'application/pdf');
      await user.upload(fileInput, mockFile);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Agregar Gasto/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            receipt_file: expect.any(File),
          })
        );
      });
    });

    it('should allow replacing existing receipt with new file', async () => {
      const user = userEvent.setup();
      const expenseWithReceipt = createMockExpense({
        receipt_url: 'https://storage.example.com/old-receipt.jpg',
      });

      render(
        <ExpenseForm expense={expenseWithReceipt} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Verify existing receipt is shown
      expect(screen.getByText('✓ Recibo cargado')).toBeInTheDocument();
      expect(screen.getByText('Reemplazar')).toBeInTheDocument();

      // Get the hidden file input and upload directly
      const fileInput = screen.getByLabelText(/Subir comprobante/i);
      const newFile = createMockFile('new-receipt.jpg', 'image/jpeg');

      await user.upload(fileInput, newFile);

      await waitFor(() => {
        expect(screen.getByText(/new-receipt.jpg/i)).toBeInTheDocument();
        expect(screen.queryByText('✓ Recibo cargado')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Rendering', () => {
    it('should render the form with all required fields', () => {
      render(<ExpenseForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Title appears in header
      expect(screen.getByRole('heading', { name: 'Agregar Gasto' })).toBeInTheDocument();
      expect(screen.getByLabelText(/Categoría/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Monto/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Fecha/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Descripción/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Proveedor/i)).toBeInTheDocument();
    });

    it('should show "Editar Gasto" title when editing', () => {
      const expense = createMockExpense();

      render(<ExpenseForm expense={expense} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByRole('heading', { name: 'Editar Gasto' })).toBeInTheDocument();
    });

    it('should populate form fields when editing', () => {
      const expense = createMockExpense({
        amount: 150000,
        description: 'Cambio de aceite',
        vendor: 'Taller ABC',
      });

      render(<ExpenseForm expense={expense} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByLabelText(/Monto/i)).toHaveValue(150000);
      expect(screen.getByLabelText(/Descripción/i)).toHaveValue('Cambio de aceite');
      expect(screen.getByLabelText(/Proveedor/i)).toHaveValue('Taller ABC');
    });
  });

  describe('Form Actions', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(<ExpenseForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await user.click(screen.getByText('Cancelar'));

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should show "Guardando..." and disable button while submitting', () => {
      render(<ExpenseForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={true} />);

      const submitButton = screen.getByText('Guardando...');
      expect(submitButton).toBeDisabled();
    });

    it('should display error message when provided', () => {
      render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          error="Error al guardar el gasto"
        />
      );

      expect(screen.getByText('Error al guardar el gasto')).toBeInTheDocument();
    });

    it('should show "Guardar Cambios" button when editing', () => {
      const expense = createMockExpense();

      render(<ExpenseForm expense={expense} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByText('Guardar Cambios')).toBeInTheDocument();
    });
  });

  describe('Recurrence Section', () => {
    it('should have recurrence checkbox', () => {
      render(<ExpenseForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByText('Recurrencia')).toBeInTheDocument();
      expect(screen.getByText(/Este gasto es recurrente/i)).toBeInTheDocument();
    });

    it('should show frequency selector when recurrence is enabled', async () => {
      const user = userEvent.setup();

      render(<ExpenseForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      await waitFor(() => {
        expect(screen.getByLabelText(/Frecuencia/i)).toBeInTheDocument();
      });
    });
  });
});
