
import React, { createContext, useRef, useEffect } from 'react';
import { AuthContextType } from './types';
import { authService } from './authService';
import { useAuthState } from './useAuthState';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session, loading } = useAuthState();
  const renderCount = useRef(0);
  const providerInstanceRef = useRef('auth-provider-main');
  const lastAuthStateRef = useRef('INITIAL');
  
  renderCount.current += 1;

  console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] ===== AUTH PROVIDER RENDER =====');
  console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] Provider instance:', providerInstanceRef.current);
  console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] Render count:', renderCount.current);
  console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] Raw auth data:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email,
    sessionUserEmail: session?.user?.email,
    userId: user?.id,
    sessionUserId: session?.user?.id,
    timestamp: new Date().toISOString()
  });

  // Compute auth state - be very explicit about the logic
  const authState = loading ? 'LOADING' : (user || session?.user) ? 'AUTHENTICATED' : 'UNAUTHENTICATED';
  
  console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] Auth state computation:');
  console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] - loading:', loading);
  console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] - user exists:', !!user);
  console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] - session.user exists:', !!session?.user);
  console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] - computed authState:', authState);
  console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] - previous authState:', lastAuthStateRef.current);

  // Communicate auth state to parent wrapper
  useEffect(() => {
    console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] ===== AUTH STATE EFFECT =====');
    console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] Provider instance:', providerInstanceRef.current);
    console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] Effect triggered with state:', authState);
    console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] Previous state was:', lastAuthStateRef.current);
    console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] State changed:', lastAuthStateRef.current !== authState);

    // Check if state actually changed
    if (lastAuthStateRef.current !== authState) {
      console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] 🚨 AUTH STATE CHANGED 🚨');
      console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] From:', lastAuthStateRef.current);
      console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] To:', authState);
      
      lastAuthStateRef.current = authState;
    }
    
    console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] Current auth state for nawgti:', authState);
    console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] Detailed auth info:', {
      hasUser: !!user,
      hasSession: !!session,
      loading,
      userEmail: user?.email || session?.user?.email,
      timestamp: new Date().toISOString()
    });
    
    // Dispatch custom event to notify AuthWrapper
    const eventDetail = { 
      authState, 
      timestamp: new Date().toISOString(),
      providerInstance: providerInstanceRef.current,
      userEmail: user?.email || session?.user?.email,
      userId: user?.id || session?.user?.id
    };
    
    console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] Dispatching nawgti-auth-state event with:', eventDetail);
    
    window.dispatchEvent(new CustomEvent('nawgti-auth-state', { 
      detail: eventDetail
    }));
    
    console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] Event dispatched successfully');
    
    if (authState === 'AUTHENTICATED') {
      console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] ✅ PROVIDER REPORTS AUTHENTICATED ✅');
      console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] User email:', user?.email || session?.user?.email);
      console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] NAWGTI SHOULD REMAIN STABLE WITH THIS STATE');
      console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] 🎯 THIS IS THE CRITICAL MOMENT - NAWGTI MUST NOT DISAPPEAR 🎯');
    } else if (authState === 'LOADING') {
      console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] Provider reports LOADING state');
    } else {
      console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] Provider reports UNAUTHENTICATED state');
    }
  }, [user, session, loading, authState]);

  useEffect(() => {
    console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] ===== PROVIDER MOUNTED =====');
    console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] Provider mounted with instance:', providerInstanceRef.current);
    console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] Mount timestamp:', new Date().toISOString());
    
    return () => {
      console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] ===== PROVIDER UNMOUNT =====');
      console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] 🚨 AUTH PROVIDER UNMOUNTING 🚨');
      console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] Instance unmounting:', providerInstanceRef.current);
      console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] Unmount timestamp:', new Date().toISOString());
      console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] Final auth state:', authState);
    };
  }, []);

  const value = React.useMemo(() => ({
    user,
    session,
    loading,
    signIn: authService.signIn,
    signUp: authService.signUp,
    signOut: authService.signOut,
    signInWithGoogle: authService.signInWithGoogle,
    signInWithPhone: authService.signInWithPhone,
    verifyPhoneOtp: authService.verifyPhoneOtp,
  }), [user, session, loading]);

  console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] About to render context with children');
  console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] Final auth state for this render:', authState);

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
        🔴 AUTH PROVIDER: {authState} | Render #{renderCount.current}<br/>
        Instance: {providerInstanceRef.current}<br/>
        User: {user?.email || 'none'}<br/>
        Session: {session?.user?.email || 'none'}<br/>
        Loading: {loading ? 'YES' : 'NO'}<br/>
        <span style={{ fontSize: '10px', color: 'yellow' }}>
          This tracks auth state sent to NAWGTI
        </span>
      </div>
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    </div>
  );
};

export { AuthContext };
