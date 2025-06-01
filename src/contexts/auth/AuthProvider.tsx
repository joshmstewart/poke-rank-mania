
import React, { createContext, useRef, useEffect } from 'react';
import { AuthContextType } from './types';
import { authService } from './authService';
import { useAuthState } from './useAuthState';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session, loading } = useAuthState();
  const renderCount = useRef(0);
  const providerInstanceRef = useRef('auth-provider-main');
  
  renderCount.current += 1;

  // Communicate auth state to parent wrapper
  useEffect(() => {
    console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] ===== AUTH STATE EFFECT =====');
    console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] Provider instance:', providerInstanceRef.current);
    console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] Current auth state:', {
      hasUser: !!user,
      hasSession: !!session,
      loading,
      userEmail: user?.email,
      timestamp: new Date().toISOString()
    });

    // Try to communicate state to parent AuthWrapper
    const authState = loading ? 'LOADING' : (user || session?.user) ? 'AUTHENTICATED' : 'UNAUTHENTICATED';
    console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] Computed auth state for nawgti:', authState);
    
    // Dispatch custom event to notify AuthWrapper
    window.dispatchEvent(new CustomEvent('nawgti-auth-state', { 
      detail: { authState, timestamp: new Date().toISOString() } 
    }));
    
    if (authState === 'AUTHENTICATED') {
      console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] ✅ PROVIDER REPORTS AUTHENTICATED ✅');
      console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] User email:', user?.email || session?.user?.email);
      console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] NAWGTI SHOULD REMAIN STABLE WITH THIS STATE');
    }
  }, [user, session, loading]);

  console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] ===== PROVIDER RENDER =====');
  console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] Instance:', providerInstanceRef.current);
  console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] Render count:', renderCount.current);
  console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] State:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] ===== PROVIDER MOUNTED =====');
    console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] Provider mounted with instance:', providerInstanceRef.current);
    
    return () => {
      console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] ===== PROVIDER UNMOUNT =====');
      console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] 🚨 AUTH PROVIDER UNMOUNTING 🚨');
      console.log('🔴🔴🔴 [AUTH_PROVIDER_NAWGTI] Instance unmounting:', providerInstanceRef.current);
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
        border: '3px solid yellow'
      }}>
        🔴 AUTH PROVIDER: {loading ? 'LOADING' : (user ? 'AUTHENTICATED' : 'UNAUTHENTICATED')} | Render #{renderCount.current}<br/>
        Instance: {providerInstanceRef.current}
      </div>
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    </div>
  );
};

export { AuthContext };
