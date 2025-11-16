
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { AuthContextType, User } from '@/types';

// AUTH_DISABLED flag - Set to true to bypass authentication
const AUTH_DISABLED = import.meta.env.VITE_AUTH_DISABLED === 'true';

// Mock admin user for development when AUTH_DISABLED = true
const MOCK_USER: User = {
  id: 'mock-admin-id',
  email: import.meta.env.VITE_MOCK_USER_EMAIL || 'admin@blkout.dev',
  name: import.meta.env.VITE_MOCK_USER_NAME || 'BLKOUT Admin',
  role: 'admin',
  createdAt: new Date(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If authentication is disabled, use mock user
    if (AUTH_DISABLED) {
      console.log('🔓 Authentication is DISABLED - Using mock admin user');
      setUser(MOCK_USER);
      setIsLoading(false);
      return;
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase is not configured - Running in demo mode');
      setUser(MOCK_USER);
      setIsLoading(false);
      return;
    }

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || 'User',
          role: session.user.user_metadata?.role || 'viewer',
          avatar: session.user.user_metadata?.avatar,
          createdAt: new Date(session.user.created_at),
        });
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || 'User',
          role: session.user.user_metadata?.role || 'viewer',
          avatar: session.user.user_metadata?.avatar,
          createdAt: new Date(session.user.created_at),
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (AUTH_DISABLED) {
      console.log('🔓 Sign in bypassed - AUTH_DISABLED is true');
      return;
    }

    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    if (AUTH_DISABLED) {
      console.log('🔓 Sign out bypassed - AUTH_DISABLED is true');
      return;
    }

    if (!isSupabaseConfigured()) {
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper function to check if authentication is disabled
export const isAuthDisabled = () => AUTH_DISABLED;
