// functions/firebase-secure/index.ts - Güvenli versiyon
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Rate limiting storage
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// IP whitelist
const allowedIPs = [
  '127.0.0.1',
  '::1',
  'localhost',
  '0.0.0.0',
  // Production IP'leri buraya ekle
];

// IP whitelist kontrolü
function isIPAllowed(ip: string): boolean {
  if (allowedIPs.includes(ip)) {
    return true;
  }
  
  // Development için tüm IP'lere izin ver
  if (Deno.env.get('NODE_ENV') === 'development') {
    return true;
  }
  
  // Supabase Edge Functions için IP kontrolünü geçici olarak devre dışı bırak
  // Production'da gerçek IP'leri ekle
  return true;
}

// Rate limiting function
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100; // 100 requests per 15 minutes

  const key = ip;
  const current = rateLimitStore.get(key);

  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  return true;
}

// Audit trail function
function logAuditEvent(event: string, details: any, ip: string) {
  const timestamp = new Date().toISOString();
  console.log(`📊 AUDIT: ${event}`, {
    timestamp,
    ip,
    details,
    userAgent: details.userAgent || 'unknown'
  });
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// Firebase Realtime Database URL
const FIREBASE_DATABASE_URL = "https://benalsam-2025-default-rtdb.europe-west1.firebasedatabase.app";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 🔒 IP whitelist kontrolü (geçici olarak devre dışı)
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    console.log("📊 Client IP:", clientIP);
    
    // IP whitelist kontrolü geçici olarak devre dışı
    // if (!isIPAllowed(clientIP)) {
    //   console.log("❌ IP not allowed:", clientIP);
    //   return new Response(JSON.stringify({
    //     success: false,
    //     error: 'Access denied from this IP address.'
    //   }), {
    //     status: 403,
    //     headers: corsHeaders
    //   });
    // }

    // 🚫 Rate limiting kontrolü
    if (!checkRateLimit(clientIP)) {
      console.log("❌ Rate limit exceeded for IP:", clientIP);
      return new Response(JSON.stringify({
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      }), {
        status: 429,
        headers: corsHeaders
      });
    }

    // 🔐 Authentication kontrolü
    const authHeader = req.headers.get('authorization');
    const expectedToken = Deno.env.get('FIREBASE_SECRET');
    
    if (!authHeader || !expectedToken) {
      console.log("❌ Authentication failed: Missing token");
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const token = authHeader.replace('Bearer ', '');
    if (token !== expectedToken) {
      console.log("❌ Authentication failed: Invalid token");
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid authentication token'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    // ✅ Authentication başarılı
    console.log("✅ Authentication successful");

    // 📊 Audit trail - Authentication success
    logAuditEvent('AUTHENTICATION_SUCCESS', {
      userAgent: req.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    }, clientIP);

    const { listingId, status, jobType = 'status_change' } = await req.json();
    
    // 📝 Input validation
    if (!listingId || !status) {
      return new Response(JSON.stringify({
        success: false,
        error: 'listingId and status are required'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Unique job ID oluştur
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log("📨 Job verisi:", { listingId, status, jobType, jobId });

    // Firebase'e job olarak gönder (Basit Auth ile)
    const firebaseAuthSecret = Deno.env.get('FIREBASE_AUTH_SECRET');
    
    if (!firebaseAuthSecret) {
      throw new Error('FIREBASE_AUTH_SECRET is not set');
    }
    
    const requestBody = {
      id: jobId,
      listingId: listingId,
      type: jobType,
      status: 'pending',           // Initial status (will be updated by realtime service)
      listingStatus: status,        // Actual listing status
      timestamp: new Date().toISOString(),
      source: 'supabase',
      authSecret: firebaseAuthSecret,  // Rules'da kontrol edilecek
      retryCount: 0,
      maxRetries: 3
    };
    
    const requestUrl = `${FIREBASE_DATABASE_URL}/jobs/${jobId}.json`;
    
    console.log("📤 Firebase request detayları:", {
      url: requestUrl,
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: { ...requestBody, authSecret: '[HIDDEN]' }
    });
    
    const response = await fetch(requestUrl, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      // Detaylı hata loglama
      const errorText = await response.text();
      console.error("❌ Firebase detaylı hata:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText,
        url: response.url,
        method: 'PUT'
      });
      
      throw new Error(`Firebase hatası: ${response.status} - ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ Firebase'e job gönderildi:", result);

    // 🔒 authSecret'i response'dan çıkar (Firebase'de kalır ama response'da görünmez)
    const { authSecret, ...safeResult } = result;

    // 📊 Audit trail - Job creation success
    logAuditEvent('JOB_CREATION_SUCCESS', {
      jobId,
      listingId,
      status,
      jobType,
      timestamp: new Date().toISOString()
    }, clientIP);

    return new Response(JSON.stringify({
      success: true,
      jobId,
      listingId,
      status,
      jobType,
      firebaseResult: safeResult
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error("❌ Hata:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
