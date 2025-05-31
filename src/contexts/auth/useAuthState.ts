
import { useState, useEffect, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Critical refs to prevent component unmounting
  const mountedRef = useRef(true);
  const authListenerRef = useRef<any>(null);
  const stateInitializedRef = useRef(false);
  const hookInstanceRef = useRef(Math.random().toString(36).substring(7));

  console.log('🔴🔴🔴 USE_AUTH_STATE: ===== HOOK INITIALIZED =====');
  console.log('🔴🔴🔴 USE_AUTH_STATE: Hook instance ID:', hookInstanceRef.current);
  console.log('🔴🔴🔴 USE_AUTH_STATE: Current state at init:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email,
    timestamp: new Date().toISOString()
  });

  // Stable auth state handler that won't cause unmounting
  const handleAuthStateChange = useCallback((event: any, session: Session | null) => {
    if (!mountedRef.current) {
      console.log('🔴🔴🔴 USE_AUTH_STATE: Component unmounted, ignoring auth state change');
      return;
    }

    console.log('🔴🔴🔴 USE_AUTH_STATE: ⚠️⚠️⚠️ AUTH STATE CHANGE EVENT TRIGGERED ⚠️⚠️⚠️');
    console.log('🔴🔴🔴 USE_AUTH_STATE: Event type:', event);
    console.log('🔴🔴🔴 USE_AUTH_STATE: Hook instance handling event:', hookInstanceRef.current);
    console.log('🔴🔴🔴 USE_AUTH_STATE: Session in callback:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userId: session?.user?.id,
      timestamp: new Date().toISOString()
    });
    
    console.log('🔴🔴🔴 USE_AUTH_STATE: About to update state - CRITICAL POINT');
    console.log('🔴🔴🔴 USE_AUTH_STATE: Previous state before update:', {
      hadUser: !!user,
      hadSession: !!session,
      wasLoading: loading
    });
    
    // CRITICAL: Use synchronous state updates to prevent component tree destruction
    if (mountedRef.current) {
      console.log('🔴🔴🔴 USE_AUTH_STATE: 🚨 SETTING NEW STATE VALUES SYNCHRONOUSLY 🚨');
      console.log('🔴🔴🔴 USE_AUTH_STATE: New user:', !!session?.user, session?.user?.email);
      console.log('🔴🔴🔴 USE_AUTH_STATE: New session:', !!session);
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      stateInitializedRef.current = true;
      
      console.log('🔴🔴🔴 USE_AUTH_STATE: State updated successfully:', {
        userSet: !!session?.user,
        sessionSet: !!session,
        loading: false,
        stateInitialized: stateInitializedRef.current,
        hookInstance: hookInstanceRef.current,
        timestamp: new Date().toISOString()
      });
    }

    console.log('🔴🔴🔴 USE_AUTH_STATE: ⚠️⚠️⚠️ AUTH STATE CHANGE COMPLETE ⚠️⚠️⚠️');
  }, [user, session, loading]);

  useEffect(() => {
    console.log('🔴🔴🔴 USE_AUTH_STATE: ===== USEEFFECT STARTING =====');
    console.log('🔴🔴🔴 USE_AUTH_STATE: Hook instance in effect:', hookInstanceRef.current);
    console.log('🔴🔴🔴 USE_AUTH_STATE: Auth listener already set?', !!authListenerRef.current);
    
    mountedRef.current = true;
    
    // Prevent multiple listeners
    if (authListenerRef.current) {
      console.log('🔴🔴🔴 USE_AUTH_STATE: Auth listener already exists, skipping setup');
      return;
    }
    
    console.log('🔴🔴🔴 USE_AUTH_STATE: Setting up auth listener...');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    authListenerRef.current = subscription;

    console.log('🔴🔴🔴 USE_AUTH_STATE: Auth listener set up, now getting initial session...');

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔴🔴🔴 USE_AUTH_STATE: Calling supabase.auth.getSession()...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('🔴🔴🔴 USE_AUTH_STATE: Initial session response:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          userId: session?.user?.id,
          error: error?.message,
          hookInstance: hookInstanceRef.current,
          timestamp: new Date().toISOString()
        });
        
        if (error) {
          console.error('🔴🔴🔴 USE_AUTH_STATE: Error getting initial session:', error);
        }
        
        if (!mountedRef.current) return;
        
        console.log('🔴🔴🔴 USE_AUTH_STATE: About to set initial state synchronously...');
        
        // Update state with initial session synchronously
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        stateInitializedRef.current = true;
        
        console.log('🔴🔴🔴 USE_AUTH_STATE: Initial state set:', {
          user: !!session?.user, 
          session: !!session,
          loading: false,
          stateInitialized: stateInitializedRef.current,
          hookInstance: hookInstanceRef.current,
          timestamp: new Date().toISOString()
        });
        
      } catch (err) {
        console.error('🔴🔴🔴 USE_AUTH_STATE: Exception during initial auth check:', err);
        if (mountedRef.current) {
          setSession(null);
          setUser(null);
          setLoading(false);
          stateInitializedRef.current = true;
        }
      }
    };

    getInitialSession();

    console.log('🔴🔴🔴 USE_AUTH_STATE: Initial session check started, returning cleanup function');

    return () => {
      console.log('🔴🔴🔴 USE_AUTH_STATE: ===== CLEANUP TRIGGERED =====');
      console.log('🔴🔴🔴 USE_AUTH_STATE: Hook instance cleaning up:', hookInstanceRef.current);
      mountedRef.current = false;
      if (authListenerRef.current) {
        authListenerRef.current.unsubscribe();
        authListenerRef.current = null;
      }
    };
  }, []); // Empty dependency array to ensure this only runs once

  console.log('🔴🔴🔴 USE_AUTH_STATE: Hook returning values:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    stateInitialized: stateInitializedRef.current,
    userEmail: user?.email,
    hookInstance: hookInstanceRef.current,
    timestamp: new Date().toISOString()
  });

  return { user, session, loading };
};
