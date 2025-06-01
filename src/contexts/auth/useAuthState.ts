
import { useState, useEffect, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  const mountedRef = useRef(true);
  const authListenerRef = useRef<any>(null);
  const hookInstanceRef = useRef('auth-state-hook-bulletproof-ultimate');
  const initializationCompleteRef = useRef(false);
  const lastEventRef = useRef('NONE');

  console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] ===== HOOK RENDER =====');
  console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Hook instance:', hookInstanceRef.current);
  console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Current state:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email,
    sessionUserEmail: session?.user?.email,
    initialization: initializationCompleteRef.current,
    lastEvent: lastEventRef.current,
    timestamp: new Date().toISOString()
  });
  console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Stack trace for context:', new Error().stack);

  // Stable auth state handler with COMPREHENSIVE logging
  const handleAuthStateChange = useCallback((event: any, session: Session | null) => {
    console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] ⚡⚡⚡ AUTH STATE CHANGE EVENT ⚡⚡⚡');
    console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Event type:', event);
    console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Previous event:', lastEventRef.current);
    console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Mounted:', mountedRef.current);
    console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Session received:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userId: session?.user?.id,
      accessToken: session?.access_token ? 'present' : 'missing',
      timestamp: new Date().toISOString()
    });
    console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Call stack:', new Error().stack);

    if (!mountedRef.current) {
      console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] ❌ Component unmounted, ignoring auth change');
      return;
    }

    lastEventRef.current = event;
    
    console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] 🚨 SYNCHRONOUS STATE UPDATE START 🚨');
    
    try {
      console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Setting session state...');
      console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Session to set:', session ? 'VALID_SESSION' : 'NULL_SESSION');
      setSession(session);
      
      console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Setting user state...');
      const userToSet = session?.user ?? null;
      console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] User to set:', userToSet ? userToSet.email : 'NULL_USER');
      setUser(userToSet);
      
      console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Setting loading to false...');
      setLoading(false);
      
      console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Marking initialization complete...');
      initializationCompleteRef.current = true;
      
      console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] ✅ STATE UPDATE COMPLETED ✅');
      console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Final state should now be:', {
        userSet: !!userToSet,
        sessionSet: !!session,
        loadingSet: false,
        event: event,
        userEmail: userToSet?.email,
        userId: userToSet?.id
      });
      
      if (session?.user) {
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] 🎉🎉🎉 USER AUTHENTICATED SUCCESSFULLY 🎉🎉🎉');
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Authenticated user email:', session.user.email);
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Authenticated user ID:', session.user.id);
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] This should trigger useAuth to return authenticated state');
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] 🎯 CRITICAL: useAuth MUST NOW RETURN {hasUser: true, hasSession: true} 🎯');
        
        // FORCE IMMEDIATE VERIFICATION OF SUPABASE SESSION
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: verifySession }, error }) => {
            console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] 🔍 POST-LOGIN SESSION VERIFICATION 🔍');
            console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Verification session:', {
              hasSession: !!verifySession,
              hasUser: !!verifySession?.user,
              email: verifySession?.user?.email,
              error: error?.message,
              timestamp: new Date().toISOString()
            });
          });
        }, 100);
      } else {
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] User signed out or not authenticated');
      }
      
    } catch (error) {
      console.error('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] ❌ ERROR IN STATE UPDATE:', error);
      console.error('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] This is a critical failure in auth state setting');
      console.error('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Error stack:', error instanceof Error ? error.stack : 'No stack');
    }

    console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] ⚡⚡⚡ AUTH STATE CHANGE COMPLETE ⚡⚡⚡');
  }, []);

  useEffect(() => {
    console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] ===== SETUP EFFECT =====');
    console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Hook instance in effect:', hookInstanceRef.current);
    console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Effect start timestamp:', new Date().toISOString());
    console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Mount stack trace:', new Error().stack);
    
    mountedRef.current = true;
    
    if (authListenerRef.current) {
      console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] ⚠️ Listener already exists, cleaning up old one first');
      authListenerRef.current.unsubscribe();
      authListenerRef.current = null;
    }
    
    console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Setting up NEW auth listener...');
    
    // Setup auth listener with enhanced error handling
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
      authListenerRef.current = subscription;
      console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] ✅ Auth listener subscription created successfully');
      console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Subscription object:', subscription);
    } catch (error) {
      console.error('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] ❌ Failed to create auth listener:', error);
      console.error('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Error stack:', error instanceof Error ? error.stack : 'No stack');
    }

    console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Getting initial session...');

    // Get initial session with enhanced logging
    const getInitialSession = async () => {
      try {
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] 📞 Calling supabase.auth.getSession()...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] 📞 getSession() result:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          userId: session?.user?.id,
          error: error?.message,
          hookInstance: hookInstanceRef.current,
          timestamp: new Date().toISOString()
        });
        
        if (error) {
          console.error('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] ❌ Initial session error:', error);
          console.error('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Error details:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
          });
        }
        
        if (!mountedRef.current) {
          console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] ⚠️ Component unmounted during initial session fetch');
          return;
        }
        
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] 📝 Setting initial state from getSession...');
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        initializationCompleteRef.current = true;
        lastEventRef.current = 'INITIAL_SESSION';
        
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] ✅ Initial state set:', {
          user: !!session?.user, 
          session: !!session,
          loading: false,
          hookInstance: hookInstanceRef.current,
          userEmail: session?.user?.email
        });
        
        if (session?.user) {
          console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] 🎉 INITIAL SESSION HAS USER - AUTHENTICATED ON LOAD 🎉');
          console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] This should immediately show AUTHENTICATED state in useAuth');
        } else {
          console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Initial session has no user - starting unauthenticated');
        }
        
      } catch (err) {
        console.error('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] ❌ Exception in initial session check:', err);
        console.error('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Exception stack:', err instanceof Error ? err.stack : 'No stack');
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
      console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] ===== CLEANUP =====');
      console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] 🚨🚨🚨 HOOK UNMOUNTING 🚨🚨🚨');
      console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Hook cleanup for:', hookInstanceRef.current);
      console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Cleanup timestamp:', new Date().toISOString());
      console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Unmount stack trace:', new Error().stack);
      
      mountedRef.current = false;
      
      if (authListenerRef.current) {
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Unsubscribing auth listener');
        authListenerRef.current.unsubscribe();
        authListenerRef.current = null;
      }
      
      console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Hook cleanup completed');
    };
  }, [handleAuthStateChange]);

  console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] ===== HOOK RETURN =====');
  console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] About to return values:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email,
    sessionUserEmail: session?.user?.email,
    hookInstance: hookInstanceRef.current,
    initialized: initializationCompleteRef.current,
    lastEvent: lastEventRef.current,
    timestamp: new Date().toISOString()
  });

  return { user, session, loading };
};
