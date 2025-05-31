import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { useAuth } from '@/lib/auth-context'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { user, loading, authEnabled } = useAuth()
  const [, setLocation] = useLocation()

  useEffect(() => {
    // If auth is not enabled, always allow access
    if (!authEnabled) {
      return
    }

    if (!loading) {
      if (requireAuth && !user) {
        // User needs to be authenticated but isn't - redirect to auth
        setLocation('/auth')
      } else if (!requireAuth && user) {
        // User is authenticated but accessing auth page - redirect to home
        setLocation('/')
      }
    }
  }, [user, loading, requireAuth, authEnabled, setLocation])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600 dark:text-gray-300" />
      </div>
    )
  }

  // If auth is disabled, always show content
  if (!authEnabled) {
    return <>{children}</>
  }

  // Show content if:
  // - requireAuth is true and user is authenticated
  // - requireAuth is false (public route)
  if ((requireAuth && user) || !requireAuth) {
    return <>{children}</>
  }

  // Don't render anything while redirecting
  return null
} 