
import { z } from 'zod';

// Validaciones personalizadas
export const positiveNumber = z.number().positive('El valor debe ser positivo');
export const nonNegativeNumber = z.number().nonnegative('El valor no puede ser negativo');

export const currencyAmount = z.number()
  .min(1, 'El monto debe ser mayor a 0')
  .max(999999999, 'El monto es demasiado grande')
  .refine((val) => Number.isInteger(val), 'El monto debe ser un número entero');

export const percentage = z.number()
  .min(0, 'El porcentaje no puede ser negativo')
  .max(100, 'El porcentaje no puede ser mayor a 100');

export const futureDate = z.date().refine(
  (date) => date > new Date(),
  'La fecha debe ser en el futuro'
);

export const pastOrPresentDate = z.date().refine(
  (date) => date <= new Date(),
  'La fecha no puede ser en el futuro'
);

// Validaciones de texto
export const nonEmptyString = z.string().min(1, 'Este campo es obligatorio').trim();
export const descriptionString = z.string()
  .min(3, 'La descripción debe tener al menos 3 caracteres')
  .max(200, 'La descripción no puede exceder 200 caracteres')
  .trim();

// Validación de email
export const emailValidator = z.string()
  .email('Formato de email inválido')
  .min(1, 'El email es obligatorio');

// Validaciones específicas para finanzas
export const monthlyIncomeValidator = z.number()
  .min(100000, 'El ingreso mensual debe ser al menos $100.000')
  .max(50000000, 'El ingreso mensual no puede exceder $50.000.000');

export const interestRateValidator = z.number()
  .min(0, 'La tasa de interés no puede ser negativa')
  .max(100, 'La tasa de interés no puede exceder 100%');

// Función para validar montos basados en el ingreso
export const validateAmountAgainstIncome = (amount: number, income: number): boolean => {
  return amount <= income * 0.5; // No más del 50% del ingreso
};

// Validación de categorías permitidas
export const allowedTransactionTypes = ['income', 'expense'] as const;
export const transactionTypeValidator = z.enum(allowedTransactionTypes, {
  errorMap: () => ({ message: 'Tipo de transacción inválido' })
});

// Validación de fecha de transacción (no más de 1 año en el pasado, no en el futuro)
export const transactionDateValidator = z.date()
  .refine(
    (date) => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return date >= oneYearAgo;
    },
    'La fecha no puede ser mayor a 1 año en el pasado'
  )
  .refine(
    (date) => date <= new Date(),
    'La fecha no puede ser en el futuro'
  );

// Función para sanitizar entrada de texto
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

// Validación de campos requeridos en formularios
export const requiredFieldValidator = (fieldName: string) => 
  z.string().min(1, `${fieldName} es obligatorio`).trim();
