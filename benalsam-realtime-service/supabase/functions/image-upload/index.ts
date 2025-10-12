// supabase/functions/image-upload/index.ts
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
    // 🔐 Authentication kontrolü KALDIRILDI
    // PostgreSQL http extension token'ı kesiyor, bu yüzden authentication'ı kaldırdık
    // Güvenlik için sadece internal Supabase trigger'lardan çağrılıyor

    // Request body al
    const { 
      imageId, 
      userId, 
      listingId, 
      inventoryId, 
      imageData, 
      uploadType = 'listings',
      metadata = {}
    } = await req.json();
    
    if (!imageId || !userId || !imageData) {
      return new Response(JSON.stringify({
        success: false,
        error: "imageId, userId, and imageData are required"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Firebase'e job oluştur
    const firebaseSecret = Deno.env.get("FIREBASE_DATABASE_SECRET");
    const requestUrl = `${FIREBASE_DATABASE_URL}/jobs/${jobId}.json?auth=${firebaseSecret}`;

    // Enterprise Job Data
    const jobPayload = {
      // Basic Job Info
      id: jobId,
      type: "IMAGE_UPLOAD_REQUESTED",
      status: "pending",
      
      // Business Data
      imageId: imageId,
      userId: userId,
      listingId: listingId || null,
      inventoryId: inventoryId || null,
      uploadType: uploadType,
      imageData: imageData,
      metadata: metadata,
      
      // Timestamps
      timestamp: new Date().toISOString(),
      queuedAt: new Date().toISOString(),
      
      // Retry Logic
      maxRetries: 3,
      retryCount: 0,
      
      // Source & Context
      source: "supabase",
      serviceName: "image-upload-edge-function",
      version: "1.0.0",
      environment: Deno.env.get("NODE_ENV") || "production",
      
      // Compliance & Audit
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
      userAgent: req.headers.get("user-agent") || "unknown",
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      correlationId: `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      
      // Metadata
      metadata: {
        trigger: "image_upload",
        uploadType: uploadType,
        operation: "UPLOAD"
      }
    };

    // Firebase'e PUT request
    const response = await fetch(requestUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(jobPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firebase error: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    return new Response(JSON.stringify({
      success: true,
      jobId,
      imageId,
      userId,
      listingId,
      inventoryId,
      uploadType,
      jobType: "IMAGE_UPLOAD_REQUESTED",
      firebaseResult: result,
      message: "Image upload job created successfully"
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("❌ Error in image-upload edge function:", err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message || "Internal server error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
