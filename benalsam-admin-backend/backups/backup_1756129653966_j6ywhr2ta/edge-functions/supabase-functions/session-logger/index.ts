// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
Deno.serve(async (req)=>{
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  // Method validation
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
  try {
    // 1. Get request body
    const requestBody = await req.json();
    const { action = 'activity', metadata = {} } = requestBody;
    // 2. Enhanced IP detection (Public IP)
    const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || req.headers.get('x-client-ip') || 'unknown';
    // 3. IP format validation
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    if (ip !== 'unknown' && !ipRegex.test(ip)) {
      return new Response(JSON.stringify({
        error: 'Invalid IP address'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // 4. Get User Agent
    const userAgent = req.headers.get('user-agent') || 'unknown';
    // 5. Initialize Supabase client
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
    // 6. Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: 'Authorization required'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({
        error: 'Invalid session'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // 7. Get session ID from JWT token
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const sessionId = payload.session_id;
    const timestamp = new Date().toISOString();
    // 8. Check for IP change in existing session
    const { data: existingSession } = await supabaseClient.from('user_session_logs').select('ip_address, metadata').eq('session_id', sessionId).eq('status', 'active').single();
    const previousIP = existingSession?.ip_address;
    const ipChanged = previousIP && previousIP !== ip;
    // 9. Enhanced metadata with IP tracking
    const enhancedMetadata = {
      ...metadata,
      action,
      timestamp,
      platform: 'mobile',
      current_ip: ip,
      ip_changed: ipChanged,
      previous_ip: ipChanged ? previousIP : undefined,
      ip_change_count: ipChanged ? (existingSession?.metadata?.ip_change_count || 0) + 1 : existingSession?.metadata?.ip_change_count || 0
    };
    // 10. Simple session logging with IP tracking (database constraint handles duplicates)
    const { data, error } = await supabaseClient.from('user_session_logs').upsert([
      {
        session_id: sessionId,
        user_id: user.id,
        ip_address: ip,
        user_agent: userAgent,
        session_start: action === 'login' ? timestamp : undefined,
        last_activity: timestamp,
        status: action === 'logout' ? 'terminated' : 'active',
        session_end: action === 'logout' ? timestamp : undefined,
        session_duration: action === 'logout' ? `(${timestamp}::timestamp - session_start)::interval` : undefined,
        legal_basis: 'legitimate_interest',
        metadata: enhancedMetadata
      }
    ], {
      onConflict: 'user_id,session_id'
    }).select().single();
    if (error) {
      console.error('❌ Session logging error:', error);
      return new Response(JSON.stringify({
        error: 'Failed to log session'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('✅ Session logged successfully:', {
      user_id: user.id,
      session_id: sessionId,
      action,
      status: data?.status,
      ip,
      ip_changed: ipChanged
    });
    return new Response(JSON.stringify({
      success: true,
      action,
      session_id: sessionId,
      timestamp,
      ip_changed: ipChanged
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('❌ Edge function error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
