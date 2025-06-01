
import React, { createContext, useRef, useEffect } from 'react';
import { AuthContextType } from './types';
import { authService } from './authService';
import { useAuthState } from './useAuthState';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session, loading } = useAuthState();
  const lastAuthStateRef = useRef('INITIAL');
  
  // Compute auth state
  const authState = loading ? 'LOADING' : (user || session?.user) ? 'AUTHENTICATED' : 'UNAUTHENTICATED';

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

  // Communicate auth state to parent wrapper
  useEffect(() => {
    // Check if state actually changed
    if (lastAuthStateRef.current !== authState) {
      lastAuthStateRef.current = authState;
      
      // CRITICAL: Dispatch event with complete user details for AuthWrapper consumption
      const eventDetail = { 
        authState, 
        timestamp: new Date().toISOString(),
        userEmail: user?.email || session?.user?.email || null,
        userPhone: user?.phone || session?.user?.phone || null,
        userId: user?.id || session?.user?.id || null,
        hasUser: !!user,
        hasSession: !!session,
        loading
      };
      
      window.dispatchEvent(new CustomEvent('nawgti-auth-state', { 
        detail: eventDetail
      }));
    }
  }, [user, session, loading, authState]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
