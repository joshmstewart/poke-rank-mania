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

  useEffect(() => {
    console.log('🔴 AuthProvider: INITIALIZING AUTH CONTEXT');
    
    // Get initial session first
    const getInitialSession = async () => {
      try {
        console.log('🔴 AuthProvider: Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('🔴 AuthProvider: Initial session result:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          userId: session?.user?.id,
          sessionAccessToken: session?.access_token ? 'present' : 'missing',
          sessionRefreshToken: session?.refresh_token ? 'present' : 'missing',
          error: error?.message
        });
        
        if (error) {
          console.error('🔴 AuthProvider: Error getting initial session:', error);
        }
        
        // Update state with initial session
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        console.log('🔴 AuthProvider: Initial state set - user:', !!session?.user, 'session:', !!session);
        
      } catch (err) {
        console.error('🔴 AuthProvider: Exception during initial auth check:', err);
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    };

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔴 AuthProvider: Auth state change event:', {
          event,
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          userId: session?.user?.id,
          sessionAccessToken: session?.access_token ? 'present' : 'missing',
          sessionRefreshToken: session?.refresh_token ? 'present' : 'missing'
        });
        
        // Update state immediately
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        console.log('🔴 AuthProvider: Updated state after auth change:', {
          userSet: !!session?.user,
          sessionSet: !!session,
          loading: false
        });
      }
    );

    // Get initial session
    getInitialSession();

    return () => {
      console.log('🔴 AuthProvider: Cleaning up auth listener');
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
    await supabase.auth.signOut();
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
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

  console.log('🔴 AuthProvider: RENDER - providing context value:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email,
    userObject: user,
    sessionObject: session
  });

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
    userEmail: context.user?.email
  });
  
  return context;
};
