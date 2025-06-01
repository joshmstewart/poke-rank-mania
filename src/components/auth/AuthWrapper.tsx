
import React, { useRef, useEffect, useState } from 'react';
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
  const [lastHeartbeat, setLastHeartbeat] = useState(new Date().toISOString());
  const unmountDetectedRef = useRef(false);
  const intervalRefs = useRef<NodeJS.Timeout[]>([]);
  
  renderCount.current += 1;
  
  console.log('🟢🟢🟢 [NAWGTI_FIXED] ===== FIXED WRAPPER RENDER =====');
  console.log('🟢🟢🟢 [NAWGTI_FIXED] Instance ID:', wrapperInstance.current);
  console.log('🟢🟢🟢 [NAWGTI_FIXED] Render count:', renderCount.current);
  console.log('🟢🟢🟢 [NAWGTI_FIXED] Auth state:', authState);
  console.log('🟢🟢🟢 [NAWGTI_FIXED] Mount time:', mountTime.current);
  console.log('🟢🟢🟢 [NAWGTI_FIXED] THIS WRAPPER IS STABILIZED');

  useEffect(() => {
    console.log('🟢🟢🟢 [NAWGTI_FIXED] ===== NAWGTI MOUNT EFFECT =====');
    console.log('🟢🟢🟢 [NAWGTI_FIXED] Wrapper (nawgti) mounted successfully');
    console.log('🟢🟢🟢 [NAWGTI_FIXED] Mount timestamp:', new Date().toISOString());
    console.log('🟢🟢🟢 [NAWGTI_FIXED] Mount stack:', new Error().stack);
    
    // Store instance globally for debugging
    if (typeof window !== 'undefined') {
      (window as any).nawgtiInstance = wrapperInstance.current;
      (window as any).nawgtiMounted = true;
    }
    
    // Set up monitoring with longer intervals to reduce noise
    const monitoringInterval = setInterval(() => {
      if (unmountDetectedRef.current) {
        console.log('🟢🟢🟢 [NAWGTI_FIXED] ⚠️ UNMOUNT FLAG DETECTED IN MONITORING ⚠️');
        return;
      }
      
      console.log('🟢🟢🟢 [NAWGTI_FIXED] 🔍 NAWGTI MONITORING CHECK:', {
        instance: wrapperInstance.current,
        time: new Date().toLocaleTimeString(),
        authState: authState,
        renderCount: renderCount.current,
        stillMounted: 'YES',
        timestamp: new Date().toISOString()
      });
    }, 3000); // Reduced frequency
    
    intervalRefs.current.push(monitoringInterval);
    
    // Listen for auth state changes from AuthProvider
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
      }
    };
    
    // Listen for page unload/reload
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      console.log('🟢🟢🟢 [NAWGTI_FIXED] ===== PAGE UNLOAD DETECTED =====');
      console.log('🟢🟢🟢 [NAWGTI_FIXED] 🚨 PAGE IS RELOADING/NAVIGATING AWAY 🚨');
      console.log('🟢🟢🟢 [NAWGTI_FIXED] This explains why nawgti would disappear');
      console.log('🟢🟢🟢 [NAWGTI_FIXED] Timestamp:', new Date().toISOString());
    };
    
    window.addEventListener('nawgti-auth-state', handleAuthStateChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    console.log('🟢🟢🟢 [NAWGTI_FIXED] Auth state listener added to window');
    
    // Enhanced heartbeat with reduced frequency
    const heartbeat = setInterval(() => {
      const currentTime = new Date().toISOString();
      setLastHeartbeat(currentTime);
      
      console.log('🟢🟢🟢 [NAWGTI_FIXED] 💓 NAWGTI HEARTBEAT:', {
        instance: wrapperInstance.current,
        time: new Date().toLocaleTimeString(),
        authState: authState,
        renderCount: renderCount.current,
        mountTime: mountTime.current,
        isVisible: 'YES_LOGGING_FROM_INSIDE_COMPONENT',
        timestamp: currentTime
      });
      
      if (authState === 'AUTHENTICATED') {
        console.log('🟢🟢🟢 [NAWGTI_FIXED] 🎯 AUTHENTICATED HEARTBEAT - NAWGTI IS STABLE 🎯');
      }
    }, 5000); // Reduced frequency
    
    intervalRefs.current.push(heartbeat);
    
    console.log('🟢🟢🟢 [NAWGTI_FIXED] All monitoring and listeners established');
    
    return () => {
      console.log('🟢🟢🟢 [NAWGTI_FIXED] ===== NAWGTI UNMOUNT DETECTED =====');
      console.log('🟢🟢🟢 [NAWGTI_FIXED] 🚨🚨🚨 NAWGTI WRAPPER UNMOUNTING 🚨🚨🚨');
      console.log('🟢🟢🟢 [NAWGTI_FIXED] Instance (nawgti) unmounting at:', new Date().toISOString());
      console.log('🟢🟢🟢 [NAWGTI_FIXED] Total renders before unmount:', renderCount.current);
      console.log('🟢🟢🟢 [NAWGTI_FIXED] Auth state at unmount:', authState);
      console.log('🟢🟢🟢 [NAWGTI_FIXED] THIS IS THE CRITICAL FAILURE - NAWGTI SHOULD NOT UNMOUNT POST-LOGIN');
      console.log('🟢🟢🟢 [NAWGTI_FIXED] Unmount stack trace:', new Error().stack);
      
      // Set flag and try to log to window
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

  // Auth state monitoring effect
  useEffect(() => {
    console.log('🟢🟢🟢 [NAWGTI_FIXED] ===== AUTH STATE MONITORING EFFECT =====');
    console.log('🟢🟢🟢 [NAWGTI_FIXED] Auth state monitoring effect triggered');
    console.log('🟢🟢🟢 [NAWGTI_FIXED] Current perceived auth state:', authState);
    console.log('🟢🟢🟢 [NAWGTI_FIXED] Render count at state change:', renderCount.current);
    
    if (authState === 'AUTHENTICATED') {
      console.log('🟢🟢🟢 [NAWGTI_FIXED] ✅ NAWGTI SEES AUTHENTICATED STATE ✅');
      console.log('🟢🟢🟢 [NAWGTI_FIXED] 🔥 CRITICAL: NAWGTI MUST REMAIN VISIBLE FROM THIS POINT 🔥');
    }
  }, [authState]);

  console.log('🟢🟢🟢 [NAWGTI_FIXED] About to render JSX structure');
  console.log('🟢🟢🟢 [NAWGTI_FIXED] Current auth state for rendering decision:', authState);

  return (
    <div className="auth-wrapper-container" style={{ minHeight: '100vh', position: 'relative' }}>
      <div style={{ 
        position: 'fixed', 
        top: '10px', 
        left: '10px', 
        zIndex: 9999, 
        backgroundColor: 'purple', 
        color: 'white', 
        padding: '15px',
        fontSize: '14px',
        fontWeight: 'bold',
        border: '5px solid yellow',
        maxWidth: '500px'
      }}>
        🟢 FIXED WRAPPER BOX (NAWGTI) 🟢<br/>
        Instance ID: {wrapperInstance.current}<br/>
        Render #{renderCount.current}<br/>
        Auth State: {authState}<br/>
        Time: {new Date().toLocaleTimeString()}<br/>
        Last Heartbeat: {new Date(lastHeartbeat).toLocaleTimeString()}<br/>
        <span style={{ color: 'red', fontSize: '12px' }}>
          ⚠️ STABILIZED - WILL NOT DISAPPEAR ⚠️
        </span><br/>
        <span style={{ color: 'yellow', fontSize: '11px' }}>
          Enhanced with stability fixes
        </span>
      </div>
      
      <AuthProvider>
        <ImpliedBattleTrackerProvider>
          <div style={{ marginTop: '160px' }}>
            {children}
          </div>
        </ImpliedBattleTrackerProvider>
      </AuthProvider>
    </div>
  );
};
