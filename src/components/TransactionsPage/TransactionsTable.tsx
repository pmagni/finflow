import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCategories } from '@/services/categoryService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, Filter, Edit, Trash2, Calendar, ArrowUp, ArrowDown, CircleSlash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { DatabaseError } from '@/types/errors';
import {
  Table,
  TableBody as ShadcnTableBody,
  TableCell,
  TableHead,
  TableHeader as ShadcnTableHeader,
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
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { formatCurrency, formatShortDate } from '@/utils/formatters';
import { ScrollArea } from '@/components/ui/scroll-area';

// Types
interface Category {
  id: string;
  name: string;
  icon: string;
  transaction_type: 'income' | 'expense' | string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

interface Transaction {
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

type SortField = 'date' | 'amount' | 'description' | 'category';
type SortDirection = 'asc' | 'desc';

// Components
import TransactionsTableHeader from './components/TableHeader';
import TransactionsTableBody from './components/TableBody';
import TransactionsFilters from './components/Filters';
import TransactionsDeleteDialog from './components/DeleteDialog';
import TransactionsEditDialog from './components/EditDialog';

export function TransactionsTable() {
  const { handleError } = useErrorHandler();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Fetch transactions with their categories
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories (
            name,
            icon
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw new DatabaseError('Error al cargar las transacciones', error);

      const typedData = data as unknown as Transaction[];
      setTransactions(typedData);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await getCategories();
        setCategories(categoriesData);
      } catch (error) {
        handleError(error);
      }
    };

    loadCategories();
    fetchTransactions();
  }, []);

  // Handle sort changes
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle transaction deletion
  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', selectedTransaction.id);

      if (error) throw new DatabaseError('Error al eliminar la transacción', error);

      toast.success('Transacción eliminada correctamente');
      fetchTransactions();
    } catch (error) {
      handleError(error);
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedTransaction(null);
    }
  };

  // Handle edit click
  const handleEditClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsEditDialogOpen(true);
  };

  // Handle delete click
  const handleDeleteClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteDialogOpen(true);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setDateRange({});
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Transacciones</h2>
      </div>

      <TransactionsFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        dateRange={dateRange}
        setDateRange={setDateRange}
        categories={categories}
        onClearFilters={clearFilters}
      />

      <ScrollArea className="h-[calc(100vh-200px)]">
        <Table>
          <TransactionsTableHeader
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          <TransactionsTableBody
            transactions={transactions}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        </Table>
      </ScrollArea>

      {selectedTransaction && (
        <>
          <TransactionsDeleteDialog
            isOpen={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onConfirm={handleDeleteTransaction}
            transactionDescription={selectedTransaction.description}
          />
          <TransactionsEditDialog
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            transaction={selectedTransaction}
          />
        </>
      )}
    </div>
  );
} 