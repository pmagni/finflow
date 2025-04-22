// Script para verificar las transacciones en Supabase
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno para Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const USER_ID = 'fb401632-d45e-44fc-86c9-5bb2ffb42346';

async function verify() {
  try {
    console.log('🔍 Verificando transacciones para el usuario con ID:', USER_ID);
    
    // Obtener las transacciones del usuario
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        id,
        type,
        description,
        amount,
        category_id,
        transaction_date,
        currency,
        created_at,
        category:categories(name, icon)
      `)
      .eq('user_id', USER_ID)
      .order('transaction_date', { ascending: false });
      
    if (error) {
      throw new Error(`Error al obtener transacciones: ${error.message}`);
    }
    
    console.log(`✅ Encontradas ${transactions.length} transacciones para el usuario`);
    
    // Mostrar resumen de transacciones
    if (transactions.length > 0) {
      console.log('\n📊 Resumen de transacciones:');
      
      // Agrupar por mes
      const transactionsByMonth = {};
      transactions.forEach(t => {
        const date = new Date(t.transaction_date);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        
        if (!transactionsByMonth[monthKey]) {
          transactionsByMonth[monthKey] = [];
        }
        
        transactionsByMonth[monthKey].push(t);
      });
      
      // Mostrar resumen por mes
      Object.keys(transactionsByMonth).sort().forEach(monthKey => {
        const monthTransactions = transactionsByMonth[monthKey];
        const total = monthTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const [year, month] = monthKey.split('-');
        const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString('default', { month: 'long' });
        
        console.log(`\n📅 ${monthName} ${year} (${monthTransactions.length} transacciones) - Total: $${total.toFixed(2)}`);
        
        // Agrupar por categoría
        const byCategory = {};
        monthTransactions.forEach(t => {
          const categoryName = t.category?.name || 'Sin categoría';
          
          if (!byCategory[categoryName]) {
            byCategory[categoryName] = { count: 0, total: 0 };
          }
          
          byCategory[categoryName].count++;
          byCategory[categoryName].total += Number(t.amount);
        });
        
        // Mostrar por categoría
        Object.keys(byCategory).forEach(category => {
          const { count, total } = byCategory[category];
          console.log(`   - ${category}: ${count} transacciones ($${total.toFixed(2)})`);
        });
      });
      
      // Mostrar las últimas 5 transacciones
      console.log('\n📝 Últimas 5 transacciones:');
      transactions.slice(0, 5).forEach((t, i) => {
        console.log(`   ${i + 1}. ${new Date(t.transaction_date).toLocaleDateString()} - ${t.description} - $${t.amount} (${t.category?.name || 'Sin categoría'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verify(); 