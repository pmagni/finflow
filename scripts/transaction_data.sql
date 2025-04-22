-- Script para insertar transacciones de prueba
-- Para el usuario con ID: fb401632-d45e-44fc-86c9-5bb2ffb42346

-- Primero, crear categorías si no existen
DO $$
DECLARE
    user_id UUID := 'fb401632-d45e-44fc-86c9-5bb2ffb42346';
    food_id UUID;
    transport_id UUID;
    groceries_id UUID;
    entertainment_id UUID;
    subscriptions_id UUID;
    utilities_id UUID;
    gifts_id UUID;
BEGIN
    -- Verificar si las categorías existen, si no, crearlas
    
    -- Categoría: Food
    SELECT id INTO food_id FROM categories WHERE name = 'food' AND (user_id IS NULL OR user_id = user_id);
    IF food_id IS NULL THEN
        INSERT INTO categories (name, icon, transaction_type, user_id)
        VALUES ('food', 'utensils', 'expense', user_id)
        RETURNING id INTO food_id;
    END IF;
    
    -- Categoría: Transport
    SELECT id INTO transport_id FROM categories WHERE name = 'transport' AND (user_id IS NULL OR user_id = user_id);
    IF transport_id IS NULL THEN
        INSERT INTO categories (name, icon, transaction_type, user_id)
        VALUES ('transport', 'car', 'expense', user_id)
        RETURNING id INTO transport_id;
    END IF;
    
    -- Categoría: Groceries
    SELECT id INTO groceries_id FROM categories WHERE name = 'groceries' AND (user_id IS NULL OR user_id = user_id);
    IF groceries_id IS NULL THEN
        INSERT INTO categories (name, icon, transaction_type, user_id)
        VALUES ('groceries', 'shopping-cart', 'expense', user_id)
        RETURNING id INTO groceries_id;
    END IF;
    
    -- Categoría: Entertainment
    SELECT id INTO entertainment_id FROM categories WHERE name = 'entertainment' AND (user_id IS NULL OR user_id = user_id);
    IF entertainment_id IS NULL THEN
        INSERT INTO categories (name, icon, transaction_type, user_id)
        VALUES ('entertainment', 'film', 'expense', user_id)
        RETURNING id INTO entertainment_id;
    END IF;
    
    -- Categoría: Subscriptions
    SELECT id INTO subscriptions_id FROM categories WHERE name = 'subscriptions' AND (user_id IS NULL OR user_id = user_id);
    IF subscriptions_id IS NULL THEN
        INSERT INTO categories (name, icon, transaction_type, user_id)
        VALUES ('subscriptions', 'tv', 'expense', user_id)
        RETURNING id INTO subscriptions_id;
    END IF;
    
    -- Categoría: Utilities
    SELECT id INTO utilities_id FROM categories WHERE name = 'utilities' AND (user_id IS NULL OR user_id = user_id);
    IF utilities_id IS NULL THEN
        INSERT INTO categories (name, icon, transaction_type, user_id)
        VALUES ('utilities', 'home', 'expense', user_id)
        RETURNING id INTO utilities_id;
    END IF;
    
    -- Categoría: Gifts
    SELECT id INTO gifts_id FROM categories WHERE name = 'gifts' AND (user_id IS NULL OR user_id = user_id);
    IF gifts_id IS NULL THEN
        INSERT INTO categories (name, icon, transaction_type, user_id)
        VALUES ('gifts', 'gift', 'expense', user_id)
        RETURNING id INTO gifts_id;
    END IF;
    
    -- Insertar transacciones de ejemplo
    
    -- 2024 MOCK DATA
    INSERT INTO transactions (type, description, amount, category_id, user_id, transaction_date, currency)
    VALUES 
        ('expense', 'lunch', 12, food_id, user_id, '2024-10-10', '$'),
        ('expense', 'BIP', 22, transport_id, user_id, '2024-10-12', '$'),
        ('expense', 'super', 85, groceries_id, user_id, '2024-10-28', '$'),
        ('expense', 'cine', 40, entertainment_id, user_id, '2024-11-05', '$'),
        ('expense', 'lunch', 18, food_id, user_id, '2024-11-11', '$'),
        ('expense', 'Netflix', 12, subscriptions_id, user_id, '2024-11-23', '$'),
        ('expense', 'GGCC', 90, utilities_id, user_id, '2024-12-01', '$'),
        ('expense', 'Super', 130, groceries_id, user_id, '2024-12-17', '$'),
        ('expense', 'Lime', 55, transport_id, user_id, '2024-12-21', '$'),
        ('expense', 'regalo Juan', 75, gifts_id, user_id, '2024-12-29', '$');
        
    -- 2025 MOCK DATA
    INSERT INTO transactions (type, description, amount, category_id, user_id, transaction_date, currency)
    VALUES 
        ('expense', 'lunch', 15, food_id, user_id, '2025-01-05', '$'),
        ('expense', 'Bip', 40, transport_id, user_id, '2025-01-12', '$'),
        ('expense', 'carrete', 30, entertainment_id, user_id, '2025-01-20', '$'),
        ('expense', 'F1Tv', 10, subscriptions_id, user_id, '2025-01-25', '$'),
        ('expense', 'super', 120, groceries_id, user_id, '2025-02-03', '$'),
        ('expense', 'regalo Coni', 60, gifts_id, user_id, '2025-02-07', '$'),
        ('expense', 'lunch', 18, food_id, user_id, '2025-02-11', '$'),
        ('expense', 'Lime', 60, transport_id, user_id, '2025-02-25', '$'),
        ('expense', 'Luz', 95, utilities_id, user_id, '2025-03-01', '$'),
        ('expense', 'Whoosh', 35, transport_id, user_id, '2025-03-05', '$'),
        ('expense', 'lunch', 15, food_id, user_id, '2025-03-12', '$'),
        ('expense', 'lunch', 22, food_id, user_id, '2025-03-15', '$'),
        ('expense', 'teatro', 50, entertainment_id, user_id, '2025-03-19', '$'),
        ('expense', 'cine', 45, entertainment_id, user_id, '2025-03-22', '$'),
        ('expense', 'super', 110, groceries_id, user_id, '2025-03-28', '$');
END $$; 