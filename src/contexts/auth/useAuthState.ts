
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
    userEmail: user?.email || 'NO_USER_EMAIL',
    sessionUserEmail: session?.user?.email || 'NO_SESSION_USER_EMAIL',
    userPhone: user?.phone || 'NO_USER_PHONE',
    sessionUserPhone: session?.user?.phone || 'NO_SESSION_USER_PHONE',
    initialization: initializationCompleteRef.current,
    lastEvent: lastEventRef.current,
    timestamp: new Date().toISOString()
  });

  // Stable auth state handler with COMPREHENSIVE logging and PROPER USER DETAIL EXTRACTION
  const handleAuthStateChange = useCallback((event: any, session: Session | null) => {
    console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] ⚡⚡⚡ AUTH STATE CHANGE EVENT ⚡⚡⚡');
    console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Event type:', event);
    console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Previous event:', lastEventRef.current);
    console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Mounted:', mountedRef.current);
    
    if (session?.user) {
      console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] 🔍 DETAILED SESSION USER ANALYSIS 🔍');
      console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Session user email:', session.user.email || 'NO_EMAIL');
      console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Session user phone:', session.user.phone || 'NO_PHONE');
      console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Session user ID:', session.user.id);
    }

    console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Session received:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email || 'NO_EMAIL_IN_SESSION',
      userPhone: session?.user?.phone || 'NO_PHONE_IN_SESSION',
      userId: session?.user?.id || 'NO_ID_IN_SESSION',
      accessToken: session?.access_token ? 'present' : 'missing',
      refreshToken: session?.refresh_token ? 'present' : 'missing',
      timestamp: new Date().toISOString()
    });

    if (!mountedRef.current) {
      console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] ❌ Component unmounted, ignoring auth change');
      return;
    }

    lastEventRef.current = event;
    
    console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] 🚨 SYNCHRONOUS STATE UPDATE START 🚨');
    
    try {
      console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Setting session state...');
      setSession(session);
      
      console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Extracting user from session...');
      const userToSet = session?.user ?? null;
      
      if (userToSet) {
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] 🎯 USER OBJECT TO BE SET IN STATE 🎯');
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] User email:', userToSet.email || 'NO_EMAIL_ON_USER_OBJECT');
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] User phone:', userToSet.phone || 'NO_PHONE_ON_USER_OBJECT');
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] User ID:', userToSet.id);
        
        setUser(userToSet);
        
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] ✅ USER STATE SET WITH EMAIL:', userToSet.email || 'NULL');
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] ✅ USER STATE SET WITH PHONE:', userToSet.phone || 'NULL');
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] ✅ USER STATE SET WITH ID:', userToSet.id);
      } else {
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Setting user to null (no session user)');
        setUser(null);
      }
      
      console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Setting loading to false...');
      setLoading(false);
      
      console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Marking initialization complete...');
      initializationCompleteRef.current = true;
      
      console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] ✅ STATE UPDATE COMPLETED ✅');
      
      if (session?.user) {
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] 🎉🎉🎉 USER AUTHENTICATED SUCCESSFULLY 🎉🎉🎉');
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Authenticated user email:', session.user.email || 'NULL');
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Authenticated user phone:', session.user.phone || 'NULL');
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Authenticated user ID:', session.user.id);
      } else if (event === 'SIGNED_OUT') {
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] 🚪 USER SIGNED OUT SUCCESSFULLY 🚪');
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Session cleared, user state should be null');
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] useAuth should now return unauthenticated state');
      } else {
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] User signed out or not authenticated');
      }
      
    } catch (error) {
      console.error('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] ❌ ERROR IN STATE UPDATE:', error);
      console.error('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] This is a critical failure in auth state setting');
    }

    console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] ⚡⚡⚡ AUTH STATE CHANGE COMPLETE ⚡⚡⚡');
  }, []);

  useEffect(() => {
    console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] ===== SETUP EFFECT =====');
    console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Hook instance in effect:', hookInstanceRef.current);
    
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
    } catch (error) {
      console.error('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] ❌ Failed to create auth listener:', error);
    }

    console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Getting initial session...');

    // Get initial session with enhanced logging and PROPER USER EXTRACTION
    const getInitialSession = async () => {
      try {
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] 📞 Calling supabase.auth.getSession()...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] 📞 getSession() result:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email || 'NO_EMAIL_IN_INITIAL_SESSION',
          userPhone: session?.user?.phone || 'NO_PHONE_IN_INITIAL_SESSION',
          userId: session?.user?.id || 'NO_ID_IN_INITIAL_SESSION',
          error: error?.message,
          hookInstance: hookInstanceRef.current,
          timestamp: new Date().toISOString()
        });
        
        if (error) {
          console.error('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] ❌ Initial session error:', error);
        }
        
        if (!mountedRef.current) {
          console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] ⚠️ Component unmounted during initial session fetch');
          return;
        }
        
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] 📝 Setting initial state from getSession...');
        
        const initialUser = session?.user ?? null;
        
        setSession(session);
        setUser(initialUser);
        setLoading(false);
        initializationCompleteRef.current = true;
        lastEventRef.current = 'INITIAL_SESSION';
        
        console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] ✅ Initial state set:', {
          user: !!initialUser, 
          userEmail: initialUser?.email || 'NO_INITIAL_EMAIL',
          userPhone: initialUser?.phone || 'NO_INITIAL_PHONE',
          userId: initialUser?.id || 'NO_INITIAL_ID',
          session: !!session,
          loading: false,
          hookInstance: hookInstanceRef.current,
          timestamp: new Date().toISOString()
        });
        
        if (session?.user) {
          console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] 🎉 INITIAL SESSION HAS USER - AUTHENTICATED ON LOAD 🎉');
          console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Initial user email should be:', session.user.email || 'NULL');
          console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Initial user phone should be:', session.user.phone || 'NULL');
        } else {
          console.log('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] Initial session has no user - starting unauthenticated');
        }
        
      } catch (err) {
        console.error('🔴🔴🔴 [USE_AUTH_STATE_ULTIMATE] ❌ Exception in initial session check:', err);
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
    userEmail: user?.email || 'NO_EMAIL_IN_RETURN',
    userPhone: user?.phone || 'NO_PHONE_IN_RETURN',
    userId: user?.id || 'NO_ID_IN_RETURN',
    sessionUserEmail: session?.user?.email || 'NO_SESSION_EMAIL_IN_RETURN',
    sessionUserPhone: session?.user?.phone || 'NO_SESSION_PHONE_IN_RETURN',
    sessionUserId: session?.user?.id || 'NO_SESSION_ID_IN_RETURN',
    hookInstance: hookInstanceRef.current,
    initialized: initializationCompleteRef.current,
    lastEvent: lastEventRef.current,
    timestamp: new Date().toISOString()
  });

  return { user, session, loading };
};
