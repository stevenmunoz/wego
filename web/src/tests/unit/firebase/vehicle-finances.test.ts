/**
 * Tests for Vehicle Finances Firestore service
 *
 * Tests CRUD operations for income and expenses including receipt_url handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Timestamp } from 'firebase/firestore';

// Mock Firestore functions
const mockGetDocs = vi.fn();
const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockQuery = vi.fn();
const mockOrderBy = vi.fn();
const mockServerTimestamp = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  Timestamp: {
    now: () => ({ seconds: 1704067200, nanoseconds: 0 }),
    fromDate: (date: Date) => ({
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
      toDate: () => date,
      toMillis: () => date.getTime(),
    }),
  },
  serverTimestamp: () => mockServerTimestamp(),
}));

vi.mock('@/core/firebase/firestore', () => ({
  db: { name: 'mock-db' },
}));

// Import after mocking
import {
  createVehicleIncome,
  updateVehicleIncome,
  createVehicleExpense,
  updateVehicleExpense,
  getVehicleIncome,
  getVehicleExpenses,
  calculatePLSummary,
  convertFirestoreIncome,
  convertFirestoreExpense,
  type FirestoreVehicleIncome,
  type FirestoreVehicleExpense,
} from '@/core/firebase/vehicle-finances';

describe('Vehicle Finances Firestore Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.mockReturnValue({ id: 'mock-doc-id' });
    mockCollection.mockReturnValue({ path: 'mock-collection' });
    mockQuery.mockReturnValue({ query: 'mock-query' });
    mockOrderBy.mockReturnValue({ orderBy: 'mock-order' });
    mockSetDoc.mockResolvedValue(undefined);
    mockUpdateDoc.mockResolvedValue(undefined);
    mockDeleteDoc.mockResolvedValue(undefined);
    mockServerTimestamp.mockReturnValue({ serverTimestamp: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createVehicleIncome', () => {
    it('should create an income entry with receipt_url', async () => {
      const vehicleId = 'vehicle-123';
      const ownerId = 'owner-456';
      const input = {
        type: 'weekly_payment',
        amount: 350000,
        description: 'Pago semanal semana 50',
        date: '2024-12-15',
        is_recurring: false,
        receipt_url: 'https://storage.example.com/receipt.jpg',
      };

      const result = await createVehicleIncome(vehicleId, ownerId, input);

      expect(result.success).toBe(true);
      expect(result.incomeId).toBe('mock-doc-id');
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          vehicle_id: vehicleId,
          owner_id: ownerId,
          type: 'weekly_payment',
          amount: 350000,
          description: 'Pago semanal semana 50',
          is_recurring: false,
          receipt_url: 'https://storage.example.com/receipt.jpg',
        })
      );
    });

    it('should create an income entry without receipt_url', async () => {
      const vehicleId = 'vehicle-123';
      const ownerId = 'owner-456';
      const input = {
        type: 'bonus',
        amount: 50000,
        description: 'Bonificación mensual',
        date: '2024-12-15',
      };

      const result = await createVehicleIncome(vehicleId, ownerId, input);

      expect(result.success).toBe(true);
      // Verify receipt_url is NOT in the document (undefined values excluded)
      const setDocCall = mockSetDoc.mock.calls[0][1];
      expect(setDocCall).not.toHaveProperty('receipt_url');
    });

    it('should include driver_name when provided', async () => {
      const vehicleId = 'vehicle-123';
      const ownerId = 'owner-456';
      const input = {
        type: 'weekly_payment',
        amount: 350000,
        description: 'Pago semanal',
        date: '2024-12-15',
        driver_name: 'Juan Pérez',
      };

      await createVehicleIncome(vehicleId, ownerId, input);

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          driver_name: 'Juan Pérez',
        })
      );
    });

    it('should handle errors gracefully', async () => {
      mockSetDoc.mockRejectedValue(new Error('Permission denied'));

      const result = await createVehicleIncome('v1', 'o1', {
        type: 'other',
        amount: 1000,
        description: 'Test',
        date: '2024-12-15',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
    });
  });

  describe('updateVehicleIncome', () => {
    it('should update income with receipt_url', async () => {
      const vehicleId = 'vehicle-123';
      const incomeId = 'income-789';
      const updates = {
        amount: 400000,
        receipt_url: 'https://storage.example.com/new-receipt.jpg',
      };

      const result = await updateVehicleIncome(vehicleId, incomeId, updates);

      expect(result.success).toBe(true);
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          amount: 400000,
          receipt_url: 'https://storage.example.com/new-receipt.jpg',
        })
      );
    });

    it('should update income without modifying receipt_url when not provided', async () => {
      const vehicleId = 'vehicle-123';
      const incomeId = 'income-789';
      const updates = {
        amount: 400000,
        description: 'Updated description',
      };

      await updateVehicleIncome(vehicleId, incomeId, updates);

      const updateCall = mockUpdateDoc.mock.calls[0][1];
      expect(updateCall.amount).toBe(400000);
      expect(updateCall.description).toBe('Updated description');
      expect(updateCall).not.toHaveProperty('receipt_url');
    });

    it('should handle errors gracefully', async () => {
      mockUpdateDoc.mockRejectedValue(new Error('Document not found'));

      const result = await updateVehicleIncome('v1', 'i1', { amount: 1000 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Document not found');
    });
  });

  describe('createVehicleExpense', () => {
    it('should create an expense entry with receipt_url', async () => {
      const vehicleId = 'vehicle-123';
      const ownerId = 'owner-456';
      const input = {
        category: 'fuel',
        amount: 80000,
        description: 'Tanqueo gasolina',
        date: '2024-12-15',
        vendor: 'Estación XYZ',
        receipt_url: 'https://storage.example.com/expense-receipt.jpg',
      };

      const result = await createVehicleExpense(vehicleId, ownerId, input);

      expect(result.success).toBe(true);
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          category: 'fuel',
          amount: 80000,
          vendor: 'Estación XYZ',
          receipt_url: 'https://storage.example.com/expense-receipt.jpg',
        })
      );
    });

    it('should create an expense without receipt_url', async () => {
      const vehicleId = 'vehicle-123';
      const ownerId = 'owner-456';
      const input = {
        category: 'maintenance',
        amount: 150000,
        description: 'Cambio de aceite',
        date: '2024-12-15',
      };

      const result = await createVehicleExpense(vehicleId, ownerId, input);

      expect(result.success).toBe(true);
      const setDocCall = mockSetDoc.mock.calls[0][1];
      expect(setDocCall).not.toHaveProperty('receipt_url');
    });
  });

  describe('updateVehicleExpense', () => {
    it('should update expense with receipt_url', async () => {
      const vehicleId = 'vehicle-123';
      const expenseId = 'expense-789';
      const updates = {
        amount: 90000,
        receipt_url: 'https://storage.example.com/updated-receipt.pdf',
      };

      const result = await updateVehicleExpense(vehicleId, expenseId, updates);

      expect(result.success).toBe(true);
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          amount: 90000,
          receipt_url: 'https://storage.example.com/updated-receipt.pdf',
        })
      );
    });
  });

  describe('getVehicleIncome', () => {
    it('should fetch income entries for a vehicle', async () => {
      const mockIncomeData: FirestoreVehicleIncome[] = [
        {
          id: 'income-1',
          vehicle_id: 'vehicle-123',
          owner_id: 'owner-456',
          type: 'weekly_payment' as const,
          amount: 350000,
          description: 'Pago semanal',
          date: Timestamp.fromDate(new Date('2024-12-15')),
          is_recurring: false,
          receipt_url: 'https://storage.example.com/receipt.jpg',
          created_at: Timestamp.fromDate(new Date('2024-12-15')),
          updated_at: Timestamp.fromDate(new Date('2024-12-15')),
        },
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockIncomeData.map((data) => ({
          data: () => data,
        })),
      });

      const result = await getVehicleIncome('vehicle-123');

      expect(result).toHaveLength(1);
      expect(result[0].receipt_url).toBe('https://storage.example.com/receipt.jpg');
    });
  });

  describe('getVehicleExpenses', () => {
    it('should fetch expense entries for a vehicle', async () => {
      const mockExpenseData: FirestoreVehicleExpense[] = [
        {
          id: 'expense-1',
          vehicle_id: 'vehicle-123',
          owner_id: 'owner-456',
          category: 'fuel' as const,
          amount: 80000,
          description: 'Tanqueo',
          date: Timestamp.fromDate(new Date('2024-12-15')),
          is_recurring: false,
          receipt_url: 'https://storage.example.com/expense.jpg',
          created_at: Timestamp.fromDate(new Date('2024-12-15')),
          updated_at: Timestamp.fromDate(new Date('2024-12-15')),
        },
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockExpenseData.map((data) => ({
          data: () => data,
        })),
      });

      const result = await getVehicleExpenses('vehicle-123');

      expect(result).toHaveLength(1);
      expect(result[0].receipt_url).toBe('https://storage.example.com/expense.jpg');
    });
  });

  describe('calculatePLSummary', () => {
    it('should calculate profit/loss summary correctly', () => {
      const income: FirestoreVehicleIncome[] = [
        {
          id: '1',
          vehicle_id: 'v1',
          owner_id: 'o1',
          type: 'weekly_payment' as const,
          amount: 350000,
          description: 'Pago 1',
          date: Timestamp.fromDate(new Date('2024-12-15')),
          is_recurring: false,
          created_at: Timestamp.fromDate(new Date()),
          updated_at: Timestamp.fromDate(new Date()),
        },
        {
          id: '2',
          vehicle_id: 'v1',
          owner_id: 'o1',
          type: 'bonus' as const,
          amount: 50000,
          description: 'Bonificación',
          date: Timestamp.fromDate(new Date('2024-12-15')),
          is_recurring: false,
          created_at: Timestamp.fromDate(new Date()),
          updated_at: Timestamp.fromDate(new Date()),
        },
      ];

      const expenses: FirestoreVehicleExpense[] = [
        {
          id: '3',
          vehicle_id: 'v1',
          owner_id: 'o1',
          category: 'fuel' as const,
          amount: 100000,
          description: 'Combustible',
          date: Timestamp.fromDate(new Date('2024-12-15')),
          is_recurring: false,
          created_at: Timestamp.fromDate(new Date()),
          updated_at: Timestamp.fromDate(new Date()),
        },
      ];

      const summary = calculatePLSummary(
        'v1',
        income,
        expenses,
        new Date('2024-12-01'),
        new Date('2024-12-31')
      );

      expect(summary.total_income).toBe(400000);
      expect(summary.total_expenses).toBe(100000);
      expect(summary.net_profit).toBe(300000);
      expect(summary.profit_margin).toBe(75);
      expect(summary.income_by_type.weekly_payment).toBe(350000);
      expect(summary.income_by_type.bonus).toBe(50000);
      expect(summary.expenses_by_category.fuel).toBe(100000);
    });
  });

  describe('convertFirestoreIncome', () => {
    it('should convert Firestore income to app type including receipt_url', () => {
      const firestoreIncome: FirestoreVehicleIncome = {
        id: 'income-1',
        vehicle_id: 'vehicle-123',
        owner_id: 'owner-456',
        type: 'weekly_payment' as const,
        amount: 350000,
        description: 'Pago semanal',
        date: Timestamp.fromDate(new Date('2024-12-15')),
        is_recurring: false,
        receipt_url: 'https://storage.example.com/receipt.jpg',
        created_at: Timestamp.fromDate(new Date('2024-12-15')),
        updated_at: Timestamp.fromDate(new Date('2024-12-15')),
      };

      const appIncome = convertFirestoreIncome(firestoreIncome);

      expect(appIncome.receipt_url).toBe('https://storage.example.com/receipt.jpg');
      expect(appIncome.date).toBeInstanceOf(Date);
      expect(appIncome.created_at).toBeInstanceOf(Date);
    });
  });

  describe('convertFirestoreExpense', () => {
    it('should convert Firestore expense to app type including receipt_url', () => {
      const firestoreExpense: FirestoreVehicleExpense = {
        id: 'expense-1',
        vehicle_id: 'vehicle-123',
        owner_id: 'owner-456',
        category: 'fuel' as const,
        amount: 80000,
        description: 'Tanqueo',
        date: Timestamp.fromDate(new Date('2024-12-15')),
        is_recurring: false,
        receipt_url: 'https://storage.example.com/expense.pdf',
        vendor: 'Estación XYZ',
        created_at: Timestamp.fromDate(new Date('2024-12-15')),
        updated_at: Timestamp.fromDate(new Date('2024-12-15')),
      };

      const appExpense = convertFirestoreExpense(firestoreExpense);

      expect(appExpense.receipt_url).toBe('https://storage.example.com/expense.pdf');
      expect(appExpense.vendor).toBe('Estación XYZ');
      expect(appExpense.date).toBeInstanceOf(Date);
    });
  });
});
