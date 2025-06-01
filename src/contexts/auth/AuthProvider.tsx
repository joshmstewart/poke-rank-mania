
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
    userId: user?.id || 'NO_USER_ID_FROM_HOOK',
    sessionUserEmail: session?.user?.email || 'NO_SESSION_USER_EMAIL_FROM_HOOK',
    sessionUserId: session?.user?.id || 'NO_SESSION_USER_ID_FROM_HOOK',
    userObjectFull: user ? {
      id: user.id,
      email: user.email,
      email_confirmed_at: user.email_confirmed_at,
      phone: user.phone,
      created_at: user.created_at,
      user_metadata: user.user_metadata,
      app_metadata: user.app_metadata
    } : 'NULL_USER_FROM_HOOK',
    sessionUserObjectFull: session?.user ? {
      id: session.user.id,
      email: session.user.email,
      email_confirmed_at: session.user.email_confirmed_at,
      phone: session.user.phone,
      created_at: session.user.created_at,
      user_metadata: session.user.user_metadata,
      app_metadata: session.user.app_metadata
    } : 'NULL_SESSION_USER_FROM_HOOK',
    timestamp: new Date().toISOString()
  });
  console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] Render stack trace:', new Error().stack);

  // Compute auth state - be very explicit about the logic
  const authState = loading ? 'LOADING' : (user || session?.user) ? 'AUTHENTICATED' : 'UNAUTHENTICATED';
  
  console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] ⚡ AUTH STATE COMPUTATION ⚡');
  console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] - loading:', loading);
  console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] - user exists:', !!user);
  console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] - user email:', user?.email || 'NO_USER_EMAIL');
  console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] - session.user exists:', !!session?.user);
  console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] - session.user email:', session?.user?.email || 'NO_SESSION_USER_EMAIL');
  console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] - computed authState:', authState);
  console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] - previous authState:', lastAuthStateRef.current);

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
      userEmail: contextToProvide.user?.email || 'NO_EMAIL_IN_CONTEXT_USER',
      userId: contextToProvide.user?.id || 'NO_ID_IN_CONTEXT_USER',
      sessionUserEmail: contextToProvide.session?.user?.email || 'NO_EMAIL_IN_CONTEXT_SESSION',
      sessionUserId: contextToProvide.session?.user?.id || 'NO_ID_IN_CONTEXT_SESSION',
      userFromUseAuthState: !!user,
      sessionFromUseAuthState: !!session,
      loadingFromUseAuthState: loading,
      timestamp: new Date().toISOString()
    });

    return contextToProvide;
  }, [user, session, loading]);

  console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] 🎯 FINAL CONTEXT VALUE TO BE PROVIDED 🎯');
  console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] Final context value:', {
    hasUser: !!contextValue.user,
    hasSession: !!contextValue.session,
    loading: contextValue.loading,
    userEmail: contextValue.user?.email || 'NO_FINAL_USER_EMAIL',
    userId: contextValue.user?.id || 'NO_FINAL_USER_ID',
    sessionUserEmail: contextValue.session?.user?.email || 'NO_FINAL_SESSION_EMAIL',
    sessionUserId: contextValue.session?.user?.id || 'NO_FINAL_SESSION_ID',
    timestamp: new Date().toISOString()
  });

  // Communicate auth state to parent wrapper
  useEffect(() => {
    console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] ===== AUTH STATE EFFECT =====');
    console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] Provider instance:', providerInstanceRef.current);
    console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] Effect triggered with state:', authState);
    console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] Previous state was:', lastAuthStateRef.current);
    console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] State changed:', lastAuthStateRef.current !== authState);
    console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] Effect stack trace:', new Error().stack);

    // Check if state actually changed
    if (lastAuthStateRef.current !== authState) {
      console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] 🚨 AUTH STATE CHANGED 🚨');
      console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] From:', lastAuthStateRef.current);
      console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] To:', authState);
      
      lastAuthStateRef.current = authState;
    }
    
    console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] Current auth state for nawgti:', authState);
    console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] Detailed auth info:', {
      hasUser: !!user,
      hasSession: !!session,
      loading,
      userEmail: user?.email || session?.user?.email || 'NO_EMAIL_AVAILABLE',
      userId: user?.id || session?.user?.id || 'NO_ID_AVAILABLE',
      timestamp: new Date().toISOString()
    });
    
    // Dispatch custom event to notify AuthWrapper
    const eventDetail = { 
      authState, 
      timestamp: new Date().toISOString(),
      providerInstance: providerInstanceRef.current,
      userEmail: user?.email || session?.user?.email || 'NO_EMAIL_FOR_EVENT',
      userId: user?.id || session?.user?.id || 'NO_ID_FOR_EVENT'
    };
    
    console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] Dispatching nawgti-auth-state event with:', eventDetail);
    
    window.dispatchEvent(new CustomEvent('nawgti-auth-state', { 
      detail: eventDetail
    }));
    
    console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] Event dispatched successfully');
    
    if (authState === 'AUTHENTICATED') {
      console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] ✅✅✅ PROVIDER REPORTS AUTHENTICATED ✅✅✅');
      console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] User email:', user?.email || session?.user?.email || 'NO_EMAIL_DESPITE_AUTH');
      console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] User ID:', user?.id || session?.user?.id || 'NO_ID_DESPITE_AUTH');
      console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] 🎯 useAuth CONSUMERS SHOULD NOW SEE AUTHENTICATED STATE WITH EMAIL 🎯');
      console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] NAWGTI SHOULD REMAIN STABLE WITH THIS STATE');
    } else if (authState === 'LOADING') {
      console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] Provider reports LOADING state');
    } else {
      console.log('🔴🔴🔴 [AUTH_PROVIDER_ULTIMATE] Provider reports UNAUTHENTICATED state');
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

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ 
        position: 'fixed', 
        top: '90px', 
        left: '10px', 
        zIndex: 9998, 
        backgroundColor: 'red', 
        color: 'white', 
        padding: '10px',
        fontSize: '12px',
        border: '3px solid yellow',
        maxWidth: '400px'
      }}>
        🔴 AUTH PROVIDER ULTIMATE: {authState} | Render #{renderCount.current}<br/>
        Instance: {providerInstanceRef.current}<br/>
        User: {user?.email || 'none'}<br/>
        Session: {session?.user?.email || 'none'}<br/>
        Loading: {loading ? 'YES' : 'NO'}<br/>
        <span style={{ fontSize: '10px', color: 'yellow' }}>
          This should show AUTHENTICATED with EMAIL post-login
        </span>
      </div>
      <AuthContext.Provider value={contextValue}>
        {children}
      </AuthContext.Provider>
    </div>
  );
};

export { AuthContext };
