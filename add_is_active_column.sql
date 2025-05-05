-- Agregar columna is_active a la tabla debt_plans
ALTER TABLE debt_plans
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Actualizar registros existentes
UPDATE debt_plans
SET is_active = true
WHERE is_active IS NULL; 