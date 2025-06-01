
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

  console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] ===== HOOK RENDER =====');
  console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Hook instance:', hookInstanceRef.current);
  console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Current state:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email,
    initialization: initializationCompleteRef.current,
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
    console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Hook instance handling:', hookInstanceRef.current);
    console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] New session data:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userId: session?.user?.id,
      timestamp: new Date().toISOString()
    });
    
    console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] 🚨 UPDATING STATE SYNCHRONOUSLY 🚨');
    
    // CRITICAL: Synchronous state updates
    try {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      initializationCompleteRef.current = true;
      
      console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] ✅ STATE UPDATE COMPLETED ✅');
      console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] New state values:', {
        userSet: !!session?.user,
        sessionSet: !!session,
        loading: false,
        hookInstance: hookInstanceRef.current
      });
      
      if (session?.user) {
        console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] 🎉 USER AUTHENTICATED 🎉');
        console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] This should trigger NAWGTI to show AUTHENTICATED state');
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
    
    mountedRef.current = true;
    
    if (authListenerRef.current) {
      console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Listener already exists, skipping');
      return;
    }
    
    console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Setting up auth listener...');
    
    // Setup auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    authListenerRef.current = subscription;

    console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Getting initial session...');

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Calling getSession()...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Initial session result:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          error: error?.message,
          hookInstance: hookInstanceRef.current
        });
        
        if (error) {
          console.error('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Initial session error:', error);
        }
        
        if (!mountedRef.current) return;
        
        console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Setting initial state...');
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        initializationCompleteRef.current = true;
        
        console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Initial state set:', {
          user: !!session?.user, 
          session: !!session,
          loading: false,
          hookInstance: hookInstanceRef.current
        });
        
      } catch (err) {
        console.error('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Exception in initial check:', err);
        if (mountedRef.current) {
          setSession(null);
          setUser(null);
          setLoading(false);
          initializationCompleteRef.current = true;
        }
      }
    };

    getInitialSession();

    return () => {
      console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] ===== CLEANUP =====');
      console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Hook cleanup for:', hookInstanceRef.current);
      mountedRef.current = false;
      if (authListenerRef.current) {
        authListenerRef.current.unsubscribe();
        authListenerRef.current = null;
      }
    };
  }, [handleAuthStateChange]);

  console.log('🔴🔴🔴 [USE_AUTH_STATE_NAWGTI] Returning hook values:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email,
    hookInstance: hookInstanceRef.current,
    initialized: initializationCompleteRef.current
  });

  return { user, session, loading };
};
