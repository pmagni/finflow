import { transactionService } from '../transactionService';
import { supabase } from '@/integrations/supabase/client';
import { AppError } from '@/utils/errorHandler';

// Mock de Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
  },
}));

describe('TransactionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTransactionsByMonth', () => {
    it('debería retornar un resumen mensual correcto', async () => {
      // Mock de datos de transacciones
      const mockTransactions = [
        {
          amount: 1000,
          category: { name: 'Salario' },
          transaction_date: '2024-03-01',
        },
        {
          amount: -500,
          category: { name: 'Comida' },
          transaction_date: '2024-03-15',
        },
      ];

      // Mock de meses disponibles
      const mockAvailableMonths = [
        { transaction_date: '2024-03-01' },
        { transaction_date: '2024-02-01' },
      ];

      // Configurar mocks
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'transactions') {
          return {
            select: jest.fn().mockResolvedValue({ data: mockTransactions, error: null }),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
          };
        }
        return {
          select: jest.fn().mockResolvedValue({ data: mockAvailableMonths, error: null }),
          order: jest.fn().mockReturnThis(),
        };
      });

      const result = await transactionService.getTransactionsByMonth(3, 2024);

      expect(result).toEqual({
        income: {
          total: 1000,
          byCategory: { 'Salario': 1000 },
        },
        expenses: {
          total: 500,
          byCategory: { 'Comida': 500 },
        },
        balance: 500,
        availableMonths: expect.any(Array),
      });
    });

    it('debería manejar errores correctamente', async () => {
      // Mock de error
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockRejectedValue(new Error('Error de base de datos')),
      }));

      await expect(transactionService.getTransactionsByMonth(3, 2024))
        .rejects
        .toThrow(AppError);
    });
  });
}); 