// Setup type definitions for built-in Supabase Runtime APIs
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
Deno.serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Get request body
    const { userId, token, notification, type = 'single' } = await req.json();
    // Validate request
    if (!notification || !notification.title || !notification.body) {
      return new Response(JSON.stringify({
        error: 'Missing required notification fields'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    let tokens = [];
    // Get tokens based on type
    if (type === 'single' && token) {
      tokens = [
        token
      ];
    } else if (type === 'user' && userId) {
      // Get user's active tokens from database
      const { data: userTokens, error: tokenError } = await supabase.from('fcm_tokens').select('token').eq('user_id', userId).eq('is_active', true);
      if (tokenError) {
        console.error('Error fetching user tokens:', tokenError);
        return new Response(JSON.stringify({
          error: 'Failed to fetch user tokens'
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      tokens = userTokens?.map((t)=>t.token) || [];
    } else if (type === 'broadcast') {
      // Get all active tokens (for broadcast)
      const { data: allTokens, error: tokenError } = await supabase.from('fcm_tokens').select('token').eq('is_active', true);
      if (tokenError) {
        console.error('Error fetching all tokens:', tokenError);
        return new Response(JSON.stringify({
          error: 'Failed to fetch tokens'
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      tokens = allTokens?.map((t)=>t.token) || [];
    }
    if (tokens.length === 0) {
      return new Response(JSON.stringify({
        error: 'No tokens found for notification'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Prepare notification payload for Expo
    const expoPayload = {
      to: tokens,
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      sound: notification.sound || 'default',
      badge: notification.badge,
      channelId: notification.channelId,
      priority: notification.priority || 'default',
      ...notification.image && {
        image: notification.image
      }
    };
    // Send notification via Expo Push API
    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate'
      },
      body: JSON.stringify(expoPayload)
    });
    if (!expoResponse.ok) {
      const errorText = await expoResponse.text();
      console.error('Expo API error:', errorText);
      return new Response(JSON.stringify({
        error: 'Failed to send notification via Expo'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const expoResult = await expoResponse.json();
    // Log notification to database
    try {
      await supabase.from('notification_logs').insert({
        user_id: userId,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        type: type,
        tokens_sent: tokens.length,
        expo_response: expoResult,
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Error logging notification:', logError);
    // Don't fail the request if logging fails
    }
    return new Response(JSON.stringify({
      success: true,
      message: `Notification sent to ${tokens.length} device(s)`,
      expoResult
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in send-notification function:', error);
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
