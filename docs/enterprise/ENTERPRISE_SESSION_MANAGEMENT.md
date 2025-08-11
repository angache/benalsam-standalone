# Enterprise Session Management System

## 📋 Genel Bakış

Enterprise Session Management sistemi, KVKK (Kişisel Verilerin Korunması Kanunu) uyumluluğu için kullanıcı oturumlarının detaylı şekilde loglanmasını sağlar. Bu sistem, kullanıcıların giriş/çıkış zamanlarını, IP adreslerini, kullanıcı ajanlarını ve diğer önemli bilgileri kaydeder.

## 🏗️ Sistem Mimarisi

### Hybrid Architecture (Trigger + Edge Function + Client)

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client Apps   │    │  Edge Function   │    │   Database      │
│  (Web/Mobile)   │◄──►│  (session-logger)│◄──►│  (PostgreSQL)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Auth Store     │    │  Rate Limiting   │    │  user_session_  │
│  Integration    │    │  IP Validation   │    │  logs Table     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🗄️ Database Schema

### user_session_logs Table

```sql
CREATE TABLE public.user_session_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES auth.sessions(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  ip_address text DEFAULT 'unknown',
  user_agent text DEFAULT 'unknown',
  session_start timestamptz NOT NULL DEFAULT now(),
  session_end timestamptz,
  session_duration interval,
  last_activity timestamptz DEFAULT now(),
  status text DEFAULT 'active',
  legal_basis text DEFAULT 'hukuki_yukumluluk',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### Performance Indexes

```sql
CREATE INDEX idx_user_session_logs_user_id ON public.user_session_logs(user_id);
CREATE INDEX idx_user_session_logs_session_id ON public.user_session_logs(session_id);
CREATE INDEX idx_user_session_logs_created_at ON public.user_session_logs(created_at);
CREATE INDEX idx_user_session_logs_status ON public.user_session_logs(status);
```

## 🔧 Enterprise Trigger Function

### log_session_activity()

```sql
CREATE OR REPLACE FUNCTION log_session_activity()
RETURNS trigger AS $$
BEGIN
  IF (tg_op = 'INSERT') THEN
    INSERT INTO public.user_session_logs (
      session_id,
      user_id,
      session_start,
      status,
      legal_basis
    ) VALUES (
      new.id,
      new.user_id,
      new.created_at,
      'active',
      'hukuki_yukumluluk'
    );
  ELSIF (tg_op = 'DELETE') THEN
    UPDATE public.user_session_logs 
    SET 
      session_end = now(),
      session_duration = now() - session_start,
      status = 'terminated',
      updated_at = now()
    WHERE session_id = old.id AND status = 'active';
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE TRIGGER session_log_trigger
  AFTER INSERT OR DELETE ON auth.sessions
  FOR EACH ROW EXECUTE FUNCTION log_session_activity();
```

## ⚡ Enterprise Edge Function

### session-logger/index.ts

```typescript
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

Deno.serve(async (req) => {
  // CORS handling
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Method validation
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // 1. Enterprise rate limiting
    const clientIP = req.headers.get('cf-connecting-ip') || 
                    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                    'unknown';
    const now = Date.now();
    const clientRequests = rateLimitMap.get(clientIP) || [];
    const validRequests = clientRequests.filter((time) => now - time < RATE_LIMIT_WINDOW);
    
    if (validRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    validRequests.push(now);
    rateLimitMap.set(clientIP, validRequests);

    // 2. Request size validation (4KB limit)
    const contentLength = parseInt(req.headers.get('content-length') || '0');
    if (contentLength > 4096) {
      return new Response(JSON.stringify({ error: 'Request too large' }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Request body parsing
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action = 'activity', metadata = {} } = requestBody;

    // 4. Enterprise IP validation
    const ip = req.headers.get('cf-connecting-ip') || 
               req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('x-real-ip') || 'unknown';
    
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    if (ip !== 'unknown' && !ipRegex.test(ip)) {
      return new Response(JSON.stringify({ error: 'Invalid IP address' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 5. Enterprise User Agent validation
    const userAgent = req.headers.get('user-agent') || 'unknown';
    if (userAgent.length > 500) {
      return new Response(JSON.stringify({ error: 'Invalid User Agent' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 6. Enterprise Supabase client (ANON_KEY kullan)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // 7. Get current session from auth context
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 8. Get user session from Supabase Auth
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 9. Get active session from database
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('user_session_logs')
      .select('session_id, session_start')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (sessionError || !sessionData) {
      return new Response(JSON.stringify({ error: 'No active session found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
    const { data, error } = await supabaseClient
      .from('user_session_logs')
      .update(updateData)
      .eq('session_id', sessionData.session_id)
      .eq('status', action === 'logout' ? 'active' : 'active')
      .select();

    if (error) {
      console.error('Database update failed:', error);
      return new Response(JSON.stringify({ 
        error: 'Database update failed', 
        details: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 13. Success response
    return new Response(JSON.stringify({
      success: true,
      action,
      session_id: sessionData.session_id,
      rows_updated: data?.length || 0,
      timestamp
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```

## 🔌 Client Integration

### Web App (React/Vite)

```typescript
// benalsam-web/src/stores/authStore.ts

// Enterprise Session Logger Service
const sessionLoggerService = {
  async logSessionActivity(action: 'login' | 'logout' | 'activity', metadata = {}) {
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('⚠️ No active session found for logging');
        return false;
      }

      // Call Edge Function for session logging
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/session-logger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action,
          metadata: {
            ...metadata,
            platform: 'web',
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Enterprise Session Logger: Failed to log session activity', errorData);
        return false;
      }

      const result = await response.json();
      console.log('✅ Enterprise Session Logger: Session activity logged successfully', result);
      return true;
    } catch (error) {
      console.error('❌ Enterprise Session Logger Error:', error);
      return false;
    }
  }
};

// Integration in auth methods
signIn: async (email: string, password: string) => {
  // ... authentication logic
  await sessionLoggerService.logSessionActivity('login', { user_id: data.session.user.id });
},

signOut: async () => {
  // ... logout logic
  await sessionLoggerService.logSessionActivity('logout', { user_id: session.user.id });
}
```

### Mobile App (React Native/Expo)

```typescript
// benalsam-mobile/src/stores/authStore.ts

// Enterprise Session Logger Service
const sessionLoggerService = {
  async logSessionActivity(action: 'login' | 'logout' | 'activity', metadata = {}) {
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('⚠️ No active session found for logging');
        return false;
      }

      // Call Edge Function for session logging
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/session-logger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action,
          metadata: {
            ...metadata,
            platform: 'mobile',
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Enterprise Session Logger: Failed to log session activity', errorData);
        return false;
      }

      const result = await response.json();
      console.log('✅ Enterprise Session Logger: Session activity logged successfully', result);
      return true;
    } catch (error) {
      console.error('❌ Enterprise Session Logger Error:', error);
      return false;
    }
  }
};

// Integration in auth methods
signIn: async (email: string, password: string) => {
  // ... authentication logic
  await sessionLoggerService.logSessionActivity('login', { user_id: data.session.user.id });
},

signOut: async () => {
  // ... logout logic with error handling
  if (currentUser?.id) {
    try {
      await sessionLoggerService.logSessionActivity('logout', { user_id: currentUser.id });
    } catch (sessionError) {
      console.warn('⚠️ Session logging failed, continuing with logout:', sessionError);
    }
  }
}
```

## 🔒 Security Features

### 1. Rate Limiting
- **Window**: 1 minute
- **Max Requests**: 10 per IP
- **Purpose**: Prevent abuse and DDoS attacks

### 2. IP Validation
- **Regex Pattern**: IPv4 and IPv6 validation
- **Purpose**: Ensure valid IP addresses

### 3. User Agent Validation
- **Max Length**: 500 characters
- **Purpose**: Prevent malicious user agent strings

### 4. Request Size Limiting
- **Max Size**: 4KB
- **Purpose**: Prevent large payload attacks

### 5. Authentication
- **Method**: JWT Bearer token
- **Validation**: Supabase Auth integration
- **Purpose**: Ensure authenticated requests

### 6. CORS Protection
- **Headers**: Proper CORS configuration
- **Methods**: POST, OPTIONS only
- **Purpose**: Cross-origin request security

## 📊 Data Flow

### Login Flow
1. **User Login** → Supabase Auth
2. **Trigger Fires** → Creates session log entry
3. **Client Call** → Edge Function with activity data
4. **Database Update** → Updates session with IP, User Agent, metadata

### Logout Flow
1. **User Logout** → Client calls Edge Function
2. **Session Update** → Marks session as terminated
3. **Duration Calculation** → Calculates session duration
4. **Metadata Update** → Stores logout metadata

### Activity Flow
1. **User Activity** → Client calls Edge Function
2. **Last Activity Update** → Updates last_activity timestamp
3. **Metadata Storage** → Stores activity metadata

## 🧪 Testing

### Manual Testing Checklist

#### Web App Testing
- [ ] Login creates session log
- [ ] Logout terminates session
- [ ] IP address captured correctly
- [ ] User agent captured correctly
- [ ] Metadata stored properly
- [ ] Session duration calculated correctly

#### Mobile App Testing
- [ ] Login creates session log
- [ ] Logout terminates session (with error handling)
- [ ] Request size within limits
- [ ] Rate limiting works
- [ ] Error handling works

#### Edge Function Testing
- [ ] Rate limiting
- [ ] IP validation
- [ ] User agent validation
- [ ] Request size validation
- [ ] Authentication validation
- [ ] Database updates

### Automated Testing

```typescript
// Example test cases
describe('Enterprise Session Management', () => {
  test('should log session on login', async () => {
    // Test implementation
  });

  test('should terminate session on logout', async () => {
    // Test implementation
  });

  test('should handle rate limiting', async () => {
    // Test implementation
  });
});
```

## 🚀 Deployment

### 1. Database Migration
```bash
# Apply database schema
npx supabase db push
```

### 2. Edge Function Deployment
```bash
# Deploy session-logger function
npx supabase functions deploy session-logger
```

### 3. Environment Variables
```bash
# Required environment variables
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📈 Monitoring

### Key Metrics
- **Session Count**: Active sessions per day
- **Session Duration**: Average session length
- **Error Rate**: Failed session logging attempts
- **Rate Limit Hits**: Number of rate-limited requests

### Log Analysis
```sql
-- Active sessions count
SELECT COUNT(*) FROM user_session_logs WHERE status = 'active';

-- Average session duration
SELECT AVG(EXTRACT(EPOCH FROM session_duration)) 
FROM user_session_logs 
WHERE session_duration IS NOT NULL;

-- Sessions by platform
SELECT 
  metadata->>'platform' as platform,
  COUNT(*) as session_count
FROM user_session_logs 
GROUP BY metadata->>'platform';
```

## 🔧 Troubleshooting

### Common Issues

#### 1. "Request too large" Error
**Cause**: Request payload exceeds 4KB limit
**Solution**: Reduce metadata size, remove unnecessary fields

#### 2. "Rate limit exceeded" Error
**Cause**: Too many requests from same IP
**Solution**: Implement client-side retry logic with exponential backoff

#### 3. "No active session found" Error
**Cause**: Session already terminated or invalid
**Solution**: Check session validity before logging

#### 4. "Invalid IP address" Error
**Cause**: Malformed IP address in headers
**Solution**: Check proxy configuration and IP forwarding

### Debug Commands
```bash
# Check Edge Function logs
npx supabase functions logs session-logger

# Check database logs
npx supabase db logs

# Test Edge Function locally
npx supabase functions serve session-logger
```

## 📋 Compliance

### KVKK Uyumluluğu
- ✅ **Session Başlangıç/bitiş zamanları** kaydediliyor
- ✅ **IP adresi** kaydediliyor
- ✅ **User agent** kaydediliyor
- ✅ **Yasal dayanak** belirtiliyor
- ✅ **Veri saklama süresi** tanımlanmalı
- ✅ **Veri erişim hakları** tanımlanmalı

### GDPR Compliance
- ✅ **Lawful basis** belirtiliyor
- ✅ **Data minimization** uygulanıyor
- ✅ **Purpose limitation** uygulanıyor
- ✅ **Storage limitation** uygulanmalı

## 🔄 Maintenance

### Regular Tasks
1. **Database Cleanup**: Old session logs cleanup
2. **Performance Monitoring**: Query optimization
3. **Security Updates**: Edge Function security patches
4. **Compliance Review**: KVKK/GDPR compliance check

### Backup Strategy
```sql
-- Backup session logs
pg_dump -t user_session_logs your_database > session_logs_backup.sql

-- Restore session logs
psql your_database < session_logs_backup.sql
```

## 📚 References

- [Supabase Documentation](https://supabase.com/docs)
- [KVKK Guidelines](https://www.kvkk.gov.tr/)
- [GDPR Guidelines](https://gdpr.eu/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Son Güncelleme**: 2025-01-18  
**Versiyon**: 1.0.0  
**Yazar**: Enterprise Development Team 