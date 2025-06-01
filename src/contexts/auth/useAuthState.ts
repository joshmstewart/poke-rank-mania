
import { useState, useEffect, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  const mountedRef = useRef(true);
  const authListenerRef = useRef<any>(null);
  const hookInstanceRef = useRef('auth-state-hook-main-fixed');
  const initializationCompleteRef = useRef(false);
  const lastEventRef = useRef('NONE');

  console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] ===== HOOK RENDER =====');
  console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] Hook instance:', hookInstanceRef.current);
  console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] Current state:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email,
    sessionUserEmail: session?.user?.email,
    initialization: initializationCompleteRef.current,
    lastEvent: lastEventRef.current,
    timestamp: new Date().toISOString()
  });

  // Stable auth state handler with COMPREHENSIVE logging
  const handleAuthStateChange = useCallback((event: any, session: Session | null) => {
    console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] ⚡⚡⚡ AUTH STATE CHANGE EVENT ⚡⚡⚡');
    console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] Event type:', event);
    console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] Previous event:', lastEventRef.current);
    console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] Mounted:', mountedRef.current);
    console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] Session received:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userId: session?.user?.id,
      accessToken: session?.access_token ? 'present' : 'missing',
      timestamp: new Date().toISOString()
    });

    if (!mountedRef.current) {
      console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] ❌ Component unmounted, ignoring auth change');
      return;
    }

    lastEventRef.current = event;
    
    console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] 🚨 SYNCHRONOUS STATE UPDATE START 🚨');
    
    try {
      console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] Setting session state...');
      console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] Session to set:', session ? 'VALID_SESSION' : 'NULL_SESSION');
      setSession(session);
      
      console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] Setting user state...');
      const userToSet = session?.user ?? null;
      console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] User to set:', userToSet ? userToSet.email : 'NULL_USER');
      setUser(userToSet);
      
      console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] Setting loading to false...');
      setLoading(false);
      
      console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] Marking initialization complete...');
      initializationCompleteRef.current = true;
      
      console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] ✅ STATE UPDATE COMPLETED ✅');
      console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] Final state should now be:', {
        userSet: !!userToSet,
        sessionSet: !!session,
        loadingSet: false,
        event: event,
        userEmail: userToSet?.email,
        userId: userToSet?.id
      });
      
      if (session?.user) {
        console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] 🎉🎉🎉 USER AUTHENTICATED SUCCESSFULLY 🎉🎉🎉');
        console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] Authenticated user email:', session.user.email);
        console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] Authenticated user ID:', session.user.id);
        console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] This should trigger useAuth to return authenticated state');
        console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] 🎯 CRITICAL: useAuth MUST NOW RETURN {hasUser: true, hasSession: true} 🎯');
      } else {
        console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] User signed out or not authenticated');
      }
      
    } catch (error) {
      console.error('🔴🔴🔴 [USE_AUTH_STATE_FIXED] ❌ ERROR IN STATE UPDATE:', error);
      console.error('🔴🔴🔴 [USE_AUTH_STATE_FIXED] This is a critical failure in auth state setting');
    }

    console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] ⚡⚡⚡ AUTH STATE CHANGE COMPLETE ⚡⚡⚡');
  }, []);

  useEffect(() => {
    console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] ===== SETUP EFFECT =====');
    console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] Hook instance in effect:', hookInstanceRef.current);
    console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] Effect start timestamp:', new Date().toISOString());
    
    mountedRef.current = true;
    
    if (authListenerRef.current) {
      console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] ⚠️ Listener already exists, cleaning up old one first');
      authListenerRef.current.unsubscribe();
      authListenerRef.current = null;
    }
    
    console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] Setting up NEW auth listener...');
    
    // Setup auth listener with enhanced error handling
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
      authListenerRef.current = subscription;
      console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] ✅ Auth listener subscription created successfully');
    } catch (error) {
      console.error('🔴🔴🔴 [USE_AUTH_STATE_FIXED] ❌ Failed to create auth listener:', error);
    }

    console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] Getting initial session...');

    // Get initial session with enhanced logging
    const getInitialSession = async () => {
      try {
        console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] 📞 Calling supabase.auth.getSession()...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] 📞 getSession() result:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          userId: session?.user?.id,
          error: error?.message,
          hookInstance: hookInstanceRef.current,
          timestamp: new Date().toISOString()
        });
        
        if (error) {
          console.error('🔴🔴🔴 [USE_AUTH_STATE_FIXED] ❌ Initial session error:', error);
        }
        
        if (!mountedRef.current) {
          console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] ⚠️ Component unmounted during initial session fetch');
          return;
        }
        
        console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] 📝 Setting initial state from getSession...');
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        initializationCompleteRef.current = true;
        lastEventRef.current = 'INITIAL_SESSION';
        
        console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] ✅ Initial state set:', {
          user: !!session?.user, 
          session: !!session,
          loading: false,
          hookInstance: hookInstanceRef.current,
          userEmail: session?.user?.email
        });
        
        if (session?.user) {
          console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] 🎉 INITIAL SESSION HAS USER - AUTHENTICATED ON LOAD 🎉');
          console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] This should immediately show AUTHENTICATED state in useAuth');
        } else {
          console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] Initial session has no user - starting unauthenticated');
        }
        
      } catch (err) {
        console.error('🔴🔴🔴 [USE_AUTH_STATE_FIXED] ❌ Exception in initial session check:', err);
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
      console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] ===== CLEANUP =====');
      console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] Hook cleanup for:', hookInstanceRef.current);
      console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] Cleanup timestamp:', new Date().toISOString());
      
      mountedRef.current = false;
      
      if (authListenerRef.current) {
        console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] Unsubscribing auth listener');
        authListenerRef.current.unsubscribe();
        authListenerRef.current = null;
      }
      
      console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] Hook cleanup completed');
    };
  }, [handleAuthStateChange]);

  console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] ===== HOOK RETURN =====');
  console.log('🔴🔴🔴 [USE_AUTH_STATE_FIXED] About to return values:', {
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
