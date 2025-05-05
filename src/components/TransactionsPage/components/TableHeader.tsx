import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface TableHeaderProps {
  sortField: 'date' | 'amount' | 'description' | 'category';
  sortDirection: 'asc' | 'desc';
  onSort: (field: 'date' | 'amount' | 'description' | 'category') => void;
}

export const TransactionsTableHeader = ({ sortField, sortDirection, onSort }: TableHeaderProps) => {
  const getSortIndicator = (field: 'date' | 'amount' | 'description' | 'category') => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  return (
    <TableHeader>
      <TableRow>
        <TableHead className="cursor-pointer" onClick={() => onSort('date')}>
          <div className="flex items-center gap-1">
            Fecha {getSortIndicator('date')}
          </div>
        </TableHead>
        <TableHead className="cursor-pointer" onClick={() => onSort('description')}>
          <div className="flex items-center gap-1">
            Descripción {getSortIndicator('description')}
          </div>
        </TableHead>
        <TableHead className="cursor-pointer" onClick={() => onSort('category')}>
          <div className="flex items-center gap-1">
            Categoría {getSortIndicator('category')}
          </div>
        </TableHead>
        <TableHead className="cursor-pointer text-right" onClick={() => onSort('amount')}>
          <div className="flex items-center justify-end gap-1">
            Monto {getSortIndicator('amount')}
          </div>
        </TableHead>
        <TableHead className="text-right">Acciones</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default TransactionsTableHeader; 