# Session Analytics Fix TODO

## Sorun
Mobile app'de "No active session found in database" hatası var. Analytics service enterprise session ID bulamıyor.

## Çözüm Stratejisi: Hybrid Approach

### ✅ Adım 1: Hızlı Düzeltme (5 dakika)
- [x] Analytics service'de Supabase session ID fallback ekle
- [x] Test et: Analytics çalışıyor mu? ✅ BAŞARILI
- [x] Supabase JWT'den UUID session ID çıkar ✅ BAŞARILI

### ✅ Adım 2: Session Logging Diagnostik (10 dakika)
- [x] AuthStore'da session logging çağrılarını kontrol et ✅
- [x] Eksik session logging çağrılarını ekle ✅
- [x] Edge function'ı güncelle - session yoksa oluştur ✅
- [x] Database trigger'ı kontrol et ✅
- [x] Session logging neden çalışmıyor bul ✅ ÇÖZÜLDÜ

### ✅ Adım 3: Session Logging Düzelt (15 dakika)
- [x] AuthStore'da eksik session logging çağrılarını ekle ✅
- [x] Edge function'ı test et ✅
- [x] Database trigger'ı düzelt (gerekirse) ✅
- [x] IP Change Detection Service eklendi ✅

### 🔄 Adım 4: Geçiş (5 dakika)
- [ ] Session logging çalışınca enterprise session ID'ye geç
- [ ] Test et: Enterprise session ID çalışıyor mu?

## Durum
- **Başlangıç**: Adım 1'e başlanacak
- **Öncelik**: Analytics'in hemen çalışması
- **Hedef**: Hem hızlı çözüm hem uzun vadeli düzeltme

## Notlar
- Hybrid approach: Önce Supabase session ID, sonra enterprise session ID
- Güvenli geçiş: Mevcut sistemi bozmadan
- Test odaklı: Her adımda test et 




// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
// Enterprise rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;
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
    // 1. Enterprise rate limiting
    const clientIP = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const now = Date.now();
    const clientRequests = rateLimitMap.get(clientIP) || [];
    const validRequests = clientRequests.filter((time)=>now - time < RATE_LIMIT_WINDOW);
    if (validRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded'
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    validRequests.push(now);
    rateLimitMap.set(clientIP, validRequests);
    // 2. Request size validation (4KB limit)
    const contentLength = parseInt(req.headers.get('content-length') || '0');
    if (contentLength > 4096) {
      return new Response(JSON.stringify({
        error: 'Request too large'
      }), {
        status: 413,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // 3. Request validation
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({
        error: 'Invalid JSON body'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const { action = 'activity', metadata = {}, session_id: clientSessionId } = requestBody;
    // 4. Enterprise IP validation
    const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
    // IP format validation
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
    // 5. Enterprise User Agent validation
    const userAgent = req.headers.get('user-agent') || 'unknown';
    if (userAgent.length > 500) {
      return new Response(JSON.stringify({
        error: 'Invalid User Agent'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // 6. Enterprise Supabase client (ANON_KEY kullan)
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '' // ✅ ANON_KEY kullan
    );
    // 7. Get current session from auth context
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
    // 8. Get user session from Supabase Auth
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
    // 9. Get active session from database (use client session ID if provided)
    let sessionData;
    let sessionError;
    if (clientSessionId) {
      // Use client provided session ID
      const { data, error } = await supabaseClient.from('user_session_logs').select('session_id, session_start').eq('session_id', clientSessionId).eq('user_id', user.id).eq('status', 'active').single();
      sessionData = data;
      sessionError = error;
    } else {
      // Fallback to database lookup
      const { data, error } = await supabaseClient.from('user_session_logs').select('session_id, session_start').eq('user_id', user.id).eq('status', 'active').order('created_at', {
        ascending: false
      }).limit(1).single();
      sessionData = data;
      sessionError = error;
    }
    if (sessionError || !sessionData) {
      return new Response(JSON.stringify({
        error: 'No active session found'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // 10. Enterprise update data
    const timestamp = new Date().toISOString();
    let updateData = {
      ip_address: ip,
      user_agent: userAgent,
      last_activity: timestamp,
      updated_at: timestamp,
      metadata: {
        ...metadata,
        action,
        timestamp,
        client_ip: clientIP
      }
    };
    // 11. Logout handling
    if (action === 'logout') {
      const start = new Date(sessionData.session_start);
      const end = new Date(timestamp);
      const durationMs = end.getTime() - start.getTime();
      updateData.session_end = timestamp;
      updateData.status = 'terminated';
      updateData.session_duration = Math.round(durationMs / 1000);
    }
    // 12. Enterprise database update
    const { data, error } = await supabaseClient.from('user_session_logs').update(updateData).eq('session_id', sessionData.session_id).eq('status', action === 'logout' ? 'active' : 'active').select();
    if (error) {
      console.error('Enterprise session logger error:', {
        error: error.message,
        user_id: user.id,
        action,
        ip
      });
      return new Response(JSON.stringify({
        error: 'Database update failed',
        details: error.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // 13. Enterprise success logging
    console.log('Enterprise session logged successfully:', {
      user_id: user.id,
      session_id: sessionData.session_id,
      action,
      ip,
      user_agent: userAgent.substring(0, 50) + '...',
      rows_affected: data?.length || 0
    });
    return new Response(JSON.stringify({
      success: true,
      action,
      session_id: sessionData.session_id,
      rows_updated: data?.length || 0,
      timestamp
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Enterprise session logger unexpected error:', {
      error: error.message,
      stack: error.stack
    });
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
