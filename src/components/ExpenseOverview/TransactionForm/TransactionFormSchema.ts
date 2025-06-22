
import * as z from "zod";

export const transactionFormSchema = z.object({
  type: z.enum(["expense", "income"]),
  description: z.string().min(1, "La descripción es obligatoria"),
  category: z.string({
    required_error: "La categoría es obligatoria"
  }).min(1, "La categoría es obligatoria"),
  amount: z.coerce
    .number()
    .positive("El monto debe ser positivo")
    .int("El monto debe ser un número entero")
    .min(1, "El monto debe ser mayor a 0"),
  transaction_date: z.date({
    required_error: "La fecha es obligatoria",
  }),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
