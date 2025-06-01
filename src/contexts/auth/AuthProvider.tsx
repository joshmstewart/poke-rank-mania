
import React, { createContext, useRef, useEffect } from 'react';
import { AuthContextType } from './types';
import { authService } from './authService';
import { useAuthState } from './useAuthState';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session, loading } = useAuthState();
  const renderCount = useRef(0);
  const providerInstanceRef = useRef('auth-provider-fixed');
  const lastAuthStateRef = useRef('INITIAL');
  
  renderCount.current += 1;

  console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] ===== AUTH PROVIDER RENDER =====');
  console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] Provider instance:', providerInstanceRef.current);
  console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] Render count:', renderCount.current);
  console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] Raw auth data from useAuthState:', {
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
  
  console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] ⚡ AUTH STATE COMPUTATION ⚡');
  console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] - loading:', loading);
  console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] - user exists:', !!user);
  console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] - session.user exists:', !!session?.user);
  console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] - computed authState:', authState);
  console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] - previous authState:', lastAuthStateRef.current);

  // Critical: Log what will be provided to useAuth consumers
  const contextValue = React.useMemo(() => ({
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

  console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] 🎯 CONTEXT VALUE TO BE PROVIDED 🎯');
  console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] Context value:', {
    hasUser: !!contextValue.user,
    hasSession: !!contextValue.session,
    loading: contextValue.loading,
    userEmail: contextValue.user?.email,
    sessionUserEmail: contextValue.session?.user?.email,
    timestamp: new Date().toISOString()
  });

  // Communicate auth state to parent wrapper
  useEffect(() => {
    console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] ===== AUTH STATE EFFECT =====');
    console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] Provider instance:', providerInstanceRef.current);
    console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] Effect triggered with state:', authState);
    console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] Previous state was:', lastAuthStateRef.current);
    console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] State changed:', lastAuthStateRef.current !== authState);

    // Check if state actually changed
    if (lastAuthStateRef.current !== authState) {
      console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] 🚨 AUTH STATE CHANGED 🚨');
      console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] From:', lastAuthStateRef.current);
      console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] To:', authState);
      
      lastAuthStateRef.current = authState;
    }
    
    console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] Current auth state for nawgti:', authState);
    console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] Detailed auth info:', {
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
    
    console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] Dispatching nawgti-auth-state event with:', eventDetail);
    
    window.dispatchEvent(new CustomEvent('nawgti-auth-state', { 
      detail: eventDetail
    }));
    
    console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] Event dispatched successfully');
    
    if (authState === 'AUTHENTICATED') {
      console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] ✅✅✅ PROVIDER REPORTS AUTHENTICATED ✅✅✅');
      console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] User email:', user?.email || session?.user?.email);
      console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] 🎯 useAuth CONSUMERS SHOULD NOW SEE AUTHENTICATED STATE 🎯');
      console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] NAWGTI SHOULD REMAIN STABLE WITH THIS STATE');
    } else if (authState === 'LOADING') {
      console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] Provider reports LOADING state');
    } else {
      console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] Provider reports UNAUTHENTICATED state');
    }
  }, [user, session, loading, authState]);

  useEffect(() => {
    console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] ===== PROVIDER MOUNTED =====');
    console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] Provider mounted with instance:', providerInstanceRef.current);
    console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] Mount timestamp:', new Date().toISOString());
    
    return () => {
      console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] ===== PROVIDER UNMOUNT =====');
      console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] 🚨 AUTH PROVIDER UNMOUNTING 🚨');
      console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] Instance unmounting:', providerInstanceRef.current);
      console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] Unmount timestamp:', new Date().toISOString());
      console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] Final auth state:', authState);
    };
  }, []);

  console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] About to render context with children');
  console.log('🔴🔴🔴 [AUTH_PROVIDER_FIXED] Final auth state for this render:', authState);

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
        🔴 AUTH PROVIDER FIXED: {authState} | Render #{renderCount.current}<br/>
        Instance: {providerInstanceRef.current}<br/>
        User: {user?.email || 'none'}<br/>
        Session: {session?.user?.email || 'none'}<br/>
        Loading: {loading ? 'YES' : 'NO'}<br/>
        <span style={{ fontSize: '10px', color: 'yellow' }}>
          This should show AUTHENTICATED post-login
        </span>
      </div>
      <AuthContext.Provider value={contextValue}>
        {children}
      </AuthContext.Provider>
    </div>
  );
};

export { AuthContext };
