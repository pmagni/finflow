import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCategories } from '@/services/categoryService';
import { format } from 'date-fns';
import { Search, Filter, Edit, Trash2, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { TransactionForm } from '@/components/ExpenseOverview/TransactionForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Category {
  id: string;
  name: string;
  icon: string;
  transaction_type: 'income' | 'expense';
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

interface TransactionWithCategory {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  category_id: string;
  user_id: string;
  created_at: string;
  transaction_date?: string;
  currency?: string;
  category?: {
    name: string;
    icon: string;
  };
}

export function TransactionsTable() {
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithCategory | null>(null);
  
  // Form states
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);

  // Fetch transactions with their categories
  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(name, icon)
        `)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      
      // Cast to the correct type
      const typedData = data as unknown as TransactionWithCategory[];
      setTransactions(typedData);
      setFilteredTransactions(typedData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const fetchedCategories = await getCategories();
        // Cast to the correct type
        setCategories(fetchedCategories as unknown as Category[]);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    loadCategories();
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

  // Filter transactions when filters change
  useEffect(() => {
    let result = [...transactions];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) => 
          t.description.toLowerCase().includes(query) ||
          t.amount.toString().includes(query) ||
          (t.category?.name && t.category.name.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (categoryFilter) {
      result = result.filter((t) => t.category_id === categoryFilter);
    }

    // Type filter
    if (typeFilter) {
      result = result.filter((t) => t.type === typeFilter);
    }

    // Date filter
    if (dateFilter) {
      const selectedDate = format(dateFilter, 'yyyy-MM-dd');
      result = result.filter((t) => {
        // Use transaction_date if available, otherwise fall back to created_at
        const dateToUse = t.transaction_date || t.created_at;
        const transactionDate = new Date(dateToUse);
        return format(transactionDate, 'yyyy-MM-dd') === selectedDate;
      });
    }

    setFilteredTransactions(result);
  }, [transactions, searchQuery, categoryFilter, typeFilter, dateFilter]);

  // Handle transaction deletion
  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', selectedTransaction.id);

      if (error) throw error;

      toast.success('Transaction deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedTransaction(null);
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    }
  };

  // Function to handle edit button click
  const handleEditClick = (transaction: TransactionWithCategory) => {
    setSelectedTransaction(transaction);
    setIsTransactionFormOpen(true);
  };

  // Function to handle delete button click
  const handleDeleteClick = (transaction: TransactionWithCategory) => {
    setSelectedTransaction(transaction);
    setIsDeleteDialogOpen(true);
  };

  // Function to clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setTypeFilter('');
    setDateFilter(undefined);
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Transactions</h2>
      </div>

      {/* Filters section */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 bg-gray-800 border-gray-700"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px] bg-gray-800 border-gray-700">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="income">Income</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[180px] justify-start bg-gray-800 border-gray-700">
              <Calendar className="mr-2 h-4 w-4" />
              {dateFilter ? format(dateFilter, 'PPP') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
            <CalendarComponent
              mode="single"
              selected={dateFilter}
              onSelect={setDateFilter}
              initialFocus
              className="bg-gray-800"
            />
          </PopoverContent>
        </Popover>

        <Button 
          variant="outline" 
          onClick={clearFilters}
          className="bg-gray-800 border-gray-700 hover:bg-gray-700"
        >
          Clear Filters
        </Button>
      </div>

      {/* Transactions table */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <p>Loading transactions...</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center py-8 bg-gray-800 rounded-lg">
          <p className="text-gray-400">No transactions found.</p>
        </div>
      ) : (
        <div className="rounded-md border border-gray-700">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-800 hover:bg-gray-800">
                <TableHead className="w-[180px]">Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id} className="border-t border-gray-700 hover:bg-gray-800">
                  <TableCell className="font-medium">
                    {transaction.transaction_date 
                      ? format(new Date(transaction.transaction_date), 'PP') 
                      : format(new Date(transaction.created_at), 'PP')}
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>
                    {transaction.category?.name 
                      ? transaction.category.name
                      : 'Unknown Category'}
                  </TableCell>
                  <TableCell className="capitalize">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      transaction.type === 'income' 
                        ? 'bg-green-900 text-green-200' 
                        : 'bg-red-900 text-red-200'
                    }`}>
                      {transaction.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={transaction.type === 'income' ? 'text-green-300' : 'text-red-300'}>
                      {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(transaction)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(transaction)}
                        className="h-8 w-8 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Transaction Form */}
      {selectedTransaction && (
        <TransactionForm
          isOpen={isTransactionFormOpen}
          onOpenChange={setIsTransactionFormOpen}
          transaction={{
            id: selectedTransaction.id,
            type: selectedTransaction.type,
            description: selectedTransaction.description,
            category_id: selectedTransaction.category_id,
            amount: selectedTransaction.amount,
            transaction_date: selectedTransaction.transaction_date
          }}
          isEditing={true}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-finflow-card border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button onClick={handleDeleteTransaction} variant="destructive">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 