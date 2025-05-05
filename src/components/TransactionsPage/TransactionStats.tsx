import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { BarChart3, PieChart, DollarSign, AlertCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from '@/utils/formatters';

interface TransactionSummary {
  totalTransactions: number;
  totalAmount: number;
  categorySummary: {
    [key: string]: {
      count: number;
      total: number;
    }
  };
  monthSummary: {
    [key: string]: {
      count: number;
      total: number;
    }
  };
}

export function TransactionStats() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<TransactionSummary>({
    totalTransactions: 0,
    totalAmount: 0,
    categorySummary: {},
    monthSummary: {}
  });

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setIsLoading(true);
        setError(null);
        const { data: transactions, error } = await supabase
          .from('transactions')
          .select(`
            *,
            category:categories(name, icon)
          `)
          .order('transaction_date', { ascending: false });

        if (error) {
          throw error;
        }

        if (!transactions) {
          throw new Error('No se pudieron obtener las transacciones');
        }

        // Procesar datos para el resumen
        const newSummary: TransactionSummary = {
          totalTransactions: transactions.length,
          totalAmount: 0,
          categorySummary: {},
          monthSummary: {}
        };

        transactions.forEach(transaction => {
          // Total
          newSummary.totalAmount += Number(transaction.amount);

          // Por categoría (solo gastos)
          if (transaction.type === 'expense') {
            const categoryName = transaction.category?.name || 'Sin categoría';
            if (!newSummary.categorySummary[categoryName]) {
              newSummary.categorySummary[categoryName] = { count: 0, total: 0 };
            }
            newSummary.categorySummary[categoryName].count += 1;
            newSummary.categorySummary[categoryName].total += Number(transaction.amount);
          }

          // Por mes
          const date = new Date(transaction.transaction_date || transaction.created_at);
          const monthKey = format(date, 'yyyy-MM');
          if (!newSummary.monthSummary[monthKey]) {
            newSummary.monthSummary[monthKey] = { count: 0, total: 0 };
          }
          newSummary.monthSummary[monthKey].count += 1;
          newSummary.monthSummary[monthKey].total += Number(transaction.amount);
        });

        setSummary(newSummary);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setError(error instanceof Error ? error.message : 'Error al cargar las transacciones');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTransactions();
  }, []);

  // Obtener las 4 categorías principales por monto
  const topCategories = Object.entries(summary.categorySummary)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 4);

  // Obtener los últimos 4 meses con transacciones
  const recentMonths = Object.entries(summary.monthSummary)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 4);

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-900/50 border border-red-800 flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-red-400" />
        <p className="text-red-200">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-pulse">
        <Card className="bg-gray-800">
          <CardHeader className="h-24"></CardHeader>
          <CardContent className="h-12"></CardContent>
        </Card>
        <Card className="bg-gray-800">
          <CardHeader className="h-24"></CardHeader>
          <CardContent className="h-12"></CardContent>
        </Card>
        <Card className="bg-gray-800">
          <CardHeader className="h-24"></CardHeader>
          <CardContent className="h-12"></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen general */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardDescription>Transacciones Totales</CardDescription>
            <CardTitle className="text-3xl flex items-center">
              <BarChart3 className="mr-2 text-finflow-mint" size={24} />
              {summary.totalTransactions}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400">
              Todas las transacciones registradas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardDescription>Monto Total</CardDescription>
            <CardTitle className="text-3xl flex items-center">
              <DollarSign className="mr-2 text-finflow-mint" size={24} />
              {formatCurrency(summary.totalAmount)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400">
              Suma de todas las transacciones
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardDescription>Categorías</CardDescription>
            <CardTitle className="text-3xl flex items-center">
              <PieChart className="mr-2 text-finflow-mint" size={24} />
              {Object.keys(summary.categorySummary).length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400">
              Total de categorías utilizadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top categorías y meses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Top Gastos por Categoría</CardTitle>
            <CardDescription>Categorías con mayor gasto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCategories.map(([category, data]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-finflow-mint mr-2"></div>
                    <span>{category}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-400">{data.count} trans.</span>
                    <span className="font-medium">{formatCurrency(data.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Gastos Recientes</CardTitle>
            <CardDescription>Últimos meses con transacciones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMonths.map(([monthKey, data]) => {
                const [year, month] = monthKey.split('-');
                const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' });
                
                return (
                  <div key={monthKey} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-finflow-mint mr-2"></div>
                      <span className="capitalize">{monthName} {year}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-400">{data.count} trans.</span>
                      <span className="font-medium">{formatCurrency(data.total)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 