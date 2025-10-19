import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wzgrlbmgwmqgqikxprqz.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6Z3JsYm1nd21xZ3Fpa3hwcnF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU4OTcyNzYsImV4cCI6MjA0MTQ3MzI3Nn0.p_qGX0Y8TDEcBZ4i8qCG-_9bsWKPXJHX9gm8OY-eE4Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

