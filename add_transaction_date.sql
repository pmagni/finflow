-- Agregar columna transaction_date a la tabla transactions
ALTER TABLE public.transactions
ADD COLUMN transaction_date TIMESTAMPTZ DEFAULT NULL;

-- Actualizar la columna transaction_date con los valores de created_at para registros existentes
UPDATE public.transactions
SET transaction_date = created_at
WHERE transaction_date IS NULL;

-- Agregar un comentario a la columna para documentación
COMMENT ON COLUMN public.transactions.transaction_date IS 'La fecha en que ocurrió la transacción (puede ser diferente a created_at)';

-- Actualizar políticas RLS si es necesario
-- Asegúrate de que las políticas RLS existentes apliquen también a la nueva columna 