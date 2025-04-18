import React, { useState, useEffect } from 'react';
import { getRecentExpenses } from '@/services/expenseService';
import {
  ShoppingBag,
  Coffee,
  Bus,
  Film,
  Gift,
  Tv,
  Home,
  BadgeDollarSign
} from 'lucide-react';

const TransactionList = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const data = await getRecentExpenses(5);
        setTransactions(data);
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
      <div className="bg-finflow-card rounded-2xl p-5 animate-fade-in">
        <h2 className="text-lg font-bold mb-4">Recent Transactions</h2>
        <div className="flex items-center justify-center p-4">
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
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
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  return (
    <div className="bg-finflow-card rounded-2xl p-5 animate-fade-in">
      <h2 className="text-lg font-bold mb-4">Recent Transactions</h2>
      
      <div className="space-y-3">
        {transactions.map((transaction, index) => (
          <div 
            key={index}
            className="bg-gray-900 rounded-xl p-3 flex items-center justify-between card-hover"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mr-3">
                {getCategoryIcon(transaction.category)}
              </div>
              <div className="text-left">
                <p className="font-medium capitalize">{transaction.category}</p>
                <p className="text-xs text-gray-400">{formatDate(transaction.created_at)}</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="font-medium">{transaction.currency || '$'}{transaction.amount}</p>
              <p className="text-xs text-gray-400">{transaction.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-4 text-finflow-mint text-sm hover:underline">
        See all transactions
      </button>
    </div>
  );
};

export default TransactionList;
