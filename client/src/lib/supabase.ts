import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if environment variables are available and valid
const isValidUrl = supabaseUrl && supabaseUrl !== 'https://your-project.supabase.co' && supabaseUrl.includes('supabase.co')
const isValidKey = supabaseAnonKey && supabaseAnonKey !== 'your-anon-key-here' && supabaseAnonKey.length > 20
const isSupabaseConfigured = !!(isValidUrl && isValidKey)

console.log('Supabase Config - URL:', supabaseUrl ? 'set' : 'missing');
console.log('Supabase Config - Key:', supabaseAnonKey ? 'set' : 'missing');
console.log('Supabase Config - Valid URL:', isValidUrl);
console.log('Supabase Config - Valid Key:', isValidKey);
console.log('Supabase Config - Configured:', isSupabaseConfigured);

// Create a mock client if not configured, or real client if configured
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Helper to check if Supabase is configured
export const isAuthEnabled = () => isSupabaseConfigured

// User profile type matching the database schema
export interface UserProfile {
  id: string
  full_name?: string
  email?: string
  phone?: string
  created_at?: string
  updated_at?: string
  last_seen?: string
  profile_image_url?: string
  kai_persona?: any
  is_active?: boolean
}

// Auth helpers with configuration checks
export const auth = {
  // Sign up new user
  signUp: async (email: string, password: string, fullName?: string, phone?: string) => {
    if (!supabase) {
      throw new Error('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.')
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw authError

    // If signup successful and user is confirmed, create profile
    if (authData.user && !authError) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          full_name: fullName,
          phone: phone,
        })

      if (profileError) {
        console.error('Error creating user profile:', profileError)
        // Don't throw here as auth was successful
      }
    }

    return { data: authData, error: authError }
  },

  // Sign in existing user
  signIn: async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.')
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!error && data.user) {
      // Check if user exists in our users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single()

      // If user doesn't exist in our users table, create minimal record
      if (!existingUser) {
        await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
          })
      }

      // Update last_seen
      await supabase
        .from('users')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', data.user.id)
    }

    return { data, error }
  },

  // Sign out
  signOut: async () => {
    if (!supabase) {
      throw new Error('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.')
    }
    return await supabase.auth.signOut()
  },

  // Get current user
  getUser: () => {
    if (!supabase) return Promise.resolve({ data: { user: null }, error: null })
    return supabase.auth.getUser()
  },

  // Get current session
  getSession: () => {
    if (!supabase) return Promise.resolve({ data: { session: null }, error: null })
    return supabase.auth.getSession()
  },

  // Listen to auth changes
  onAuthStateChange: (callback: (event: any, session: any) => void) => {
    if (!supabase) {
      // Return a mock subscription that does nothing
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      }
    }
    return supabase.auth.onAuthStateChange(callback)
  }
}

// User profile helpers
export const userProfile = {
  // Get user profile
  get: async (userId: string): Promise<UserProfile | null> => {
    if (!supabase) {
      throw new Error('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.')
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return data
  },

  // Update user profile
  update: async (userId: string, updates: Partial<UserProfile>) => {
    if (!supabase) {
      throw new Error('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.')
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }
} 