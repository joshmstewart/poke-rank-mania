import React, { useRef, useEffect, useState } from 'react';
import { AuthProvider } from '@/contexts/auth';
import { ImpliedBattleTrackerProvider } from '@/contexts/ImpliedBattleTracker';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const wrapperInstance = useRef('nawgti-stable-bulletproof');
  const renderCount = useRef(0);
  const mountTime = useRef(new Date().toISOString());
  const [authState, setAuthState] = useState('UNKNOWN');
  const [lastHeartbeat, setLastHeartbeat] = useState(new Date().toISOString());
  const unmountDetectedRef = useRef(false);
  const intervalRefs = useRef<NodeJS.Timeout[]>([]);
  
  renderCount.current += 1;
  
  console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] ===== BULLETPROOF WRAPPER RENDER =====');
  console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] Instance ID:', wrapperInstance.current);
  console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] Render count:', renderCount.current);
  console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] Auth state:', authState);
  console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] THIS WRAPPER IS BULLETPROOFED');

  useEffect(() => {
    console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] ===== NAWGTI MOUNT EFFECT =====');
    console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] Wrapper (nawgti) mounted successfully');
    console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] Mount timestamp:', new Date().toISOString());
    
    // Store instance globally for debugging
    if (typeof window !== 'undefined') {
      (window as any).nawgtiInstance = wrapperInstance.current;
      (window as any).nawgtiMounted = true;
    }
    
    // Set up aggressive monitoring
    const monitoringInterval = setInterval(() => {
      if (unmountDetectedRef.current) {
        console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] ⚠️ UNMOUNT FLAG DETECTED IN MONITORING ⚠️');
        return;
      }
      
      console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] 🔍 NAWGTI MONITORING CHECK:', {
        instance: wrapperInstance.current,
        time: new Date().toLocaleTimeString(),
        authState: authState,
        renderCount: renderCount.current,
        stillMounted: 'YES',
        timestamp: new Date().toISOString()
      });
    }, 1000);
    
    intervalRefs.current.push(monitoringInterval);
    
    // Listen for auth state changes from AuthProvider
    const handleAuthStateChange = (event: any) => {
      console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] ===== AUTH STATE EVENT RECEIVED =====');
      console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] NAWGTI received auth state event:', event.detail);
      console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] Event timestamp:', event.detail?.timestamp);
      console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] Current NAWGTI state before update:', authState);
      
      const newAuthState = event.detail.authState;
      console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] New auth state from provider:', newAuthState);
      
      setAuthState(newAuthState);
      
      console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] NAWGTI auth state updated to:', newAuthState);
      
      if (newAuthState === 'AUTHENTICATED') {
        console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] 🎉 NAWGTI NOW SEES AUTHENTICATED STATE 🎉');
        console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] NAWGTI should remain stable and visible');
        console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] 🎯 CRITICAL: NAWGTI MUST NOT DISAPPEAR FROM THIS POINT FORWARD 🎯');
      }
    };
    
    // Listen for page unload/reload
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] ===== PAGE UNLOAD DETECTED =====');
      console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] 🚨 PAGE IS RELOADING/NAVIGATING AWAY 🚨');
      console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] This explains why nawgti would disappear');
      console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] Timestamp:', new Date().toISOString());
    };
    
    window.addEventListener('nawgti-auth-state', handleAuthStateChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] Auth state listener added to window');
    
    // Enhanced heartbeat
    const heartbeat = setInterval(() => {
      const currentTime = new Date().toISOString();
      setLastHeartbeat(currentTime);
      
      console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] 💓 NAWGTI HEARTBEAT:', {
        instance: wrapperInstance.current,
        time: new Date().toLocaleTimeString(),
        authState: authState,
        renderCount: renderCount.current,
        mountTime: mountTime.current,
        isVisible: 'YES - LOGGING FROM INSIDE COMPONENT',
        timestamp: currentTime
      });
      
      if (authState === 'AUTHENTICATED') {
        console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] 🎯 AUTHENTICATED HEARTBEAT - NAWGTI IS STABLE 🎯');
      }
    }, 2000);
    
    intervalRefs.current.push(heartbeat);
    
    console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] All monitoring and listeners established');
    
    return () => {
      console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] ===== NAWGTI UNMOUNT DETECTED =====');
      console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] 🚨🚨🚨 NAWGTI WRAPPER UNMOUNTING 🚨🚨🚨');
      console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] Instance (nawgti) unmounting at:', new Date().toISOString());
      console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] Total renders before unmount:', renderCount.current);
      console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] Auth state at unmount:', authState);
      console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] THIS IS THE CRITICAL FAILURE - NAWGTI SHOULD NOT UNMOUNT POST-LOGIN');
      
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
        console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] Unmount info saved to window.nawgtiUnmountDetected');
      }
      
      window.removeEventListener('nawgti-auth-state', handleAuthStateChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Clear all intervals
      intervalRefs.current.forEach(interval => clearInterval(interval));
      intervalRefs.current = [];
      
      console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] NAWGTI cleanup completed');
    };
  }, []);

  // Auth state monitoring effect
  useEffect(() => {
    console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] ===== AUTH STATE MONITORING EFFECT =====');
    console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] Auth state monitoring effect triggered');
    console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] Current perceived auth state:', authState);
    console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] Render count at state change:', renderCount.current);
    
    if (authState === 'AUTHENTICATED') {
      console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] ✅ NAWGTI SEES AUTHENTICATED STATE ✅');
      console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] 🔥 CRITICAL: NAWGTI MUST REMAIN VISIBLE FROM THIS POINT 🔥');
    }
  }, [authState]);

  console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] About to render JSX structure');
  console.log('🟢🟢🟢 [NAWGTI_BULLETPROOF] Current auth state for rendering decision:', authState);

  // CRITICAL: Always render the outer wrapper structure
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
        🟢 BULLETPROOF WRAPPER BOX (NAWGTI) 🟢<br/>
        Instance ID: {wrapperInstance.current}<br/>
        Render #{renderCount.current}<br/>
        Auth State: {authState}<br/>
        Time: {new Date().toLocaleTimeString()}<br/>
        Last Heartbeat: {new Date(lastHeartbeat).toLocaleTimeString()}<br/>
        <span style={{ color: 'red', fontSize: '12px' }}>
          ⚠️ BULLETPROOF - CANNOT DISAPPEAR ⚠️
        </span><br/>
        <span style={{ color: 'yellow', fontSize: '11px' }}>
          Enhanced with bulletproof persistence
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
