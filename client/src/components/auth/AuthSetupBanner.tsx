import { AlertTriangle, ExternalLink } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export function AuthSetupBanner() {
  return (
    <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="text-amber-800 dark:text-amber-200">
          <strong>Authentication not configured:</strong> To enable user accounts and profiles, 
          please set up Supabase by following the setup guide.
        </div>
        <Button
          variant="outline"
          size="sm"
          className="ml-4 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900"
          onClick={() => window.open('/AUTHENTICATION_SETUP.md', '_blank')}
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          Setup Guide
        </Button>
      </AlertDescription>
    </Alert>
  )
} 