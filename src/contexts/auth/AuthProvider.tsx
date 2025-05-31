
import React, { createContext, useRef, useEffect } from 'react';
import { AuthContextType } from './types';
import { authService } from './authService';
import { useAuthState } from './useAuthState';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session, loading } = useAuthState();
  
  // Use a ref to track if this is the same provider instance
  const providerInstanceRef = useRef(Math.random().toString(36).substring(7));

  console.log('🔴🔴🔴 AUTH_PROVIDER: ===== PROVIDER RENDER START =====');
  console.log('🔴🔴🔴 AUTH_PROVIDER: Provider instance ID:', providerInstanceRef.current);
  console.log('🔴🔴🔴 AUTH_PROVIDER: Current state at render start:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email,
    timestamp: new Date().toISOString()
  });
  console.log('🔴🔴🔴 AUTH_PROVIDER: 🚨 PROVIDER MUST REMAIN STABLE THROUGHOUT AUTH CHANGES 🚨');

  useEffect(() => {
    console.log('🔴🔴🔴 AUTH_PROVIDER: ===== PROVIDER MOUNT EFFECT =====');
    console.log('🔴🔴🔴 AUTH_PROVIDER: Provider mounted with instance:', providerInstanceRef.current);
    console.log('🔴🔴🔴 AUTH_PROVIDER: 🟢 PROVIDER IS MOUNTED AND SHOULD STAY STABLE 🟢');
    
    return () => {
      console.log('🔴🔴🔴 AUTH_PROVIDER: ===== PROVIDER UNMOUNT DETECTED =====');
      console.log('🔴🔴🔴 AUTH_PROVIDER: 🚨🚨🚨 PROVIDER UNMOUNTING - THIS INDICATES ROOT CAUSE 🚨🚨🚨');
      console.log('🔴🔴🔴 AUTH_PROVIDER: Provider instance unmounting:', providerInstanceRef.current);
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

  console.log('🔴🔴🔴 AUTH_PROVIDER: ===== RENDER END =====');
  console.log('🔴🔴🔴 AUTH_PROVIDER: About to return JSX with context value:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email,
    providerInstance: providerInstanceRef.current,
    timestamp: new Date().toISOString()
  });

  console.log('🔴🔴🔴 AUTH_PROVIDER: 🚨🚨🚨 RETURNING JSX - this should ALWAYS appear 🚨🚨🚨');

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
