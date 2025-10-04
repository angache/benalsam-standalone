// functions/fcm-notify/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// Firebase URL
const FIREBASE_DATABASE_URL = "https://benalsam-2025-default-rtdb.europe-west1.firebasedatabase.app";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 🔐 Authentication kontrolü
    const authHeader = req.headers.get("authorization");
    const expectedToken = Deno.env.get("FIREBASE_SECRET");
    
    if (!authHeader || !expectedToken) {
      return new Response(JSON.stringify({
        success: false,
        error: "Authentication required"
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const token = authHeader.replace("Bearer ", "");
    if (token !== expectedToken) {
      return new Response(JSON.stringify({
        success: false,
        error: "Invalid authentication token"
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    // Request body al
    const { listingId, status, jobType = "status_change" } = await req.json();
    
    if (!listingId || !status) {
      return new Response(JSON.stringify({
        success: false,
        error: "listingId and status are required"
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Firebase'e job oluştur
    const firebaseSecret = Deno.env.get("FIREBASE_DATABASE_SECRET");
    const requestUrl = `${FIREBASE_DATABASE_URL}/jobs/${jobId}.json?auth=${firebaseSecret}`;
    
    // Enterprise Job Data
    const requestBody = {
      // Basic Job Info
      id: jobId,
      type: jobType,
      status: "pending",
      
      // Business Data
      listingId,
      listingStatus: status,
      
      // Timestamps
      timestamp: new Date().toISOString(),
      queuedAt: new Date().toISOString(),
      
      // Retry Logic
      maxRetries: 3,
      retryCount: 0,
      
      // Source & Context
      source: "supabase",
      serviceName: "fcm-notify-edge-function",
      version: "1.0.0",
      environment: Deno.env.get("NODE_ENV") || "production",
      
      // Compliance & Audit
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
      userAgent: req.headers.get("user-agent") || "unknown",
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      correlationId: `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      
      // Security
      authSecret: "benalsam_super_secret_2025"
    };

    const response = await fetch(requestUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firebase error: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    return new Response(JSON.stringify({
      success: true,
      jobId,
      listingId,
      status,
      jobType,
      firebaseResult: result
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (err) {
    console.error("❌ Error:", err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});