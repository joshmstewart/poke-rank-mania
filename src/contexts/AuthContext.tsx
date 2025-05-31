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
    console.log('AuthProvider: Initializing auth state management');
    
    // Debug localStorage to see what's stored
    console.log('🔍 LocalStorage debug:', {
      allKeys: Object.keys(localStorage),
      supabaseKeys: Object.keys(localStorage).filter(key => key.includes('supabase') || key.includes('sb-')),
      authTokenKey: localStorage.getItem('supabase.auth.token') ? 'found' : 'missing'
    });
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change event:', { 
          event, 
          userEmail: session?.user?.email, 
          userId: session?.user?.id,
          hasSession: !!session,
          accessToken: session?.access_token ? 'present' : 'missing'
        });
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Force a small delay to ensure state propagation
        setTimeout(() => {
          console.log('Auth state after update:', {
            userSet: !!session?.user,
            sessionSet: !!session
          });
        }, 100);
      }
    );

    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('🔍 About to call getSession...');
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Initial session check result:', { 
          userEmail: session?.user?.email, 
          userId: session?.user?.id,
          hasSession: !!session,
          error: error?.message,
          accessToken: session?.access_token ? 'present' : 'missing',
          sessionData: session ? 'session object found' : 'no session object'
        });
        
        if (error) {
          console.error('Error getting initial session:', error);
        }
        
        if (session) {
          console.log('✅ Found valid session, setting user state');
        } else {
          console.log('❌ No session found, user will remain null');
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (err) {
        console.error('Exception during initial auth check:', err);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      console.log('AuthProvider: Cleaning up auth listener');
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

  console.log('AuthProvider render:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email,
    localStorageHasAuth: !!localStorage.getItem('supabase.auth.token')
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
