import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCategories } from '@/services/categoryService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, Filter, Edit, Trash2, Calendar, ArrowUp, ArrowDown, CircleSlash } from 'lucide-react';
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

type SortField = 'date' | 'amount' | 'description' | 'category';
type SortDirection = 'asc' | 'desc';

export function TransactionsTable() {
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithCategory | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  
  // Form states
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch transactions with their categories
  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      
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
      toast.error('Error al cargar las transacciones');
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

  // Count active filters
  useEffect(() => {
    let count = 0;
    if (searchQuery) count++;
    if (categoryFilter && categoryFilter !== 'all') count++;
    if (typeFilter && typeFilter !== 'all') count++;
    if (dateFilter) count++;
    setActiveFiltersCount(count);
  }, [searchQuery, categoryFilter, typeFilter, dateFilter]);

  // Handle sort changes
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter and sort transactions
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
    if (categoryFilter && categoryFilter !== 'all') {
      result = result.filter((t) => t.category_id === categoryFilter);
    }

    // Type filter
    if (typeFilter && typeFilter !== 'all') {
      result = result.filter((t) => t.type === typeFilter);
    }

    // Date filter
    if (dateFilter) {
      const selectedDate = format(dateFilter, 'yyyy-MM-dd');
      result = result.filter((t) => {
        // Use transaction_date if available, otherwise fall back to created_at
        const dateToUse = t.transaction_date || t.created_at;
        const transactionDate = new Date(dateToUse || '');
        return format(transactionDate, 'yyyy-MM-dd') === selectedDate;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortField === 'date') {
        const dateA = new Date(a.transaction_date || a.created_at || '');
        const dateB = new Date(b.transaction_date || b.created_at || '');
        return sortDirection === 'asc'
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      }
      
      if (sortField === 'amount') {
        return sortDirection === 'asc'
          ? a.amount - b.amount
          : b.amount - a.amount;
      }
      
      if (sortField === 'description') {
        return sortDirection === 'asc'
          ? a.description.localeCompare(b.description)
          : b.description.localeCompare(a.description);
      }
      
      if (sortField === 'category') {
        const catA = a.category?.name || '';
        const catB = b.category?.name || '';
        return sortDirection === 'asc'
          ? catA.localeCompare(catB)
          : catB.localeCompare(catA);
      }
      
      return 0;
    });

    setFilteredTransactions(result);
    setPage(1); // Reset to first page when filters change
  }, [transactions, searchQuery, categoryFilter, typeFilter, dateFilter, sortField, sortDirection]);

  // Handle transaction deletion
  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', selectedTransaction.id);

      if (error) throw error;

      toast.success('Transacción eliminada correctamente');
      setIsDeleteDialogOpen(false);
      setSelectedTransaction(null);
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Error al eliminar la transacción');
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

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Generate sort indicator
  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ArrowUp className="inline h-3 w-3 ml-1" /> : 
      <ArrowDown className="inline h-3 w-3 ml-1" />;
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <h2 className="text-xl font-bold">Transacciones</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={`${showFilters ? 'bg-finflow-mint hover:bg-finflow-mint-dark text-black' : 'bg-gray-800 border-gray-700'}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-1 h-4 w-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 bg-gray-700">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          
          <div className="flex border border-gray-700 rounded-md overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-none ${viewMode === 'table' ? 'bg-gray-700' : 'bg-transparent'}`}
              onClick={() => setViewMode('table')}
            >
              Tabla
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-none ${viewMode === 'card' ? 'bg-gray-700' : 'bg-transparent'}`}
              onClick={() => setViewMode('card')}
            >
              Tarjetas
            </Button>
          </div>
        </div>
      </div>

      {/* Filters section */}
      {showFilters && (
        <div className="bg-gray-900 rounded-lg p-4 mb-4 animate-in slide-in-from-top duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar transacciones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 bg-gray-800 border-gray-700"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="bg-gray-800 border-gray-700">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="expense">Gasto</SelectItem>
                <SelectItem value="income">Ingreso</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-gray-800 border-gray-700">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 max-h-52">
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start bg-gray-800 border-gray-700">
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateFilter ? format(dateFilter, 'PPP', { locale: es }) : <span>Seleccionar fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                <CalendarComponent
                  locale={es}
                  mode="single"
                  selected={dateFilter}
                  onSelect={setDateFilter}
                  initialFocus
                  className="bg-gray-800"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700"
              disabled={activeFiltersCount === 0}
            >
              <CircleSlash className="mr-1 h-4 w-4" />
              Limpiar filtros
            </Button>
          </div>
        </div>
      )}

      {/* Results count and pagination */}
      {!isLoading && (
        <div className="flex flex-wrap justify-between items-center text-sm text-gray-400 mb-2">
          <div>
            Mostrando {paginatedTransactions.length} de {filteredTransactions.length} transacciones
          </div>
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page > 1 ? page - 1 : 1)}
                disabled={page === 1}
                className="h-8 px-2"
              >
                Anterior
              </Button>
              <span className="text-sm">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
                disabled={page === totalPages}
                className="h-8 px-2"
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Transactions display */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-pulse flex flex-col space-y-4 w-full">
            <div className="h-10 bg-gray-700 rounded w-1/4"></div>
            <div className="h-20 bg-gray-800 rounded"></div>
            <div className="h-20 bg-gray-800 rounded"></div>
            <div className="h-20 bg-gray-800 rounded"></div>
          </div>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center py-8 bg-gray-800 rounded-lg">
          <p className="text-gray-400">No se encontraron transacciones.</p>
          {activeFiltersCount > 0 && (
            <Button 
              variant="link" 
              onClick={clearFilters}
              className="mt-2 text-finflow-mint"
            >
              Limpiar filtros para ver todas las transacciones
            </Button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        // Table view
        <div className="rounded-md border border-gray-700 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-320px)] min-h-[300px]">
            <Table>
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="bg-gray-800 hover:bg-gray-800">
                  <TableHead 
                    className="cursor-pointer w-[120px]"
                    onClick={() => handleSort('date')}
                  >
                    Fecha {getSortIndicator('date')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('description')}
                  >
                    Descripción {getSortIndicator('description')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hidden md:table-cell"
                    onClick={() => handleSort('category')}
                  >
                    Categoría {getSortIndicator('category')}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Tipo</TableHead>
                  <TableHead 
                    className="cursor-pointer text-right"
                    onClick={() => handleSort('amount')}
                  >
                    Monto {getSortIndicator('amount')}
                  </TableHead>
                  <TableHead className="text-right w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.map((transaction) => (
                  <TableRow key={transaction.id} className="border-t border-gray-700 hover:bg-gray-800">
                    <TableCell className="font-medium">
                      {transaction.transaction_date 
                        ? format(new Date(transaction.transaction_date), 'dd MMM yyyy', { locale: es }) 
                        : format(new Date(transaction.created_at || ''), 'dd MMM yyyy', { locale: es })}
                    </TableCell>
                    <TableCell className="font-medium truncate max-w-[200px]">
                      {transaction.description}
                      <div className="text-xs text-gray-400 md:hidden">
                        {transaction.category?.name || 'Sin categoría'}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {transaction.category?.name 
                        ? transaction.category.name
                        : 'Sin categoría'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge className={`${
                        transaction.type === 'income' 
                          ? 'bg-green-900 hover:bg-green-800 text-green-200' 
                          : 'bg-red-900 hover:bg-red-800 text-red-200'
                      }`}>
                        {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={transaction.type === 'income' ? 'text-green-300' : 'text-red-300'}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right p-2">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(transaction)}
                          className="h-7 w-7"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(transaction)}
                          className="h-7 w-7 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      ) : (
        // Card view (better for mobile)
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedTransactions.map((transaction) => (
            <Card 
              key={transaction.id} 
              className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors"
            >
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{transaction.description}</h3>
                    <p className="text-sm text-gray-400">
                      {transaction.category?.name || 'Sin categoría'}
                    </p>
                  </div>
                  <Badge className={`${
                    transaction.type === 'income' 
                      ? 'bg-green-900 hover:bg-green-800 text-green-200' 
                      : 'bg-red-900 hover:bg-red-800 text-red-200'
                  }`}>
                    {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-400">
                    {transaction.transaction_date 
                      ? format(new Date(transaction.transaction_date), 'PPP', { locale: es }) 
                      : format(new Date(transaction.created_at || ''), 'PPP', { locale: es })}
                  </div>
                  <div className={`font-bold ${transaction.type === 'income' ? 'text-green-300' : 'text-red-300'}`}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-700">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(transaction)}
                    className="h-8"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(transaction)}
                    className="h-8 hover:text-red-400 hover:border-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination control */}
      {!isLoading && totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="h-8 px-2"
            >
              Primera
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page > 1 ? page - 1 : 1)}
              disabled={page === 1}
              className="h-8 px-2"
            >
              Anterior
            </Button>
            
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber: number;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (page <= 3) {
                  pageNumber = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = page - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNumber}
                    variant={page === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pageNumber)}
                    className="h-8 w-8 px-0"
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
              disabled={page === totalPages}
              className="h-8 px-2"
            >
              Siguiente
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="h-8 px-2"
            >
              Última
            </Button>
          </div>
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
            <DialogTitle>Eliminar Transacción</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta transacción? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button onClick={handleDeleteTransaction} variant="destructive">
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 