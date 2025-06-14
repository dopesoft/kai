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
      console.warn('Add SUPABASE_URL and SUPABASE_ANON_KEY to server/.env file');
      console.warn('Current env:', {
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY
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
      console.warn('⚠️ Supabase admin client not configured - memory operations may fail due to RLS');
      console.warn('Add SUPABASE_SERVICE_ROLE_KEY to server/.env file');
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
    // If no admin client, fall back to regular client and warn
    console.warn('⚠️ Admin client not available, falling back to regular client');
    const regularInstance = getSupabase();
    if (regularInstance) {
      return regularInstance[prop as keyof SupabaseClient];
    }
    return undefined;
  }
});