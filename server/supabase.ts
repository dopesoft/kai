import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

// Lazy initialization to ensure env vars are loaded
export function getSupabase() {
  if (supabaseInstance === null) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      console.log('✅ Supabase configured successfully');
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    } else {
      console.warn('⚠️ Supabase not configured - memory features will be disabled');
      console.warn('Add SUPABASE_URL and SUPABASE_ANON_KEY to environment variables');
      console.warn('Current env:', {
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
        supabaseUrlValue: process.env.SUPABASE_URL ? 'Set' : 'Not set',
        supabaseKeyValue: process.env.SUPABASE_ANON_KEY ? 'Set' : 'Not set'
      });
      supabaseInstance = null;
    }
  }
  return supabaseInstance;
}

// Get admin client (bypasses RLS)
export function getSupabaseAdmin() {
  if (supabaseAdminInstance === null) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('🔧 Initializing Supabase admin client...', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceRoleKey,
      urlValue: supabaseUrl ? 'Set' : 'Not set',
      serviceKeyValue: supabaseServiceRoleKey ? 'Set' : 'Not set'
    });

    if (supabaseUrl && supabaseServiceRoleKey) {
      console.log('✅ Supabase admin client configured successfully');
      supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      });
    } else {
      console.error('❌ Supabase admin client not configured - THIS WILL CAUSE ERRORS');
      console.error('Missing:', {
        SUPABASE_URL: !supabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: !supabaseServiceRoleKey
      });
      supabaseAdminInstance = null;
    }
  }
  return supabaseAdminInstance;
}

// For backward compatibility - regular client
export const supabase = new Proxy({} as any, {
  get(target, prop) {
    const instance = getSupabase();
    if (instance) {
      return instance[prop as keyof SupabaseClient];
    }
    return undefined;
  }
});

// Admin client proxy
export const supabaseAdmin = new Proxy({} as any, {
  get(target, prop) {
    const instance = getSupabaseAdmin();
    if (instance) {
      return instance[prop as keyof SupabaseClient];
    }
    // If no admin client, throw error for better debugging
    throw new Error(`Supabase admin client not initialized. Check environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY`);
  }
});