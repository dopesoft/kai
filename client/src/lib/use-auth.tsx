import { useContext } from 'react';
import { AuthContext } from './auth-context'; // Assuming AuthContext is exported from auth-context.tsx
import type { AuthContextType } from './auth-context'; // Assuming AuthContextType is exported

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 