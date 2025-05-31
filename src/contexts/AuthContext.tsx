
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithPhone: (phone: string) => Promise<{ error: any }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('🔴 AuthProvider: COMPONENT RENDER START - every render should show this');
  console.log('🔴 AuthProvider: Current state at render start:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    console.log('🔴 AuthProvider: USEEFFECT STARTING - this should only show once on mount');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔴 AuthProvider: ⚠️⚠️⚠️ AUTH STATE CHANGE EVENT TRIGGERED ⚠️⚠️⚠️');
        console.log('🔴 AuthProvider: Event type:', event);
        console.log('🔴 AuthProvider: Session in callback:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          userId: session?.user?.id,
          sessionAccessToken: session?.access_token ? 'present' : 'missing',
          sessionRefreshToken: session?.refresh_token ? 'present' : 'missing',
          timestamp: new Date().toISOString()
        });
        
        console.log('🔴 AuthProvider: About to update state...');
        
        // Update state immediately and synchronously
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        console.log('🔴 AuthProvider: State updated. New values:', {
          userSet: !!session?.user,
          sessionSet: !!session,
          loading: false,
          timestamp: new Date().toISOString()
        });

        console.log('🔴 AuthProvider: ⚠️⚠️⚠️ AUTH STATE CHANGE COMPLETE ⚠️⚠️⚠️');
      }
    );

    console.log('🔴 AuthProvider: Auth listener set up, now getting initial session...');

    // THEN get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔴 AuthProvider: Calling supabase.auth.getSession()...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('🔴 AuthProvider: Initial session response:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          userId: session?.user?.id,
          sessionAccessToken: session?.access_token ? 'present' : 'missing',
          sessionRefreshToken: session?.refresh_token ? 'present' : 'missing',
          error: error?.message,
          timestamp: new Date().toISOString()
        });
        
        if (error) {
          console.error('🔴 AuthProvider: Error getting initial session:', error);
        }
        
        console.log('🔴 AuthProvider: About to set initial state...');
        
        // Update state with initial session
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        console.log('🔴 AuthProvider: Initial state set:', {
          user: !!session?.user, 
          session: !!session,
          loading: false,
          timestamp: new Date().toISOString()
        });
        
      } catch (err) {
        console.error('🔴 AuthProvider: Exception during initial auth check:', err);
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    };

    // Get initial session
    getInitialSession();

    console.log('🔴 AuthProvider: Initial session check started, returning cleanup function');

    return () => {
      console.log('🔴 AuthProvider: CLEANUP - Unsubscribing auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    console.log('🔴 AuthProvider: Signing out...');
    await supabase.auth.signOut();
  };

  const signInWithGoogle = async () => {
    console.log('🔴 AuthProvider: Starting Google sign in...');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    console.log('🔴 AuthProvider: Google sign in result:', { error: error?.message });
    return { error };
  };

  const signInWithPhone = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone: phone,
    });
    return { error };
  };

  const verifyPhoneOtp = async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: token,
      type: 'sms',
    });
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithPhone,
    verifyPhoneOtp,
  };

  console.log('🔴 AuthProvider: RENDER END - About to return JSX with context value:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email,
    timestamp: new Date().toISOString()
  });

  console.log('🔴 AuthProvider: 🚨🚨🚨 RETURNING JSX - this should ALWAYS appear 🚨🚨🚨');

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  console.log('🔴 useAuth: Returning context:', {
    hasUser: !!context.user,
    hasSession: !!context.session,
    loading: context.loading,
    userEmail: context.user?.email,
    timestamp: new Date().toISOString()
  });
  
  return context;
};
