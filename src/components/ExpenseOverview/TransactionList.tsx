import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRecentExpenses } from '@/services/expenseService';
import { formatCurrency } from '@/utils/formatters';
import {
  ShoppingBag,
  Coffee,
  Bus,
  Film,
  Gift,
  Tv,
  Home,
  BadgeDollarSign,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  category_id: string | null;
  user_id: string | null;
  created_at: string | null;
  transaction_date?: string | null;
  currency?: string | null;
  category?: {
    name: string;
    icon: string;
  } | null;
}

const TransactionList = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        // Updated query to include category relationship
        const { data, error } = await supabase
          .from('transactions')
          .select(`
            *,
            category:categories(name, icon)
          `)
          .order('transaction_date', { ascending: false })
          .limit(5);
          
        if (error) throw error;
        setTransactions(data || []);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTransactions();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('public:transactions')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transactions' }, 
        () => {
          fetchTransactions();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  if (isLoading) {
    return (
      <div className="bg-finflow-card rounded-2xl p-5 animate-fade-in h-full">
        <h2 className="text-lg font-bold mb-4">Últimas Transacciones</h2>
        <div className="flex items-center justify-center p-4">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }
  
  const getCategoryIcon = (categoryName: string | null | undefined) => {
    // Si category es null o undefined, usar un valor por defecto
    if (!categoryName) {
      return <BadgeDollarSign className="text-finflow-mint" size={20} />;
    }
    
    switch (categoryName.toLowerCase()) {
      case 'food':
        return <Coffee className="text-[#FF6B6B]" size={20} />;
      case 'transport':
        return <Bus className="text-[#4ECDC4]" size={20} />;
      case 'entertainment':
        return <Film className="text-[#FFD166]" size={20} />;
      case 'groceries':
        return <ShoppingBag className="text-[#06D6A0]" size={20} />;
      case 'utilities':
        return <Home className="text-[#118AB2]" size={20} />;
      case 'subscriptions':
        return <Tv className="text-[#9381FF]" size={20} />;
      case 'gifts':
        return <Gift className="text-[#EF476F]" size={20} />;
      default:
        return <BadgeDollarSign className="text-finflow-mint" size={20} />;
    }
  };
  
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return 'No date';
    }
    
    try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };
  
  return (
    <div className="bg-finflow-card rounded-2xl p-5 animate-fade-in h-full">
      <h2 className="text-lg font-bold mb-4">Últimas Transacciones</h2>
      
      <div className="space-y-3">
        {transactions.length === 0 ? (
          <div className="text-center py-4 text-gray-400">
            <p>No hay transacciones recientes</p>
          </div>
        ) : (
          transactions.map((transaction) => (
          <div 
              key={transaction.id}
            className="bg-gray-900 rounded-xl p-3 flex items-center justify-between card-hover"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mr-3">
                  {getCategoryIcon(transaction.category?.name)}
              </div>
              <div className="text-left">
                  <p className="font-medium capitalize">{transaction.category?.name || 'Uncategorized'}</p>
                  <p className="text-xs text-gray-400">
                    {formatDate(transaction.transaction_date || transaction.created_at)}
                  </p>
              </div>
            </div>
            
            <div className="text-right">
                <p className="font-medium">{formatCurrency(transaction.amount || 0)}</p>
                <p className="text-xs text-gray-400">{transaction.description || 'No description'}</p>
              </div>
            </div>
          ))
        )}
      </div>
      
      <Link to="/transactions" className="flex items-center justify-center w-full mt-4 text-finflow-mint text-sm hover:underline">
        Ver todas las transacciones
        <ArrowRight className="ml-1" size={14} />
      </Link>
    </div>
  );
};

export default TransactionList;
