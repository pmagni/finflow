import { TransactionForm } from '@/components/ExpenseOverview/TransactionForm';

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
}

interface EditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction;
}

export const TransactionsEditDialog = ({
  isOpen,
  onOpenChange,
  transaction,
}: EditDialogProps) => {
  return (
    <TransactionForm
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      transaction={transaction}
    />
  );
};

export default TransactionsEditDialog; 