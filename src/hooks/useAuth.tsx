
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// ============================================================================
// 🚨 DEVELOPMENT MODE: AUTHENTICATION DISABLED 🚨
// ============================================================================
// Authentication is temporarily disabled for development purposes.
// The app will use a mock admin user instead of requiring Supabase credentials.
// To re-enable authentication:
// 1. Set AUTH_DISABLED to false
// 2. Uncomment the real authentication code in useEffect
// 3. Remove the mock user data
// ============================================================================
const AUTH_DISABLED = true;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isEditor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ============================================================================
    // DEVELOPMENT MODE: Mock authenticated admin user
    // ============================================================================
    if (AUTH_DISABLED) {
      // Create a mock admin user for development
      const mockUser = {
        id: 'dev-admin-123',
        email: 'admin@blkout.dev',
        user_metadata: {
          role: 'admin',
          name: 'Dev Admin'
        },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User;

      const mockSession = {
        access_token: 'mock-token',
        token_type: 'bearer',
        user: mockUser,
      } as Session;

      setUser(mockUser);
      setSession(mockSession);
      setLoading(false);
      return;
    }

    // ============================================================================
    // PRODUCTION MODE: Real Supabase authentication (currently disabled)
    // ============================================================================
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    // AUTH DISABLED: Mock successful login
    if (AUTH_DISABLED) {
      console.log('🚨 DEV MODE: Sign-in bypassed');
      return;
    }
    
    // Real authentication (disabled)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    // AUTH DISABLED: Mock successful signup
    if (AUTH_DISABLED) {
      console.log('🚨 DEV MODE: Sign-up bypassed');
      return;
    }
    
    // Real authentication (disabled)
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    // AUTH DISABLED: Mock successful signout
    if (AUTH_DISABLED) {
      console.log('🚨 DEV MODE: Sign-out bypassed');
      return;
    }
    
    // Real authentication (disabled)
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // Check user role from metadata
  const userRole = user?.user_metadata?.role || '';
  const isAdmin = AUTH_DISABLED ? true : userRole === 'admin';
  const isEditor = AUTH_DISABLED ? true : ['admin', 'editor', 'content_lead'].includes(userRole);

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    isEditor,
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
