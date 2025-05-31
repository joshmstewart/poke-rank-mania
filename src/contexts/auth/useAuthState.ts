
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('🔴 useAuthState: HOOK INITIALIZED');
  console.log('🔴 useAuthState: Current state at init:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    console.log('🔴 useAuthState: USEEFFECT STARTING - this should only show once on mount');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔴 useAuthState: ⚠️⚠️⚠️ AUTH STATE CHANGE EVENT TRIGGERED ⚠️⚠️⚠️');
        console.log('🔴 useAuthState: Event type:', event);
        console.log('🔴 useAuthState: Session in callback:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          userId: session?.user?.id,
          sessionAccessToken: session?.access_token ? 'present' : 'missing',
          sessionRefreshToken: session?.refresh_token ? 'present' : 'missing',
          timestamp: new Date().toISOString()
        });
        
        console.log('🔴 useAuthState: About to update state - CRITICAL POINT');
        
        // CRITICAL: Use React.startTransition to prevent unmounting during state updates
        // This ensures the component tree stays stable during auth changes
        if (typeof React !== 'undefined' && React.startTransition) {
          React.startTransition(() => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
          });
        } else {
          // Fallback for older React versions
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
        
        console.log('🔴 useAuthState: State updated. New values:', {
          userSet: !!session?.user,
          sessionSet: !!session,
          loading: false,
          timestamp: new Date().toISOString()
        });

        console.log('🔴 useAuthState: ⚠️⚠️⚠️ AUTH STATE CHANGE COMPLETE ⚠️⚠️⚠️');
      }
    );

    console.log('🔴 useAuthState: Auth listener set up, now getting initial session...');

    // THEN get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔴 useAuthState: Calling supabase.auth.getSession()...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('🔴 useAuthState: Initial session response:', {
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
          console.error('🔴 useAuthState: Error getting initial session:', error);
        }
        
        console.log('🔴 useAuthState: About to set initial state...');
        
        // Update state with initial session - use transition here too
        if (typeof React !== 'undefined' && React.startTransition) {
          React.startTransition(() => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
          });
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
        
        console.log('🔴 useAuthState: Initial state set:', {
          user: !!session?.user, 
          session: !!session,
          loading: false,
          timestamp: new Date().toISOString()
        });
        
      } catch (err) {
        console.error('🔴 useAuthState: Exception during initial auth check:', err);
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    };

    // Get initial session
    getInitialSession();

    console.log('🔴 useAuthState: Initial session check started, returning cleanup function');

    return () => {
      console.log('🔴 useAuthState: CLEANUP - Unsubscribing auth listener');
      subscription.unsubscribe();
    };
  }, []);

  return { user, session, loading };
};
