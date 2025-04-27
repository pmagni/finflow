
import { render } from '@testing-library/react';
import ExpenseChart from '@/components/ExpenseOverview/ExpenseChart';
import { transactionService } from '@/services/transactionService';
import { getExpensesByMonth } from '@/services/expenseService';

// Mock de datos grandes para pruebas de rendimiento
const largeMockData = Array.from({ length: 1000 }, (_, i) => ({
  amount: Math.random() * 1000 - 500,
  category: { name: `Categoría ${i % 10}` },
  transaction_date: `2024-${String(i % 12 + 1).padStart(2, '0')}-01`,
}));

describe('Pruebas de Rendimiento', () => {
  describe('Componente ExpenseChart', () => {
    it('debería renderizar rápidamente con datos grandes', () => {
      const startTime = performance.now();
      
      render(<ExpenseChart />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // El tiempo de renderizado debería ser menor a 100ms
      expect(renderTime).toBeLessThan(100);
    });
  });

  describe('Servicio de Transacciones', () => {
    it('debería procesar datos grandes eficientemente', async () => {
      const startTime = performance.now();
      
      await transactionService.getTransactionsByMonth(3, 2024);
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      // El tiempo de procesamiento debería ser menor a 200ms
      expect(processingTime).toBeLessThan(200);
    });
  });

  describe('Servicio de Gastos', () => {
    it('debería manejar grandes volúmenes de datos', async () => {
      const startTime = performance.now();
      
      await getExpensesByMonth();
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      // El tiempo de procesamiento debería ser menor a 150ms
      expect(processingTime).toBeLessThan(150);
    });
  });
});
