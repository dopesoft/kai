import { createContext, useContext, useEffect, useState } from 'react'
import { auth, UserProfile, userProfile, isAuthEnabled } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

// Export AuthContextType
export interface AuthContextType {
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

// Export AuthContext
export const AuthContext = createContext<AuthContextType | undefined>(undefined)

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
      console.log('Auth Context - Starting profile fetch for:', userId)
      const userProfileData = await userProfile.get(userId)
      console.log('Auth Context - Profile data received:', userProfileData)
      setProfile(userProfileData)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    }
  }

  // Handle auth state changes - this is the SINGLE source of truth
  const handleAuthStateChange = async (event: string, session: Session | null) => {
    console.log('Auth Context - handleAuthStateChange called:', { 
      event, 
      hasSession: !!session, 
      hasUser: !!session?.user,
      currentLoading: loading 
    })
    
    try {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        console.log('Auth Context - User signed in, fetching profile for:', session.user.id)
        // User is signed in, fetch their profile but don't block
        fetchProfile(session.user.id).then(() => {
          console.log('Auth Context - Profile fetched successfully')
        }).catch((error) => {
          console.error('Error fetching profile after auth change:', error)
          setProfile(null)
        })
      } else {
        console.log('Auth Context - No user, clearing profile')
        // User is signed out, clear profile
        setProfile(null)
      }
    } catch (error) {
      console.error('Auth Context - Error in handleAuthStateChange:', error)
    } finally {
      // ALWAYS set loading to false
      console.log('Auth Context - Setting loading to false')
      setLoading(false)
    }
  }

  // Initialize auth state
  useEffect(() => {
    console.log('Auth Context - Initializing, authEnabled:', authEnabled)
    
    if (!authEnabled) {
      console.log('Auth Context - Auth not enabled')
      setLoading(false)
      setUser(null)
      setSession(null)
      setProfile(null)
      return
    }

    let mounted = true

    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('Auth Context - Getting initial session...')
        const { data: { session }, error } = await auth.getSession()
        
        if (!mounted) return
        
        console.log('Auth Context - Initial session result:', { 
          hasSession: !!session, 
          hasUser: !!session?.user,
          error: error?.message 
        })
        
        if (error) {
          console.error('Auth Context - Session error:', error)
          await handleAuthStateChange('SESSION_ERROR', null)
          return
        }
        
        // Handle initial session
        await handleAuthStateChange('INITIAL_SESSION', session)
        
      } catch (error) {
        console.error('Auth Context - Error getting initial session:', error)
        if (mounted) {
          await handleAuthStateChange('INIT_ERROR', null)
        }
      }
    }

    // Set up auth state listener
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      console.log('Auth Context - onAuthStateChange triggered:', event)
      await handleAuthStateChange(event, session)
    })

    // Initialize
    initializeAuth()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [authEnabled])

  // Simple, clean auth functions that trust Supabase
  const signIn = async (email: string, password: string) => {
    console.log('Auth Context - Starting signIn')
    
    try {
      const { error } = await auth.signIn(email, password)
      if (error) throw error
      console.log('Auth Context - SignIn request successful')
      // onAuthStateChange will handle the rest
    } catch (error) {
      console.error('Auth Context - SignIn failed:', error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, fullName?: string, phone?: string) => {
    console.log('Auth Context - Starting signUp')
    
    try {
      const { error } = await auth.signUp(email, password, fullName, phone)
      if (error) throw error
      console.log('Auth Context - SignUp request successful')
      // onAuthStateChange will handle the rest
    } catch (error) {
      console.error('Auth Context - SignUp failed:', error)
      throw error
    }
  }

  const signOut = async () => {
    console.log('Auth Context - Starting signOut')
    
    try {
      // Clear state immediately for faster UX
      setUser(null)
      setSession(null)
      setProfile(null)
      
      // Clear chat-related localStorage to ensure fresh start on login
      localStorage.removeItem('activeThreadId')
      localStorage.removeItem('forceNewThread')
      
      const { error } = await auth.signOut()
      if (error) throw error
      console.log('Auth Context - SignOut successful')
    } catch (error) {
      console.error('Auth Context - SignOut failed:', error)
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