import { Search, CircleSlash, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Category {
  id: string;
  name: string;
  icon: string;
  transaction_type: 'income' | 'expense' | string;
}

interface FiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  dateFilter: DateRange | undefined;
  setDateFilter: (range: DateRange | undefined) => void;
  categories: Category[];
  onClearFilters: () => void;
}

export const TransactionsFilters = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  dateFilter,
  setDateFilter,
  categories,
  onClearFilters,
}: FiltersProps) => {
  return (
    <div className="flex flex-wrap gap-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar transacciones..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Categoría" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las categorías</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.name}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[180px] justify-start">
            <Calendar className="mr-2 h-4 w-4" />
            {dateFilter?.from ? (
              dateFilter.to ? (
                <>
                  {format(dateFilter.from, 'dd/MM/yyyy')} - {format(dateFilter.to, 'dd/MM/yyyy')}
                </>
              ) : (
                format(dateFilter.from, 'dd/MM/yyyy')
              )
            ) : (
              <span>Rango de fechas</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            initialFocus
            mode="range"
            defaultMonth={dateFilter?.from}
            selected={dateFilter}
            onSelect={setDateFilter}
            numberOfMonths={2}
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      <Button variant="outline" onClick={onClearFilters}>
        <CircleSlash className="mr-2 h-4 w-4" />
        Limpiar filtros
      </Button>
    </div>
  );
};

export default TransactionsFilters; 
