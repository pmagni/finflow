
import * as z from "zod";

export interface Category {
  id: string;
  name: string;
  icon: string;
  transaction_type: 'income' | 'expense';
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export const transactionFormSchema = z.object({
  type: z.enum(["expense", "income"]),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
