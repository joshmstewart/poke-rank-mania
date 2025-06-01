
import { useState, useEffect, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  const mountedRef = useRef(true);
  const authListenerRef = useRef<any>(null);
  const hookInstanceRef = useRef('auth-state-hook-main');
  const initializationCompleteRef = useRef(false);
  const lastEventRef = useRef('NONE');

  console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] ===== HOOK RENDER =====');
  console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Hook instance:', hookInstanceRef.current);
  console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Current state:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email,
    sessionUserEmail: session?.user?.email,
    initialization: initializationCompleteRef.current,
    lastEvent: lastEventRef.current,
    timestamp: new Date().toISOString()
  });

  // Stable auth state handler
  const handleAuthStateChange = useCallback((event: any, session: Session | null) => {
    if (!mountedRef.current) {
      console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Component unmounted, ignoring auth change');
      return;
    }

    console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] ⚠️ AUTH STATE CHANGE ⚠️');
    console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Event:', event);
    console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Previous event:', lastEventRef.current);
    console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Hook instance handling:', hookInstanceRef.current);
    console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Session data:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userId: session?.user?.id,
      sessionId: session?.access_token?.substring(0, 20) + '...' || 'none',
      timestamp: new Date().toISOString()
    });
    
    lastEventRef.current = event;
    
    console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] 🚨 UPDATING STATE SYNCHRONOUSLY 🚨');
    
    // CRITICAL: Synchronous state updates
    try {
      console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Setting session...');
      setSession(session);
      
      console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Setting user...');
      setUser(session?.user ?? null);
      
      console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Setting loading to false...');
      setLoading(false);
      
      console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Marking initialization complete...');
      initializationCompleteRef.current = true;
      
      console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] ✅ STATE UPDATE COMPLETED ✅');
      console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] New state values:', {
        userSet: !!session?.user,
        sessionSet: !!session,
        loading: false,
        hookInstance: hookInstanceRef.current,
        event: event
      });
      
      if (session?.user) {
        console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] 🎉 USER AUTHENTICATED 🎉');
        console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] User email:', session.user.email);
        console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] User ID:', session.user.id);
        console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] This should trigger NAWGTI to show AUTHENTICATED state');
        console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] 🎯 CRITICAL: NAWGTI MUST REMAIN VISIBLE NOW 🎯');
      } else {
        console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] User signed out or not authenticated');
      }
      
    } catch (error) {
      console.error('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] ❌ ERROR IN STATE UPDATE:', error);
    }

    console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] ⚠️ AUTH STATE CHANGE COMPLETE ⚠️');
  }, []);

  useEffect(() => {
    console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] ===== SETUP EFFECT =====');
    console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Hook instance in effect:', hookInstanceRef.current);
    console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Effect start timestamp:', new Date().toISOString());
    
    mountedRef.current = true;
    
    if (authListenerRef.current) {
      console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Listener already exists, skipping setup');
      return;
    }
    
    console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Setting up auth listener...');
    
    // Setup auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    authListenerRef.current = subscription;

    console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Auth listener subscription created');
    console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Getting initial session...');

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Calling supabase.auth.getSession()...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Initial session result:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          userId: session?.user?.id,
          error: error?.message,
          hookInstance: hookInstanceRef.current,
          timestamp: new Date().toISOString()
        });
        
        if (error) {
          console.error('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Initial session error:', error);
        }
        
        if (!mountedRef.current) {
          console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Component unmounted during initial session fetch');
          return;
        }
        
        console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Setting initial state...');
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        initializationCompleteRef.current = true;
        lastEventRef.current = 'INITIAL_SESSION';
        
        console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Initial state set:', {
          user: !!session?.user, 
          session: !!session,
          loading: false,
          hookInstance: hookInstanceRef.current,
          userEmail: session?.user?.email
        });
        
        if (session?.user) {
          console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] 🎉 INITIAL SESSION HAS USER 🎉');
          console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] This should immediately show AUTHENTICATED state');
        }
        
      } catch (err) {
        console.error('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Exception in initial session check:', err);
        if (mountedRef.current) {
          setSession(null);
          setUser(null);
          setLoading(false);
          initializationCompleteRef.current = true;
          lastEventRef.current = 'INITIAL_ERROR';
        }
      }
    };

    getInitialSession();

    return () => {
      console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] ===== CLEANUP =====');
      console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Hook cleanup for:', hookInstanceRef.current);
      console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Cleanup timestamp:', new Date().toISOString());
      
      mountedRef.current = false;
      
      if (authListenerRef.current) {
        console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Unsubscribing auth listener');
        authListenerRef.current.unsubscribe();
        authListenerRef.current = null;
      }
      
      console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Hook cleanup completed');
    };
  }, [handleAuthStateChange]);

  console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] ===== HOOK RETURN =====');
  console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Returning hook values:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email,
    sessionUserEmail: session?.user?.email,
    hookInstance: hookInstanceRef.current,
    initialized: initializationCompleteRef.current,
    lastEvent: lastEventRef.current
  });

  return { user, session, loading };
};
