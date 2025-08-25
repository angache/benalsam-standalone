import { corsHeaders } from "./cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Supabase URL or Service Role Key is not defined in environment variables.");
}
const supabaseAdmin = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({
      error: "Supabase client not initialized. Check server logs."
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
  try {
    const { userId, sessionId, activityType, targetId, targetType, details: clientDetails } = await req.json();
    const ipAddress = req.headers.get("x-forwarded-for")?.split(',')[0].trim() || req.headers.get("remote-addr") || null;
    const userAgent = req.headers.get("user-agent") || null;
    const serverDetails = {
      ip_address: ipAddress,
      user_agent: userAgent,
      ...clientDetails
    };
    const logEntry = {
      user_id: userId || null,
      session_id: sessionId || null,
      activity_type: activityType,
      target_id: targetId || null,
      target_type: targetType || null,
      details: serverDetails,
      created_at: new Date().toISOString()
    };
    const { data, error } = await supabaseAdmin.from("user_activity_log").insert([
      logEntry
    ]).select();
    if (error) {
      console.error("Error logging activity:", error);
      return new Response(JSON.stringify({
        error: "Failed to log activity",
        details: error.message
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 500
      });
    }
    return new Response(JSON.stringify({
      success: true,
      data
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (e) {
    console.error("Error processing request:", e);
    return new Response(JSON.stringify({
      error: "Internal server error",
      details: e.message
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
