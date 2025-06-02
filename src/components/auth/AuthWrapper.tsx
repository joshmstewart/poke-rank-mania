
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { AuthProvider } from '@/contexts/auth';
import { ImpliedBattleTrackerProvider } from '@/contexts/ImpliedBattleTracker';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const wrapperInstance = useRef('nawgti-stable-FIXED');
  const renderCount = useRef(0);
  const mountTime = useRef(new Date().toISOString());
  const [authState, setAuthState] = useState('UNKNOWN');
  const lastLogTime = useRef(0);
  
  renderCount.current += 1;
  
  // CRITICAL: Ensure we're logging with the correct _FIXED identifier
  console.log('🟢🟢🟢 [NAWGTI_FIXED] ===== FIXED WRAPPER RENDER =====');
  console.log('🟢🟢🟢 [NAWGTI_FIXED] Instance ID:', wrapperInstance.current);
  console.log('🟢🟢🟢 [NAWGTI_FIXED] Render count:', renderCount.current);
  console.log('🟢🟢🟢 [NAWGTI_FIXED] Auth state:', authState);

  useEffect(() => {
    console.log('🟢🟢🟢 [NAWGTI_FIXED] ===== NAWGTI MOUNT EFFECT =====');
    console.log('🟢🟢🟢 [NAWGTI_FIXED] Wrapper (nawgti) mounted successfully');
    
    // Store instance globally for debugging
    if (typeof window !== 'undefined') {
      (window as any).nawgtiInstance = wrapperInstance.current;
      (window as any).nawgtiMounted = true;
    }
    
    // CRITICAL: Listen for auth state changes from AuthProvider with proper logging
    const handleAuthStateChange = (event: any) => {
      console.log('🟢🟢🟢 [NAWGTI_FIXED] ===== AUTH STATE EVENT RECEIVED =====');
      console.log('🟢🟢🟢 [NAWGTI_FIXED] NAWGTI received auth state event:', event.detail);
      
      const newAuthState = event.detail.authState;
      console.log('🟢🟢🟢 [NAWGTI_FIXED] New auth state from provider:', newAuthState);
      
      setAuthState(newAuthState);
      
      if (newAuthState === 'AUTHENTICATED') {
        console.log('🟢🟢🟢 [NAWGTI_FIXED] 🎉 NAWGTI NOW SEES AUTHENTICATED STATE 🎉');
        console.log('🟢🟢🟢 [NAWGTI_FIXED] User email from event:', event.detail?.userEmail || 'NO_EMAIL_IN_EVENT');
      }
    };
    
    window.addEventListener('nawgti-auth-state', handleAuthStateChange);
    console.log('🟢🟢🟢 [NAWGTI_FIXED] Auth state listener added to window');
    
    // FIXED: Remove the aggressive monitoring that was causing unmount flags
    const monitoringInterval = setInterval(() => {
      const now = Date.now();
      // Only log every 60 seconds to reduce spam and avoid false unmount flags
      if (now - lastLogTime.current > 60000) {
        console.log('🟢🟢🟢 [NAWGTI_FIXED] 🔍 NAWGTI STABLE - Still mounted');
        lastLogTime.current = now;
      }
    }, 30000); // Check less frequently
    
    console.log('🟢🟢🟢 [NAWGTI_FIXED] Monitoring established');
    
    return () => {
      console.log('🟢🟢🟢 [NAWGTI_FIXED] ===== NAWGTI CLEAN UNMOUNT =====');
      console.log('🟢🟢🟢 [NAWGTI_FIXED] Wrapper unmounting cleanly');
      
      if (typeof window !== 'undefined') {
        (window as any).nawgtiMounted = false;
      }
      
      window.removeEventListener('nawgti-auth-state', handleAuthStateChange);
      clearInterval(monitoringInterval);
      
      console.log('🟢🟢🟢 [NAWGTI_FIXED] NAWGTI cleanup completed');
    };
  }, []);

  // Auth state monitoring effect
  useEffect(() => {
    console.log('🟢🟢🟢 [NAWGTI_FIXED] Auth state changed to:', authState);
    
    if (authState === 'AUTHENTICATED') {
      console.log('🟢🟢🟢 [NAWGTI_FIXED] ✅ NAWGTI SEES AUTHENTICATED STATE ✅');
    }
  }, [authState]);

  console.log('🟢🟢🟢 [NAWGTI_FIXED] About to render JSX structure');

  // Clean wrapper - no debug overlays that could interfere
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
