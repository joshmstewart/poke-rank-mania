
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Use refs to prevent unnecessary re-renders that could cause unmounting
  const stateStable = useRef(false);
  const authListenerSet = useRef(false);
  const mountedRef = useRef(true);

  console.log('🔴 useAuthState: HOOK INITIALIZED - STABLE INSTANCE');
  console.log('🔴 useAuthState: Current state at init:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email,
    stateStable: stateStable.current,
    timestamp: new Date().toISOString()
  });

  // Use useCallback to ensure stable auth state handler
  const handleAuthStateChange = useCallback((event: any, session: Session | null) => {
    if (!mountedRef.current) {
      console.log('🔴 useAuthState: Component unmounted, ignoring auth state change');
      return;
    }

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
    console.log('🔴 useAuthState: Previous state before update:', {
      hadUser: !!user,
      hadSession: !!session,
      wasLoading: loading
    });
    
    // Use React.startTransition to prevent UI blocking during auth updates
    React.startTransition(() => {
      if (!mountedRef.current) return;
      
      console.log('🔴 useAuthState: 🚨 SETTING NEW STATE VALUES 🚨');
      console.log('🔴 useAuthState: New user:', !!session?.user, session?.user?.email);
      console.log('🔴 useAuthState: New session:', !!session);
      
      // Update state synchronously without causing unmounting
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      stateStable.current = true;
      
      console.log('🔴 useAuthState: State updated successfully:', {
        userSet: !!session?.user,
        sessionSet: !!session,
        loading: false,
        stateStable: stateStable.current,
        timestamp: new Date().toISOString()
      });
    });

    console.log('🔴 useAuthState: ⚠️⚠️⚠️ AUTH STATE CHANGE COMPLETE ⚠️⚠️⚠️');
  }, [user, session, loading]);

  useEffect(() => {
    console.log('🔴 useAuthState: USEEFFECT STARTING - this should only show once on mount');
    console.log('🔴 useAuthState: Auth listener already set?', authListenerSet.current);
    
    mountedRef.current = true;
    
    // Prevent multiple listeners
    if (authListenerSet.current) {
      console.log('🔴 useAuthState: Auth listener already exists, skipping setup');
      return;
    }
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    authListenerSet.current = true;
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
        
        if (!mountedRef.current) return;
        
        console.log('🔴 useAuthState: About to set initial state...');
        
        // Update state with initial session
        React.startTransition(() => {
          if (!mountedRef.current) return;
          
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          stateStable.current = true;
          
          console.log('🔴 useAuthState: Initial state set:', {
            user: !!session?.user, 
            session: !!session,
            loading: false,
            stateStable: stateStable.current,
            timestamp: new Date().toISOString()
          });
        });
        
      } catch (err) {
        console.error('🔴 useAuthState: Exception during initial auth check:', err);
        if (mountedRef.current) {
          React.startTransition(() => {
            setSession(null);
            setUser(null);
            setLoading(false);
            stateStable.current = true;
          });
        }
      }
    };

    // Get initial session
    getInitialSession();

    console.log('🔴 useAuthState: Initial session check started, returning cleanup function');

    return () => {
      console.log('🔴 useAuthState: CLEANUP - Unsubscribing auth listener');
      mountedRef.current = false;
      authListenerSet.current = false;
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array to ensure this only runs once

  console.log('🔴 useAuthState: Hook returning values:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    stateStable: stateStable.current,
    userEmail: user?.email,
    timestamp: new Date().toISOString()
  });

  return { user, session, loading };
};
