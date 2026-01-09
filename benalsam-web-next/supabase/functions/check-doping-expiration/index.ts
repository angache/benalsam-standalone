/**
 * Supabase Edge Function: Check Doping Expiration
 * 
 * This function is called by Supabase Cron Jobs to check and expire
 * doping features that have passed their expiration date.
 * 
 * Schedule: Daily at 02:00 AM (0 2 * * *)
 * 
 * To set up the cron job in Supabase Dashboard:
 * 1. Go to Database > Cron Jobs
 * 2. Create new cron job
 * 3. Schedule: 0 2 * * *
 * 4. SQL Command: SELECT check_doping_expiration();
 * 
 * Or use HTTP endpoint:
 * Schedule: 0 2 * * *
 * HTTP Request: POST https://your-project.supabase.co/functions/v1/check-doping-expiration
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Call the database function to check and expire dopings
    const { data, error } = await supabase.rpc('check_doping_expiration')

    if (error) {
      console.error('Error checking doping expiration:', error)
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Failed to check doping expiration',
            details: error.message,
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const result = Array.isArray(data) && data.length > 0 ? data[0] : data

    console.log('Doping expiration check completed:', result)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          message: 'Doping expiration check completed',
          stats: {
            expiredCount: result?.expired_count || 0,
            notificationsSent: result?.notifications_sent || 0,
          },
          timestamp: new Date().toISOString(),
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: 'Internal server error',
          details: error instanceof Error ? error.message : String(error),
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

