
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Transaction, Category } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

const TransactionList = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(name, icon)
        `)
        .order('transaction_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Type assertion to handle the category join
      const formattedTransactions = (data || []).map(transaction => ({
        ...transaction,
        type: transaction.type as 'income' | 'expense',
        category: transaction.category || transaction.category_name || 'Sin categoría'
      })) as Transaction[];
      
      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar las transacciones');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transacciones Recientes</CardTitle>
          <CardDescription>Cargando transacciones...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transacciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transacciones Recientes</CardTitle>
        <CardDescription>Últimas 10 transacciones registradas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No hay transacciones registradas</p>
          ) : (
            transactions.map((transaction) => {
              const categoryName = typeof transaction.category === 'object' 
                ? transaction.category.name 
                : transaction.category_name || transaction.category || 'Sin categoría';
              
              return (
                <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-800">
                  <div className="flex flex-col">
                    <span className="font-medium">{transaction.description || 'Sin descripción'}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                        {categoryName}
                      </Badge>
                      <span className="text-sm text-gray-400">
                        {formatDate(transaction.transaction_date)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-medium ${
                      transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionList;
