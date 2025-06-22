
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalRevenue: number;
  averageHealthScore: number;
  topCategories: Array<{ category: string; total: number }>;
  userGrowth: Array<{ date: string; count: number }>;
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

    // Verificar que el usuario sea admin
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

    // Verificar rol de admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (!userRole) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Obtener métricas
    const [
      totalUsersResult,
      activeUsersResult,
      totalTransactionsResult,
      topCategoriesResult,
      healthScoresResult,
      userGrowthResult
    ] = await Promise.all([
      // Total de usuarios
      supabase.from('profiles').select('id', { count: 'exact' }),
      
      // Usuarios activos (con transacciones en los últimos 30 días)
      supabase
        .from('transactions')
        .select('user_id', { count: 'exact' })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      
      // Total de transacciones
      supabase.from('transactions').select('id, amount', { count: 'exact' }),
      
      // Top categorías
      supabase
        .from('transactions')
        .select('category, amount')
        .limit(1000),
      
      // Puntuaciones de salud promedio
      supabase
        .from('financial_health_scores')
        .select('score'),
      
      // Crecimiento de usuarios por mes
      supabase
        .from('profiles')
        .select('created_at')
    ])

    // Procesar datos
    const totalUsers = totalUsersResult.count || 0
    const activeUsers = new Set(activeUsersResult.data?.map(t => t.user_id)).size
    const totalTransactions = totalTransactionsResult.count || 0
    
    // Calcular revenue total (suma de ingresos)
    const totalRevenue = totalTransactionsResult.data
      ?.filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0) || 0

    // Top categorías
    const categoryTotals = new Map()
    topCategoriesResult.data?.forEach(t => {
      const current = categoryTotals.get(t.category) || 0
      categoryTotals.set(t.category, current + Math.abs(t.amount))
    })
    
    const topCategories = Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, total]) => ({ category, total }))

    // Promedio de health score
    const scores = healthScoresResult.data?.map(h => h.score) || []
    const averageHealthScore = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
      : 0

    // Crecimiento de usuarios
    const usersByMonth = new Map()
    userGrowthResult.data?.forEach(profile => {
      const date = new Date(profile.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      usersByMonth.set(monthKey, (usersByMonth.get(monthKey) || 0) + 1)
    })

    const userGrowth = Array.from(usersByMonth.entries())
      .sort()
      .map(([date, count]) => ({ date, count }))

    const metrics: AdminMetrics = {
      totalUsers,
      activeUsers,
      totalTransactions,
      totalRevenue,
      averageHealthScore: Math.round(averageHealthScore * 100) / 100,
      topCategories,
      userGrowth
    }

    console.log('Admin metrics calculated:', metrics)

    return new Response(
      JSON.stringify(metrics),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in admin-metrics function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
