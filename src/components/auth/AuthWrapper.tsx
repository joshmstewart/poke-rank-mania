
import React, { useRef, useEffect, useState } from 'react';
import { AuthProvider } from '@/contexts/auth';
import { ImpliedBattleTrackerProvider } from '@/contexts/ImpliedBattleTracker';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const wrapperInstance = useRef('nawgti-stable-FIXED');
  const renderCount = useRef(0);
  const [authState, setAuthState] = useState('UNKNOWN');
  
  renderCount.current += 1;

  useEffect(() => {
    // Store instance globally for debugging
    if (typeof window !== 'undefined') {
      (window as any).nawgtiInstance = wrapperInstance.current;
      (window as any).nawgtiMounted = true;
    }
    
    const handleAuthStateChange = (event: any) => {
      const newAuthState = event.detail.authState;
      setAuthState(newAuthState);
    };
    
    window.addEventListener('nawgti-auth-state', handleAuthStateChange);
    
    return () => {
      if (typeof window !== 'undefined') {
        (window as any).nawgtiMounted = false;
      }
      
      window.removeEventListener('nawgti-auth-state', handleAuthStateChange);
    };
  }, []);

  return (
    <div className="auth-wrapper-container" style={{ minHeight: '100vh' }}>
      <AuthProvider>
        <ImpliedBattleTrackerProvider>
          {children}
        </ImpliedBattleTrackerProvider>
      </AuthProvider>
    </div>
  );
};
