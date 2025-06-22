
import * as z from "zod";
import { 
  currencyAmount, 
  transactionTypeValidator, 
  transactionDateValidator,
  descriptionString 
} from '@/utils/validators';

export const transactionFormSchema = z.object({
  type: transactionTypeValidator,
  description: descriptionString,
  category: z.string({
    required_error: "La categoría es obligatoria"
  }).min(1, "La categoría es obligatoria"),
  amount: currencyAmount,
  transaction_date: transactionDateValidator,
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
