
import React, { useRef, useEffect, useState } from 'react';
import { AuthProvider } from '@/contexts/auth';
import { ImpliedBattleTrackerProvider } from '@/contexts/ImpliedBattleTracker';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const wrapperInstance = useRef('nawgti'); // Fixed instance ID for tracking
  const renderCount = useRef(0);
  const mountTime = useRef(new Date().toISOString());
  const [authState, setAuthState] = useState('UNKNOWN');
  
  renderCount.current += 1;
  
  console.log('🟢🟢🟢 [NAWGTI_CRITICAL] ===== OUTER WRAPPER BOX RENDER START =====');
  console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Instance ID:', wrapperInstance.current);
  console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Render count:', renderCount.current);
  console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Mount time:', mountTime.current);
  console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Current auth state:', authState);
  console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Timestamp:', new Date().toISOString());
  console.log('🟢🟢🟢 [NAWGTI_CRITICAL] About to render AuthProvider and children');
  
  useEffect(() => {
    console.log('🟢🟢🟢 [NAWGTI_CRITICAL] ===== NAWGTI MOUNT EFFECT =====');
    console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Wrapper (nawgti) mounted successfully');
    console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Mount timestamp:', new Date().toISOString());
    
    // Listen for auth state changes from AuthProvider
    const handleAuthStateChange = (event: any) => {
      console.log('🟢🟢🟢 [NAWGTI_CRITICAL] ===== AUTH STATE EVENT RECEIVED =====');
      console.log('🟢🟢🟢 [NAWGTI_CRITICAL] NAWGTI received auth state:', event.detail);
      
      const newAuthState = event.detail.authState;
      setAuthState(newAuthState);
      
      console.log('🟢🟢🟢 [NAWGTI_CRITICAL] NAWGTI updated to state:', newAuthState);
      
      if (newAuthState === 'AUTHENTICATED') {
        console.log('🟢🟢🟢 [NAWGTI_CRITICAL] 🎉 NAWGTI NOW SEES AUTHENTICATED STATE 🎉');
        console.log('🟢🟢🟢 [NAWGTI_CRITICAL] NAWGTI should remain stable and visible');
        console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Render count at auth:', renderCount.current);
      }
    };
    
    window.addEventListener('nawgti-auth-state', handleAuthStateChange);
    
    // Set up error boundary to catch any errors
    const handleError = (error: ErrorEvent) => {
      console.error('🟢🟢🟢 [NAWGTI_CRITICAL] ❌ ERROR DETECTED IN NAWGTI:', error);
    };
    
    window.addEventListener('error', handleError);
    
    // Periodic heartbeat to prove nawgti is alive
    const heartbeat = setInterval(() => {
      console.log('🟢🟢🟢 [NAWGTI_CRITICAL] 💓 NAWGTI HEARTBEAT:', {
        instance: wrapperInstance.current,
        time: new Date().toLocaleTimeString(),
        authState: authState,
        renderCount: renderCount.current
      });
    }, 3000);
    
    return () => {
      console.log('🟢🟢🟢 [NAWGTI_CRITICAL] ===== NAWGTI UNMOUNT DETECTED =====');
      console.log('🟢🟢🟢 [NAWGTI_CRITICAL] 🚨🚨🚨 NAWGTI WRAPPER UNMOUNTING 🚨🚨🚨');
      console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Instance (nawgti) unmounting at:', new Date().toISOString());
      console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Total renders before unmount:', renderCount.current);
      console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Was mounted for:', new Date().getTime() - new Date(mountTime.current).getTime(), 'ms');
      
      window.removeEventListener('nawgti-auth-state', handleAuthStateChange);
      window.removeEventListener('error', handleError);
      clearInterval(heartbeat);
    };
  }, []);

  // Auth state monitoring effect
  useEffect(() => {
    console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Auth state monitoring effect triggered');
    console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Current perceived auth state:', authState);
    
    if (authState === 'AUTHENTICATED') {
      console.log('🟢🟢🟢 [NAWGTI_CRITICAL] ✅ NAWGTI SEES AUTHENTICATED STATE ✅');
      console.log('🟢🟢🟢 [NAWGTI_CRITICAL] NAWGTI should be stable now. Render count:', renderCount.current);
    } else if (authState === 'UNAUTHENTICATED') {
      console.log('🟢🟢🟢 [NAWGTI_CRITICAL] NAWGTI sees UNAUTHENTICATED state');
    }
  }, [authState]);

  // Check for minimal rendering mode
  const useMinimalMode = new URLSearchParams(window.location.search).get('minimal') === 'true';
  
  console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Minimal mode check:', useMinimalMode);
  console.log('🟢🟢🟢 [NAWGTI_CRITICAL] About to render JSX structure');

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
        maxWidth: '400px'
      }}>
        🟢 OUTER WRAPPER BOX (NAWGTI) 🟢<br/>
        Instance ID: {wrapperInstance.current}<br/>
        Render #{renderCount.current}<br/>
        Auth State: {authState}<br/>
        Time: {new Date().toLocaleTimeString()}<br/>
        <span style={{ color: 'red', fontSize: '12px' }}>
          ⚠️ THIS SHOULD NEVER DISAPPEAR AFTER LOGIN ⚠️
        </span>
      </div>
      
      <AuthProvider>
        <ImpliedBattleTrackerProvider>
          {useMinimalMode ? (
            <div style={{ 
              border: '8px solid green', 
              padding: '20px', 
              margin: '20px',
              marginTop: '120px', 
              backgroundColor: '#e0ffe0',
              minHeight: '200px'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'green' }}>
                🚀 MINIMAL MODE - NAWGTI WRAPPER TEST 🚀
              </div>
              <p>NAWGTI Wrapper Instance: {wrapperInstance.current}</p>
              <p>Render Count: {renderCount.current}</p>
              <p>Auth State: {authState}</p>
              <p>Current Time: {new Date().toLocaleTimeString()}</p>
              <p style={{ fontWeight: 'bold', color: 'red' }}>
                🔥 IF THIS PERSISTS AFTER LOGIN, NAWGTI IS STABLE 🔥
              </p>
            </div>
          ) : (
            <div style={{ marginTop: '80px' }}>
              {children}
            </div>
          )}
        </ImpliedBattleTrackerProvider>
      </AuthProvider>
    </div>
  );
};
