import React, { useState } from 'react';
import { getCoreRowModel } from '@tanstack/react-table';
import { Transaction } from '@/types';
import { DateRange } from 'react-day-picker';
import { Table } from "@/components/ui/table";
import { AlertCircle } from 'lucide-react';
import TransactionsTableHeader from './components/TableHeader';
import TransactionsTableBody from './components/TableBody';
import TransactionsFilters from './components/Filters';
import TransactionsEditDialog from './components/EditDialog';
import TransactionsDeleteDialog from './components/DeleteDialog';

interface TransactionsTableProps {
  transactions: Transaction[];
  error?: string;
}

const TransactionsTable = ({ transactions = [], error }: TransactionsTableProps) => {
  const [sorting, setSorting] = useState<{ field: 'date' | 'amount' | 'description' | 'category'; direction: 'asc' | 'desc' }>({
    field: 'date',
    direction: 'desc'
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateRange | undefined>(undefined);
  
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  // Sort transactions based on current sort field and direction
  const sortedTransactions = [...transactions].sort((a, b) => {
    const field = sorting.field;
    
    if (field === 'category') {
      const aValue = a.category?.name || '';
      const bValue = b.category?.name || '';
      return sorting.direction === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    
    // For date, amount, description
    const aValue = field === 'date' ? a.transaction_date : a[field];
    const bValue = field === 'date' ? b.transaction_date : b[field];
    
    if (field === 'date') {
      return sorting.direction === 'asc' 
        ? new Date(aValue || '').getTime() - new Date(bValue || '').getTime()
        : new Date(bValue || '').getTime() - new Date(aValue || '').getTime();
    }
    
    if (field === 'amount') {
      return sorting.direction === 'asc' 
        ? Number(aValue) - Number(bValue)
        : Number(bValue) - Number(aValue);
    }
    
    // Default string comparison for other fields
    return sorting.direction === 'asc' 
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  // Filter transactions
  const filteredTransactions = sortedTransactions.filter(transaction => {
    // Search term filter
    const searchMatch = searchTerm === "" || 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const categoryMatch = selectedCategory === "all" || 
      transaction.category?.name === selectedCategory;
    
    // Date filter
    let dateMatch = true;
    if (dateFilter?.from) {
      const transactionDate = new Date(transaction.transaction_date || '');
      dateMatch = transactionDate >= dateFilter.from;
      
      if (dateMatch && dateFilter.to) {
        dateMatch = transactionDate <= dateFilter.to;
      }
    }
    
    return searchMatch && categoryMatch && dateMatch;
  });

  const handleSort = (field: 'date' | 'amount' | 'description' | 'category') => {
    setSorting(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleEdit = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
  };

  const handleDelete = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
  };

  const handleDeleteConfirm = () => {
    // Here we would call the API to delete the transaction
    console.log('Deleting transaction:', transactionToDelete?.id);
    setTransactionToDelete(null);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setDateFilter(undefined);
  };

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-900/50 border border-red-800 flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-red-400" />
        <p className="text-red-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <TransactionsFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        onClearFilters={clearFilters}
        categories={[]} // This should come from your categories data
      />
      
      <div className="rounded-md border mt-4">
        <Table>
          <TransactionsTableHeader
            sortField={sorting.field}
            sortDirection={sorting.direction}
            onSort={handleSort}
          />
          <TransactionsTableBody
            transactions={filteredTransactions}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </Table>
      </div>

      {transactionToEdit && (
        <TransactionsEditDialog
          isOpen={!!transactionToEdit}
          onOpenChange={(open) => !open && setTransactionToEdit(null)}
          transaction={transactionToEdit}
        />
      )}

      {transactionToDelete && (
        <TransactionsDeleteDialog
          isOpen={!!transactionToDelete}
          onOpenChange={(open) => !open && setTransactionToDelete(null)}
          onConfirm={handleDeleteConfirm}
          transactionDescription={transactionToDelete.description}
        />
      )}
    </div>
  );
};

export default TransactionsTable;
