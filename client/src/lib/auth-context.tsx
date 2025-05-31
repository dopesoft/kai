import { createContext, useContext, useEffect, useState } from 'react'
import { auth, UserProfile, userProfile, isAuthEnabled } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  authEnabled: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName?: string, phone?: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const authEnabled = isAuthEnabled()

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    if (!authEnabled) return
    
    try {
      const userProfileData = await userProfile.get(userId)
      setProfile(userProfileData)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    }
  }

  // Initialize auth state
  useEffect(() => {
    console.log('Auth Context - Initializing, authEnabled:', authEnabled);
    
    if (!authEnabled) {
      // If auth is not enabled, set loading to false and don't try to get session
      console.log('Auth Context - Auth not enabled, setting loading to false');
      setLoading(false)
      return
    }

    // Get initial session
    console.log('Auth Context - Getting initial session...');
    auth.getSession().then(({ data: { session }, error }) => {
      console.log('Auth Context - Got session:', session ? 'exists' : 'null', 'Error:', error);
      
      if (error) {
        console.error('Auth Context - Session error:', error);
        setSession(null)
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }

      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        console.log('Auth Context - Fetching profile for user:', session.user.id);
        fetchProfile(session.user.id).finally(() => {
          setLoading(false)
        })
      } else {
        console.log('Auth Context - No session, setting loading to false');
        setLoading(false)
      }
    }).catch((error) => {
      console.error('Auth Context - Error getting session:', error);
      setSession(null)
      setUser(null) 
      setProfile(null)
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      console.log('Auth Context - Auth state changed:', event, session ? 'has session' : 'no session');
      
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      
      // Don't set loading to false here if we're already loaded
      if (loading) {
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe();
    }
  }, [authEnabled])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error } = await auth.signIn(email, password)
      if (error) throw error
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signUp = async (email: string, password: string, fullName?: string, phone?: string) => {
    try {
      setLoading(true)
      const { error } = await auth.signUp(email, password, fullName, phone)
      if (error) throw error
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signOut = async () => {
    console.log('Auth Context - Starting signOut...');
    try {
      setLoading(true)
      
      // Clear local state first
      setUser(null)
      setSession(null)
      setProfile(null)
      
      // Then call Supabase signOut
      const { error } = await auth.signOut()
      if (error) {
        console.error('Auth Context - SignOut error:', error);
        throw error
      }
      
      console.log('Auth Context - SignOut successful');
      setLoading(false)
    } catch (error) {
      console.error('Auth Context - SignOut failed:', error);
      setLoading(false)
      throw error
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in')
    
    try {
      const updatedProfile = await userProfile.update(user.id, updates)
      setProfile(updatedProfile)
    } catch (error) {
      throw error
    }
  }

  const refreshProfile = async () => {
    if (!user || !authEnabled) return
    
    try {
      await fetchProfile(user.id)
    } catch (error) {
      console.error('Error refreshing profile:', error)
    }
  }

  const value = {
    user,
    session,
    profile,
    loading,
    authEnabled,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 