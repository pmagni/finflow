-- Agregar columna is_active a la tabla debts
ALTER TABLE debts
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Actualizar registros existentes
UPDATE debts
SET is_active = true
WHERE is_active IS NULL; 