
import React, { createContext, useRef, useEffect } from 'react';
import { AuthContextType } from './types';
import { authService } from './authService';
import { useAuthState } from './useAuthState';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session, loading } = useAuthState();
  const renderCount = useRef(0);
  
  // Use a ref to track if this is the same provider instance
  const providerInstanceRef = useRef(Math.random().toString(36).substring(7));
  
  renderCount.current += 1;

  console.log('🔴🔴🔴 AUTH_PROVIDER: ===== PROVIDER RENDER START =====');
  console.log('🔴🔴🔴 AUTH_PROVIDER: Provider instance ID:', providerInstanceRef.current);
  console.log('🔴🔴🔴 AUTH_PROVIDER: Render count:', renderCount.current);
  console.log('🔴🔴🔴 AUTH_PROVIDER: Current state at render start:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    console.log('🔴🔴🔴 AUTH_PROVIDER: ===== PROVIDER MOUNT EFFECT =====');
    console.log('🔴🔴🔴 AUTH_PROVIDER: Provider mounted with instance:', providerInstanceRef.current);
    console.log('🔴🔴🔴 AUTH_PROVIDER: Mount timestamp:', new Date().toISOString());
    
    return () => {
      console.log('🔴🔴🔴 AUTH_PROVIDER: ===== PROVIDER UNMOUNT DETECTED =====');
      console.log('🔴🔴🔴 AUTH_PROVIDER: 🚨🚨🚨 PROVIDER UNMOUNTING 🚨🚨🚨');
      console.log('🔴🔴🔴 AUTH_PROVIDER: Provider instance unmounting:', providerInstanceRef.current);
      console.log('🔴🔴🔴 AUTH_PROVIDER: Unmount timestamp:', new Date().toISOString());
    };
  }, []);

  // STRATEGY 1: Log state changes and their effect on rendering
  useEffect(() => {
    console.log('🔴🔴🔴 AUTH_PROVIDER: ===== AUTH STATE EFFECT =====');
    console.log('🔴🔴🔴 AUTH_PROVIDER: Auth state changed:', {
      hasUser: !!user,
      hasSession: !!session,
      loading,
      userEmail: user?.email,
      providerInstance: providerInstanceRef.current,
      timestamp: new Date().toISOString()
    });
    console.log('🔴🔴🔴 AUTH_PROVIDER: Provider is still stable, should NOT cause unmounting');
  }, [user, session, loading]);

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

  console.log('🔴🔴🔴 AUTH_PROVIDER: About to render context with children');
  console.log('🔴🔴🔴 AUTH_PROVIDER: Children type:', typeof children);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ 
        position: 'fixed', 
        top: '60px', 
        left: 0, 
        zIndex: 9997, 
        backgroundColor: 'red', 
        color: 'white', 
        padding: '5px',
        fontSize: '12px'
      }}>
        🔴 AUTH PROVIDER: {loading ? 'LOADING' : (user ? 'AUTHENTICATED' : 'UNAUTHENTICATED')} | Render #{renderCount.current}
      </div>
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    </div>
  );
};

export { AuthContext };
