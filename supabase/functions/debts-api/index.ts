
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const debtId = pathParts[pathParts.length - 1]

    switch (req.method) {
      case 'GET': {
        if (debtId && debtId !== 'debts-api') {
          // Get specific debt
          const { data, error } = await supabase
            .from('debts')
            .select('*')
            .eq('id', debtId)
            .eq('user_id', user.id)
            .single()

          if (error) throw error
          return new Response(JSON.stringify(data), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          })
        } else {
          // Get all debts for user
          const { data, error } = await supabase
            .from('debts')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

          if (error) throw error
          return new Response(JSON.stringify(data), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          })
        }
      }

      case 'POST': {
        const debtData = await req.json()
        const { data, error } = await supabase
          .from('debts')
          .insert({ ...debtData, user_id: user.id })
          .select()
          .single()

        if (error) throw error
        return new Response(JSON.stringify(data), { 
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      case 'PUT': {
        const debtData = await req.json()
        const { data, error } = await supabase
          .from('debts')
          .update(debtData)
          .eq('id', debtId)
          .eq('user_id', user.id)
          .select()
          .single()

        if (error) throw error
        return new Response(JSON.stringify(data), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      case 'DELETE': {
        const { error } = await supabase
          .from('debts')
          .delete()
          .eq('id', debtId)
          .eq('user_id', user.id)

        if (error) throw error
        return new Response(JSON.stringify({ message: 'Debt deleted successfully' }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { 
            status: 405, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
