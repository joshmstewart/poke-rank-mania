import React, { createContext, useRef, useEffect } from 'react';
import { AuthContextType } from './types';
import { authService } from './authService';
import { useAuthState } from './useAuthState';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session, loading } = useAuthState();
  const renderCount = useRef(0);
  const providerInstanceRef = useRef('auth-provider-bulletproof-ultimate');
  const lastAuthStateRef = useRef('INITIAL');
  
  renderCount.current += 1;

  console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] ===== AUTH PROVIDER RENDER =====');
  console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] Provider instance:', providerInstanceRef.current);
  console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] Render count:', renderCount.current);
  console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] Raw auth data from useAuthState:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email || 'NO_USER_EMAIL_FROM_HOOK',
    userPhone: user?.phone || 'NO_USER_PHONE_FROM_HOOK',
    userId: user?.id || 'NO_USER_ID_FROM_HOOK',
    sessionUserEmail: session?.user?.email || 'NO_SESSION_USER_EMAIL_FROM_HOOK',
    sessionUserPhone: session?.user?.phone || 'NO_SESSION_USER_PHONE_FROM_HOOK',
    sessionUserId: session?.user?.id || 'NO_SESSION_USER_ID_FROM_HOOK',
    timestamp: new Date().toISOString()
  });

  // Compute auth state - be very explicit about the logic
  const authState = loading ? 'LOADING' : (user || session?.user) ? 'AUTHENTICATED' : 'UNAUTHENTICATED';
  
  console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] ⚡ AUTH STATE COMPUTATION ⚡');
  console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] - loading:', loading);
  console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] - user exists:', !!user);
  console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] - session.user exists:', !!session?.user);
  console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] - computed authState:', authState);

  // Critical: Log what will be provided to useAuth consumers
  const contextValue = React.useMemo(() => {
    const contextToProvide = {
      user,
      session,
      loading,
      signIn: authService.signIn,
      signUp: authService.signUp,
      signOut: authService.signOut,
      signInWithGoogle: authService.signInWithGoogle,
      signInWithPhone: authService.signInWithPhone,
      verifyPhoneOtp: authService.verifyPhoneOtp,
    };

    console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] 🎯 CONTEXT VALUE BEING MEMOIZED 🎯');
    console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] Context value to provide:', {
      hasUser: !!contextToProvide.user,
      hasSession: !!contextToProvide.session,
      loading: contextToProvide.loading,
      userEmail: contextToProvide.user?.email || null,
      userPhone: contextToProvide.user?.phone || null,
      userId: contextToProvide.user?.id || null,
      sessionUserEmail: contextToProvide.session?.user?.email || null,
      sessionUserPhone: contextToProvide.session?.user?.phone || null,
      sessionUserId: contextToProvide.session?.user?.id || null,
      timestamp: new Date().toISOString()
    });

    return contextToProvide;
  }, [user, session, loading]);

  // Communicate auth state to parent wrapper
  useEffect(() => {
    console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] ===== AUTH STATE EFFECT =====');
    console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] Effect triggered with state:', authState);
    console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] Previous state was:', lastAuthStateRef.current);
    console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] State changed:', lastAuthStateRef.current !== authState);

    // Check if state actually changed
    if (lastAuthStateRef.current !== authState) {
      console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] 🚨 AUTH STATE CHANGED 🚨');
      console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] From:', lastAuthStateRef.current);
      console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] To:', authState);
      
      lastAuthStateRef.current = authState;
    }
    
    // CRITICAL: Dispatch event with complete user details for AuthWrapper consumption
    const eventDetail = { 
      authState, 
      timestamp: new Date().toISOString(),
      providerInstance: providerInstanceRef.current,
      userEmail: user?.email || session?.user?.email || null,
      userPhone: user?.phone || session?.user?.phone || null,
      userId: user?.id || session?.user?.id || null,
      hasUser: !!user,
      hasSession: !!session,
      loading
    };
    
    console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] Dispatching nawgti-auth-state event with:', eventDetail);
    
    window.dispatchEvent(new CustomEvent('nawgti-auth-state', { 
      detail: eventDetail
    }));
    
    console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] Event dispatched successfully');
    
    if (authState === 'AUTHENTICATED') {
      console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] ✅✅✅ PROVIDER REPORTS AUTHENTICATED ✅✅✅');
      console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] User email:', user?.email || session?.user?.email || null);
      console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] User phone:', user?.phone || session?.user?.phone || null);
      console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] User ID:', user?.id || session?.user?.id || null);
      console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] 🎯 useAuth CONSUMERS SHOULD NOW SEE AUTHENTICATED STATE 🎯');
      console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] 🎯 NAWGTI SHOULD RECEIVE EVENT AND UPDATE TO AUTHENTICATED 🎯');
    }
  }, [user, session, loading, authState]);

  useEffect(() => {
    console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] ===== PROVIDER MOUNTED =====');
    console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] Provider mounted with instance:', providerInstanceRef.current);
    console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] Mount timestamp:', new Date().toISOString());
    console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] Mount stack trace:', new Error().stack);
    
    return () => {
      console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] ===== PROVIDER UNMOUNT =====');
      console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] 🚨🚨🚨 AUTH PROVIDER UNMOUNTING 🚨🚨🚨');
      console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] Instance unmounting:', providerInstanceRef.current);
      console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] Unmount timestamp:', new Date().toISOString());
      console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] Final auth state:', authState);
      console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] Unmount stack trace:', new Error().stack);
    };
  }, []);

  console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] About to render context with children');
  console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] Final auth state for this render:', authState);

  // Clean production wrapper - no visual debug overlay
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
