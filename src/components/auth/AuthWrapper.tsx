
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
  const unmountDetectedRef = useRef(false);
  const intervalRefs = useRef<NodeJS.Timeout[]>([]);
  const lastLogTime = useRef(0);
  
  renderCount.current += 1;
  
  // CRITICAL: Ensure we're logging with the correct _FIXED identifier
  console.log('🟢🟢🟢 [NAWGTI_FIXED] ===== FIXED WRAPPER RENDER =====');
  console.log('🟢🟢🟢 [NAWGTI_FIXED] Instance ID:', wrapperInstance.current);
  console.log('🟢🟢🟢 [NAWGTI_FIXED] Render count:', renderCount.current);
  console.log('🟢🟢🟢 [NAWGTI_FIXED] Auth state:', authState);
  console.log('🟢🟢🟢 [NAWGTI_FIXED] Mount time:', mountTime.current);

  useEffect(() => {
    console.log('🟢🟢🟢 [NAWGTI_FIXED] ===== NAWGTI MOUNT EFFECT =====');
    console.log('🟢🟢🟢 [NAWGTI_FIXED] Wrapper (nawgti) mounted successfully');
    console.log('🟢🟢🟢 [NAWGTI_FIXED] Mount timestamp:', new Date().toISOString());
    
    // Store instance globally for debugging
    if (typeof window !== 'undefined') {
      (window as any).nawgtiInstance = wrapperInstance.current;
      (window as any).nawgtiMounted = true;
    }
    
    // CRITICAL: Listen for auth state changes from AuthProvider with proper logging
    const handleAuthStateChange = (event: any) => {
      console.log('🟢🟢🟢 [NAWGTI_FIXED] ===== AUTH STATE EVENT RECEIVED =====');
      console.log('🟢🟢🟢 [NAWGTI_FIXED] NAWGTI received auth state event:', event.detail);
      console.log('🟢🟢🟢 [NAWGTI_FIXED] Event timestamp:', event.detail?.timestamp);
      console.log('🟢🟢🟢 [NAWGTI_FIXED] Current NAWGTI state before update:', authState);
      
      const newAuthState = event.detail.authState;
      console.log('🟢🟢🟢 [NAWGTI_FIXED] New auth state from provider:', newAuthState);
      
      setAuthState(newAuthState);
      
      console.log('🟢🟢🟢 [NAWGTI_FIXED] NAWGTI auth state updated to:', newAuthState);
      
      if (newAuthState === 'AUTHENTICATED') {
        console.log('🟢🟢🟢 [NAWGTI_FIXED] 🎉 NAWGTI NOW SEES AUTHENTICATED STATE 🎉');
        console.log('🟢🟢🟢 [NAWGTI_FIXED] NAWGTI should remain stable and visible');
        console.log('🟢🟢🟢 [NAWGTI_FIXED] 🎯 CRITICAL: NAWGTI MUST NOT DISAPPEAR FROM THIS POINT FORWARD 🎯');
        console.log('🟢🟢🟢 [NAWGTI_FIXED] User email from event:', event.detail?.userEmail || 'NO_EMAIL_IN_EVENT');
        console.log('🟢🟢🟢 [NAWGTI_FIXED] User phone from event:', event.detail?.userPhone || 'NO_PHONE_IN_EVENT');
        console.log('🟢🟢🟢 [NAWGTI_FIXED] User ID from event:', event.detail?.userId || 'NO_ID_IN_EVENT');
      }
    };
    
    // Listen for page unload/reload
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      console.log('🟢🟢🟢 [NAWGTI_FIXED] ===== PAGE UNLOAD DETECTED =====');
      console.log('🟢🟢🟢 [NAWGTI_FIXED] 🚨 PAGE IS RELOADING/NAVIGATING AWAY 🚨');
      console.log('🟢🟢🟢 [NAWGTI_FIXED] This explains why nawgti would disappear');
    };
    
    window.addEventListener('nawgti-auth-state', handleAuthStateChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    console.log('🟢🟢🟢 [NAWGTI_FIXED] Auth state listener added to window');
    
    // Set up monitoring with throttling to reduce log spam
    const monitoringInterval = setInterval(() => {
      if (unmountDetectedRef.current) {
        console.log('🟢🟢🟢 [NAWGTI_FIXED] ⚠️ UNMOUNT FLAG DETECTED IN MONITORING ⚠️');
        return;
      }
      
      const now = Date.now();
      // Only log every 30 seconds to reduce spam
      if (now - lastLogTime.current > 30000) {
        console.log('🟢🟢🟢 [NAWGTI_FIXED] 🔍 NAWGTI MONITORING CHECK:', {
          instance: wrapperInstance.current,
          time: new Date().toLocaleTimeString(),
          authState: authState,
          renderCount: renderCount.current,
          stillMounted: 'YES',
          timestamp: new Date().toISOString()
        });
        lastLogTime.current = now;
      }
    }, 5000);
    
    intervalRefs.current.push(monitoringInterval);
    
    console.log('🟢🟢🟢 [NAWGTI_FIXED] All monitoring and listeners established');
    
    return () => {
      console.log('🟢🟢🟢 [NAWGTI_FIXED] ===== NAWGTI UNMOUNT DETECTED =====');
      console.log('🟢🟢🟢 [NAWGTI_FIXED] 🚨🚨🚨 NAWGTI WRAPPER UNMOUNTING 🚨🚨🚨');
      console.log('🟢🟢🟢 [NAWGTI_FIXED] Instance (nawgti) unmounting at:', new Date().toISOString());
      console.log('🟢🟢🟢 [NAWGTI_FIXED] Total renders before unmount:', renderCount.current);
      console.log('🟢🟢🟢 [NAWGTI_FIXED] Auth state at unmount:', authState);
      console.log('🟢🟢🟢 [NAWGTI_FIXED] THIS IS THE CRITICAL FAILURE - NAWGTI SHOULD NOT UNMOUNT POST-LOGIN');
      
      unmountDetectedRef.current = true;
      
      if (typeof window !== 'undefined') {
        (window as any).nawgtiUnmountDetected = {
          instance: wrapperInstance.current,
          authState,
          renderCount: renderCount.current,
          unmountTime: new Date().toISOString()
        };
        (window as any).nawgtiMounted = false;
        console.log('🟢🟢🟢 [NAWGTI_FIXED] Unmount info saved to window.nawgtiUnmountDetected');
      }
      
      window.removeEventListener('nawgti-auth-state', handleAuthStateChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Clear all intervals
      intervalRefs.current.forEach(interval => clearInterval(interval));
      intervalRefs.current = [];
      
      console.log('🟢🟢🟢 [NAWGTI_FIXED] NAWGTI cleanup completed');
    };
  }, []);

  // Auth state monitoring effect - CRITICAL for showing wrapper's perception of auth state
  useEffect(() => {
    console.log('🟢🟢🟢 [NAWGTI_FIXED] ===== AUTH STATE MONITORING EFFECT =====');
    console.log('🟢🟢🟢 [NAWGTI_FIXED] Auth state monitoring effect triggered');
    console.log('🟢🟢🟢 [NAWGTI_FIXED] Current perceived auth state:', authState);
    console.log('🟢🟢🟢 [NAWGTI_FIXED] Render count at state change:', renderCount.current);
    
    if (authState === 'AUTHENTICATED') {
      console.log('🟢🟢🟢 [NAWGTI_FIXED] ✅ NAWGTI SEES AUTHENTICATED STATE ✅');
      console.log('🟢🟢🟢 [NAWGTI_FIXED] 🔥 CRITICAL: NAWGTI MUST REMAIN VISIBLE FROM THIS POINT 🔥');
    } else if (authState === 'LOADING') {
      console.log('🟢🟢🟢 [NAWGTI_FIXED] ⏳ NAWGTI SEES LOADING STATE ⏳');
    } else if (authState === 'UNAUTHENTICATED') {
      console.log('🟢🟢🟢 [NAWGTI_FIXED] ❌ NAWGTI SEES UNAUTHENTICATED STATE ❌');
    } else {
      console.log('🟢🟢🟢 [NAWGTI_FIXED] ❓ NAWGTI SEES UNKNOWN STATE - WAITING FOR AUTH PROVIDER ❓');
    }
  }, [authState]);

  console.log('🟢🟢🟢 [NAWGTI_FIXED] About to render JSX structure');
  console.log('🟢🟢🟢 [NAWGTI_FIXED] Current auth state for rendering decision:', authState);

  // Clean production wrapper - no visual debug overlay
  return (
    <div className="auth-wrapper-container" style={{ minHeight: '100vh', position: 'relative' }}>
      <AuthProvider>
        <ImpliedBattleTrackerProvider>
          {children}
        </ImpliedBattleTrackerProvider>
      </AuthProvider>
    </div>
  );
};
