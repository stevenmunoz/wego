/**
 * Tests for IncomeForm Component
 *
 * Tests the income form including receipt upload functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@/tests/test-utils';
import userEvent from '@testing-library/user-event';
import type { VehicleIncome } from '@/core/types';

// Mock the finance categories hook
vi.mock('@/hooks/useFinanceCategories', () => ({
  useIncomeCategories: () => ({
    activeCategories: [
      { key: 'weekly_payment', label: 'Pago Semanal' },
      { key: 'bonus', label: 'Bonificación' },
    ],
    labels: {
      weekly_payment: 'Pago Semanal',
      bonus: 'Bonificación',
    },
    isLoading: false,
  }),
  useIncomeCategoryKeys: () => ['weekly_payment', 'bonus'],
}));

// Import after mocking
import { IncomeForm } from '@/components/VehicleFinances/IncomeForm';

// Helper to create a mock File
function createMockFile(
  name: string,
  type: string,
  size: number = 1024
): File {
  const content = new Array(size).fill('a').join('');
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
}

// Helper to create mock income data
function createMockIncome(overrides: Partial<VehicleIncome> = {}): VehicleIncome {
  return {
    id: 'income-123',
    vehicle_id: 'vehicle-456',
    owner_id: 'owner-789',
    type: 'weekly_payment',
    amount: 350000,
    description: 'Pago semanal semana 50',
    date: new Date('2024-12-15'),
    is_recurring: false,
    created_at: new Date('2024-12-15'),
    updated_at: new Date('2024-12-15'),
    ...overrides,
  };
}

describe('IncomeForm Component', () => {
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
      render(
        <IncomeForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Comprobante')).toBeInTheDocument();
      expect(screen.getByText(/Recibo o comprobante/i)).toBeInTheDocument();
      expect(screen.getByText(/Subir comprobante/i)).toBeInTheDocument();
    });

    it('should show upload button when no receipt exists (new income)', () => {
      render(
        <IncomeForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const uploadButton = screen.getByText(/Subir comprobante/i);
      expect(uploadButton).toBeInTheDocument();
      expect(uploadButton.tagName).toBe('BUTTON');
    });

    it('should show existing receipt info when editing income with receipt', () => {
      const incomeWithReceipt = createMockIncome({
        receipt_url: 'https://storage.example.com/receipt.jpg',
      });

      render(
        <IncomeForm
          income={incomeWithReceipt}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('✓ Comprobante cargado')).toBeInTheDocument();
      expect(screen.getByText('Ver actual')).toBeInTheDocument();
      expect(screen.getByText('Reemplazar')).toBeInTheDocument();
    });

    it('should have a link to view the existing receipt', () => {
      const receiptUrl = 'https://storage.example.com/receipt.jpg';
      const incomeWithReceipt = createMockIncome({ receipt_url: receiptUrl });

      render(
        <IncomeForm
          income={incomeWithReceipt}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const viewLink = screen.getByText('Ver actual');
      expect(viewLink).toHaveAttribute('href', receiptUrl);
      expect(viewLink).toHaveAttribute('target', '_blank');
    });

    it('should not show receipt info when editing income without receipt', () => {
      const incomeWithoutReceipt = createMockIncome({ receipt_url: undefined });

      render(
        <IncomeForm
          income={incomeWithoutReceipt}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText('✓ Comprobante cargado')).not.toBeInTheDocument();
      expect(screen.queryByText('Ver actual')).not.toBeInTheDocument();
      expect(screen.getByText(/Subir comprobante/i)).toBeInTheDocument();
    });

    it('should show selected file name after file selection', async () => {
      const user = userEvent.setup();

      render(
        <IncomeForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const fileInput = screen.getByLabelText(/Subir comprobante/i);
      const mockFile = createMockFile('my-receipt.jpg', 'image/jpeg');

      await user.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(screen.getByText(/my-receipt.jpg/i)).toBeInTheDocument();
      });
    });

    it('should allow removing selected file', async () => {
      const user = userEvent.setup();

      render(
        <IncomeForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

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

      render(
        <IncomeForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Fill required fields
      await user.clear(screen.getByLabelText(/Monto/i));
      await user.type(screen.getByLabelText(/Monto/i), '350000');
      await user.type(screen.getByLabelText(/Descripción/i), 'Test income');

      // Upload receipt
      const fileInput = screen.getByLabelText(/Subir comprobante/i);
      const mockFile = createMockFile('receipt.pdf', 'application/pdf');
      await user.upload(fileInput, mockFile);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Agregar Ingreso/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            receipt_file: expect.any(File),
          })
        );
      });
    });
  });

  describe('Form Rendering', () => {
    it('should render the form with all required fields', () => {
      render(
        <IncomeForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Title appears in header
      expect(screen.getByRole('heading', { name: 'Agregar Ingreso' })).toBeInTheDocument();
      expect(screen.getByLabelText(/Tipo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Monto/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Fecha/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Descripción/i)).toBeInTheDocument();
    });

    it('should show "Editar Ingreso" title when editing', () => {
      const income = createMockIncome();

      render(
        <IncomeForm
          income={income}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('heading', { name: 'Editar Ingreso' })).toBeInTheDocument();
    });

    it('should populate form fields when editing', () => {
      const income = createMockIncome({
        amount: 450000,
        description: 'Test description',
      });

      render(
        <IncomeForm
          income={income}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText(/Monto/i)).toHaveValue(450000);
      expect(screen.getByLabelText(/Descripción/i)).toHaveValue('Test description');
    });
  });

  describe('Form Actions', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <IncomeForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByText('Cancelar'));

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should disable submit button while submitting', () => {
      render(
        <IncomeForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={true}
        />
      );

      const submitButton = screen.getByText('Guardando...');
      expect(submitButton).toBeDisabled();
    });

    it('should display error message when provided', () => {
      render(
        <IncomeForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          error="Error al guardar el ingreso"
        />
      );

      expect(screen.getByText('Error al guardar el ingreso')).toBeInTheDocument();
    });
  });
});
