
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UserAnalytics {
  userId: string;
  totalTransactions: number;
  totalExpenses: number;
  totalIncome: number;
  averageMonthlySpending: number;
  topSpendingCategories: Array<{ category: string; amount: number; percentage: number }>;
  monthlyTrends: Array<{ month: string; income: number; expenses: number; balance: number }>;
  financialHealth: {
    score: number;
    trends: Array<{ date: string; score: number }>;
  };
  achievements: Array<{ title: string; description: string; achieved_at: string }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verificar autenticación
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = user.id

    // Obtener datos del usuario
    const [
      transactionsResult,
      healthScoresResult,
      achievementsResult
    ] = await Promise.all([
      // Transacciones del usuario
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      
      // Puntuaciones de salud financiera
      supabase
        .from('financial_health_scores')
        .select('*')
        .eq('user_id', userId)
        .order('calculated_at', { ascending: false }),
      
      // Logros del usuario
      supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userId)
        .order('achieved_at', { ascending: false })
    ])

    const transactions = transactionsResult.data || []
    const healthScores = healthScoresResult.data || []
    const achievements = achievementsResult.data || []

    // Calcular métricas
    const totalTransactions = transactions.length
    const totalExpenses = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const totalIncome = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)

    // Promedio mensual de gastos
    const monthsWithTransactions = new Set(
      transactions.map(t => new Date(t.created_at).toISOString().slice(0, 7))
    ).size
    const averageMonthlySpending = monthsWithTransactions > 0 
      ? totalExpenses / monthsWithTransactions 
      : 0

    // Top categorías de gastos
    const categoryTotals = new Map()
    transactions
      .filter(t => t.amount < 0)
      .forEach(t => {
        const current = categoryTotals.get(t.category) || 0
        categoryTotals.set(t.category, current + Math.abs(t.amount))
      })

    const topSpendingCategories = Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: Math.round((amount / totalExpenses) * 100 * 100) / 100
      }))

    // Tendencias mensuales
    const monthlyData = new Map()
    transactions.forEach(t => {
      const month = new Date(t.created_at).toISOString().slice(0, 7)
      const current = monthlyData.get(month) || { income: 0, expenses: 0 }
      
      if (t.amount > 0) {
        current.income += t.amount
      } else {
        current.expenses += Math.abs(t.amount)
      }
      
      monthlyData.set(month, current)
    })

    const monthlyTrends = Array.from(monthlyData.entries())
      .sort()
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        balance: data.income - data.expenses
      }))

    // Salud financiera
    const financialHealth = {
      score: healthScores[0]?.score || 0,
      trends: healthScores.slice(0, 12).map(h => ({
        date: h.calculated_at.slice(0, 10),
        score: h.score
      }))
    }

    const analytics: UserAnalytics = {
      userId,
      totalTransactions,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      totalIncome: Math.round(totalIncome * 100) / 100,
      averageMonthlySpending: Math.round(averageMonthlySpending * 100) / 100,
      topSpendingCategories,
      monthlyTrends,
      financialHealth,
      achievements: achievements.map(a => ({
        title: a.title,
        description: a.description,
        achieved_at: a.achieved_at
      }))
    }

    console.log('User analytics calculated for user:', userId)

    return new Response(
      JSON.stringify(analytics),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in user-analytics function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
