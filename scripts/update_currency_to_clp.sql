-- Script para actualizar todas las transacciones a moneda CLP
-- Este script realiza las siguientes operaciones:
-- 1. Actualiza la moneda de todas las transacciones a 'CLP'
-- 2. Convierte los montos a formato CLP (multiplicando por 1000 para simular valores en miles)

-- Actualizar moneda y formatear montos para el usuario específico
DO $$
DECLARE
    user_id UUID := 'fb401632-d45e-44fc-86c9-5bb2ffb42346';
BEGIN
    -- Actualizar la moneda a CLP para todas las transacciones del usuario
    UPDATE transactions
    SET currency = 'CLP',
        -- Multiplicamos los montos por 1000 para convertirlos a formato chileno
        amount = amount * 1000
    WHERE user_id = user_id;
    
    -- Confirmar actualización
    RAISE NOTICE 'Se han actualizado las transacciones del usuario % a moneda CLP', user_id;
END $$; 