import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { useAuth } from '@/lib/use-auth'
import { Loading } from '@/components/ui/loading'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { user, loading, authEnabled } = useAuth()
  const [, setLocation] = useLocation()

  console.log('AuthGuard render:', { loading, authEnabled, user: !!user, requireAuth })

  useEffect(() => {
    // Skip if still loading
    if (loading) return

    if (requireAuth) {
      // Protected route - redirect to auth if not authenticated
      if (!authEnabled || !user) {
        console.log('AuthGuard: Redirecting to /auth (no auth)')
        setLocation('/auth')
      }
    } else {
      // Auth page - redirect to home if already authenticated
      if (authEnabled && user) {
        console.log('AuthGuard: Redirecting to / (already authenticated)')
        setLocation('/')
      }
    }
  }, [user, loading, requireAuth, authEnabled, setLocation])

  // Show loading indicator while checking auth
  if (loading) {
    console.log('AuthGuard: Still loading, showing loading indicator')
    return <Loading text="Checking authentication..." />
  }

  // Protected routes
  if (requireAuth) {
    // Only show content if authenticated
    if (authEnabled && user) {
      console.log('AuthGuard: Showing protected content')
      return <>{children}</>
    }
    // Show loading while redirecting to auth
    console.log('AuthGuard: Protected route but no auth, showing loading')
    return <Loading text="Redirecting to login..." />
  }

  // Auth page
  if (!requireAuth) {
    // Only show auth page if not authenticated
    if (!authEnabled || !user) {
      console.log('AuthGuard: Showing auth page')
      return <>{children}</>
    }
    // Show loading while redirecting to home
    console.log('AuthGuard: Auth page but already authenticated, showing loading')
    return <Loading text="Redirecting to app..." />
  }

  return null
}