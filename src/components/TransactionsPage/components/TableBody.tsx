
import { TableBody as ShadcnTableBody, TableCell, TableRow } from '@/components/ui/table';
import { Edit, Trash2 } from 'lucide-react';
import { formatCurrency, formatShortDate } from '@/utils/formatters';
import { Badge } from '@/components/ui/badge';
import { Transaction } from '@/types';

interface TableBodyProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

export const TransactionsTableBody = ({ transactions, onEdit, onDelete }: TableBodyProps) => {
  return (
    <ShadcnTableBody>
      {transactions.length === 0 ? (
        <TableRow>
          <TableCell colSpan={5} className="h-24 text-center">
            No se encontraron transacciones.
          </TableCell>
        </TableRow>
      ) : (
        transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell>{formatShortDate(transaction.date)}</TableCell>
            <TableCell>{transaction.description}</TableCell>
            <TableCell>
              {transaction.category && (
                <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                  {transaction.category.name}
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(transaction.amount)}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => onEdit(transaction)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(transaction)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))
      )}
    </ShadcnTableBody>
  );
};

export default TransactionsTableBody; 
