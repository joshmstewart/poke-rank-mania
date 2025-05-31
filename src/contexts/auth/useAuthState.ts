
import React, { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Use refs to prevent unnecessary re-renders that could cause unmounting
  const stateStable = useRef(false);
  const authListenerSet = useRef(false);

  console.log('🔴 useAuthState: HOOK INITIALIZED');
  console.log('🔴 useAuthState: Current state at init:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email,
    stateStable: stateStable.current,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    console.log('🔴 useAuthState: USEEFFECT STARTING - this should only show once on mount');
    console.log('🔴 useAuthState: Auth listener already set?', authListenerSet.current);
    
    // Prevent multiple listeners
    if (authListenerSet.current) {
      console.log('🔴 useAuthState: Auth listener already exists, skipping setup');
      return;
    }
    
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
        console.log('🔴 useAuthState: Previous state before update:', {
          hadUser: !!user,
          hadSession: !!session,
          wasLoading: loading
        });
        
        // Use a more stable state update approach
        const newUser = session?.user ?? null;
        const newSession = session;
        const newLoading = false;
        
        console.log('🔴 useAuthState: 🚨 SETTING NEW STATE VALUES 🚨');
        console.log('🔴 useAuthState: New user:', !!newUser, newUser?.email);
        console.log('🔴 useAuthState: New session:', !!newSession);
        console.log('🔴 useAuthState: New loading:', newLoading);
        
        // Update state synchronously without transitions to prevent unmounting
        setSession(newSession);
        setUser(newUser);
        setLoading(newLoading);
        stateStable.current = true;
        
        console.log('🔴 useAuthState: State updated. New values:', {
          userSet: !!newUser,
          sessionSet: !!newSession,
          loading: newLoading,
          stateStable: stateStable.current,
          timestamp: new Date().toISOString()
        });

        console.log('🔴 useAuthState: ⚠️⚠️⚠️ AUTH STATE CHANGE COMPLETE ⚠️⚠️⚠️');
      }
    );

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
        
        console.log('🔴 useAuthState: About to set initial state...');
        
        // Update state with initial session
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
        
      } catch (err) {
        console.error('🔴 useAuthState: Exception during initial auth check:', err);
        setSession(null);
        setUser(null);
        setLoading(false);
        stateStable.current = true;
      }
    };

    // Get initial session
    getInitialSession();

    console.log('🔴 useAuthState: Initial session check started, returning cleanup function');

    return () => {
      console.log('🔴 useAuthState: CLEANUP - Unsubscribing auth listener');
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
