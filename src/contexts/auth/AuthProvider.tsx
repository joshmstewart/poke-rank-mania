
import React, { createContext, useRef } from 'react';
import { AuthContextType } from './types';
import { authService } from './authService';
import { useAuthState } from './useAuthState';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session, loading } = useAuthState();
  
  // Use a ref to track if this is the same provider instance
  const providerInstanceRef = useRef(Math.random());

  console.log('🔴 AuthProvider: COMPONENT RENDER START - every render should show this');
  console.log('🔴 AuthProvider: Provider instance ID:', providerInstanceRef.current);
  console.log('🔴 AuthProvider: Current state at render start:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email,
    timestamp: new Date().toISOString()
  });

  const value = {
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

  console.log('🔴 AuthProvider: RENDER END - About to return JSX with context value:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email,
    timestamp: new Date().toISOString()
  });

  console.log('🔴 AuthProvider: 🚨🚨🚨 RETURNING JSX - this should ALWAYS appear 🚨🚨🚨');

  return (
    <AuthContext.Provider value={value} key="stable-auth-context">
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
