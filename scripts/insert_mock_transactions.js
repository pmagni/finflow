// Script para insertar transacciones de prueba en Supabase
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFileSync } from 'fs';

// Configurar dotenv con la ruta correcta
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);

try {
  // Intentar cargar las variables de entorno
  dotenv.config({ path: `${rootDir}/.env` });
} catch (error) {
  console.error('❌ Error cargando variables de entorno:', error);
  process.exit(1);
}

// Verificar que las variables de entorno estén cargadas
console.log('📋 Variables de entorno cargadas correctamente');

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY son requeridas');
  console.log('Variables disponibles:', Object.keys(process.env).filter(k => k.startsWith('VITE_')));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ID del usuario
const USER_ID = 'fb401632-d45e-44fc-86c9-5bb2ffb42346';

// Array de gastos de prueba
const expenses = [
  // --- 2024 MOCK DATA ---
  { date: '2024-10-10', category: 'food', description: 'lunch', amount: 12, timeStamp: '12:15PM', currency: '$' },
  { date: '2024-10-12', category: 'transport', description: 'BIP', amount: 22, timeStamp: '07:45AM', currency: '$' },
  { date: '2024-10-28', category: 'groceries', description: 'super', amount: 85, timeStamp: '05:30PM', currency: '$' },
  { date: '2024-11-05', category: 'entertainment', description: 'cine', amount: 40, timeStamp: '08:00PM', currency: '$' },
  { date: '2024-11-11', category: 'food', description: 'lunch', amount: 18, timeStamp: '01:30PM', currency: '$' },
  { date: '2024-11-23', category: 'subscriptions', description: 'Netflix', amount: 12, timeStamp: '10:00AM', currency: '$' },
  { date: '2024-12-01', category: 'utilities', description: 'GGCC', amount: 90, timeStamp: '03:20PM', currency: '$' },
  { date: '2024-12-17', category: 'groceries', description: 'Super', amount: 130, timeStamp: '06:45PM', currency: '$' },
  { date: '2024-12-21', category: 'transport', description: 'Lime', amount: 55, timeStamp: '09:00AM', currency: '$' },
  { date: '2024-12-29', category: 'gifts', description: 'regalo Juan', amount: 75, timeStamp: '04:50PM', currency: '$' },

  // --- 2025 MOCK DATA ---
  { date: '2025-01-05', category: 'food', description: 'lunch', amount: 15, timeStamp: '11:00AM', currency: '$' },
  { date: '2025-01-12', category: 'transport', description: 'Bip', amount: 40, timeStamp: '08:30AM', currency: '$' },
  { date: '2025-01-20', category: 'entertainment', description: 'carrete', amount: 30, timeStamp: '09:15PM', currency: '$' },
  { date: '2025-01-25', category: 'subscriptions', description: 'F1Tv', amount: 10, timeStamp: '08:00AM', currency: '$' },
  { date: '2025-02-03', category: 'groceries', description: 'super', amount: 120, timeStamp: '04:00PM', currency: '$' },
  { date: '2025-02-07', category: 'gifts', description: 'regalo Coni', amount: 60, timeStamp: '05:15PM', currency: '$' },
  { date: '2025-02-11', category: 'food', description: 'lunch', amount: 18, timeStamp: '01:00PM', currency: '$' },
  { date: '2025-02-25', category: 'transport', description: 'Lime', amount: 60, timeStamp: '07:45AM', currency: '$' },
  { date: '2025-03-01', category: 'utilities', description: 'Luz', amount: 95, timeStamp: '02:30PM', currency: '$' },
  { date: '2025-03-05', category: 'transport', description: 'Whoosh', amount: 35, timeStamp: '10:30AM', currency: '$' },
  { date: '2025-03-12', category: 'food', description: 'lunch', amount: 15, timeStamp: '11:00AM', currency: '$' },
  { date: '2025-03-15', category: 'food', description: 'lunch', amount: 22, timeStamp: '12:45PM', currency: '$' },
  { date: '2025-03-19', category: 'entertainment', description: 'teatro', amount: 50, timeStamp: '09:00PM', currency: '$' },
  { date: '2025-03-22', category: 'entertainment', description: 'cine', amount: 45, timeStamp: '08:50PM', currency: '$' },
  { date: '2025-03-28', category: 'groceries', description: 'super', amount: 110, timeStamp: '06:15PM', currency: '$' },
];

async function run() {
  try {
    console.log('🔍 Obteniendo categorías existentes...');
    const { data: categories, error: categoryError } = await supabase
      .from('categories')
      .select('*');

    if (categoryError) {
      throw new Error(`Error al obtener categorías: ${categoryError.message}`);
    }

    console.log(`📋 Encontradas ${categories.length} categorías`);

    // Mapeo de nombres de categorías a IDs
    const categoryMap = {};
    categories.forEach(category => {
      categoryMap[category.name.toLowerCase()] = category.id;
    });

    console.log('🗂️ Mapa de categorías:', categoryMap);

    // Verificar si todas las categorías existen
    const missingCategories = expenses.filter(expense => 
      !categoryMap[expense.category.toLowerCase()]
    ).map(expense => expense.category);

    const uniqueMissingCategories = [...new Set(missingCategories)];
    
    if (uniqueMissingCategories.length > 0) {
      console.warn('⚠️ Las siguientes categorías no existen y serán creadas:', uniqueMissingCategories);
      
      // Crear categorías faltantes
      for (const categoryName of uniqueMissingCategories) {
        const { data: newCategory, error } = await supabase
          .from('categories')
          .insert({
            name: categoryName,
            icon: 'default',
            transaction_type: 'expense',
            user_id: USER_ID
          })
          .select()
          .single();
        
        if (error) {
          console.error(`❌ Error al crear categoría ${categoryName}:`, error);
          continue;
        }
        
        categoryMap[categoryName.toLowerCase()] = newCategory.id;
        console.log(`✅ Categoría creada: ${categoryName} con ID ${newCategory.id}`);
      }
    }

    console.log('💾 Iniciando inserción de transacciones...');
    
    // Preparar transacciones para insertar
    const transactionsToInsert = expenses.map(expense => ({
      type: 'expense',
      description: expense.description,
      amount: expense.amount,
      category_id: categoryMap[expense.category.toLowerCase()],
      user_id: USER_ID,
      transaction_date: expense.date,
      currency: expense.currency,
      created_at: new Date().toISOString()
    }));

    // Insertar transacciones en grupos de 10 para evitar límites de API
    const chunkSize = 10;
    for (let i = 0; i < transactionsToInsert.length; i += chunkSize) {
      const chunk = transactionsToInsert.slice(i, i + chunkSize);
      
      const { data, error } = await supabase
        .from('transactions')
        .insert(chunk)
        .select();
      
      if (error) {
        console.error(`❌ Error al insertar transacciones (grupo ${i/chunkSize + 1}):`, error);
      } else {
        console.log(`✅ Insertadas ${data.length} transacciones (grupo ${i/chunkSize + 1})`);
      }
    }

    console.log('🎉 Proceso completado!');

  } catch (error) {
    console.error('❌ Error en el script:', error);
  }
}

run(); 