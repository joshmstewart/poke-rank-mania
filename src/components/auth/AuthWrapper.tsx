
import React, { useRef, useEffect, useState } from 'react';
import { AuthProvider } from '@/contexts/auth';
import { ImpliedBattleTrackerProvider } from '@/contexts/ImpliedBattleTracker';

interface AuthWrapperProps {
  children: React.ReactNode;
}

// Error boundary to catch any errors that might cause unmounting
class AuthWrapperErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (error: Error, errorInfo: React.ErrorInfo) => void },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🟢🟢🟢 [NAWGTI_ERROR_BOUNDARY] ❌ ERROR CAUGHT IN NAWGTI:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
    this.props.onError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          border: '5px solid red', 
          padding: '20px', 
          backgroundColor: '#ffe0e0',
          color: 'red',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>
          🚨 NAWGTI ERROR BOUNDARY TRIGGERED 🚨<br/>
          Something went wrong in AuthWrapper<br/>
          Check console for details
        </div>
      );
    }

    return this.props.children;
  }
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const wrapperInstance = useRef('nawgti');
  const renderCount = useRef(0);
  const mountTime = useRef(new Date().toISOString());
  const [authState, setAuthState] = useState('UNKNOWN');
  const [lastHeartbeat, setLastHeartbeat] = useState(new Date().toISOString());
  const unmountDetectedRef = useRef(false);
  
  renderCount.current += 1;
  
  // AGGRESSIVE LOGGING - Every render
  console.log('🟢🟢🟢 [NAWGTI_CRITICAL] ===== OUTER WRAPPER BOX RENDER START =====');
  console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Instance ID:', wrapperInstance.current);
  console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Render count:', renderCount.current);
  console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Mount time:', mountTime.current);
  console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Current auth state:', authState);
  console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Timestamp:', new Date().toISOString());
  console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Component is rendering normally - no unmount detected');
  
  // Add to window for external monitoring
  if (typeof window !== 'undefined') {
    (window as any).nawgtiStatus = {
      instance: wrapperInstance.current,
      renderCount: renderCount.current,
      authState,
      mountTime: mountTime.current,
      lastRender: new Date().toISOString()
    };
  }

  useEffect(() => {
    console.log('🟢🟢🟢 [NAWGTI_CRITICAL] ===== NAWGTI MOUNT EFFECT =====');
    console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Wrapper (nawgti) mounted successfully');
    console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Mount timestamp:', new Date().toISOString());
    
    // Set up aggressive monitoring
    const monitoringInterval = setInterval(() => {
      if (unmountDetectedRef.current) {
        console.log('🟢🟢🟢 [NAWGTI_CRITICAL] ⚠️ UNMOUNT FLAG DETECTED IN MONITORING ⚠️');
        clearInterval(monitoringInterval);
        return;
      }
      
      console.log('🟢🟢🟢 [NAWGTI_CRITICAL] 🔍 NAWGTI MONITORING CHECK:', {
        instance: wrapperInstance.current,
        time: new Date().toLocaleTimeString(),
        authState: authState,
        renderCount: renderCount.current,
        stillMounted: 'YES',
        timestamp: new Date().toISOString()
      });
    }, 1000); // Every second
    
    // Listen for auth state changes from AuthProvider
    const handleAuthStateChange = (event: any) => {
      console.log('🟢🟢🟢 [NAWGTI_CRITICAL] ===== AUTH STATE EVENT RECEIVED =====');
      console.log('🟢🟢🟢 [NAWGTI_CRITICAL] NAWGTI received auth state event:', event.detail);
      console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Event timestamp:', event.detail?.timestamp);
      console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Current NAWGTI state before update:', authState);
      
      const newAuthState = event.detail.authState;
      console.log('🟢🟢🟢 [NAWGTI_CRITICAL] New auth state from provider:', newAuthState);
      
      setAuthState(newAuthState);
      
      console.log('🟢🟢🟢 [NAWGTI_CRITICAL] NAWGTI auth state updated to:', newAuthState);
      
      if (newAuthState === 'AUTHENTICATED') {
        console.log('🟢🟢🟢 [NAWGTI_CRITICAL] 🎉 NAWGTI NOW SEES AUTHENTICATED STATE 🎉');
        console.log('🟢🟢🟢 [NAWGTI_CRITICAL] NAWGTI should remain stable and visible');
        console.log('🟢🟢🟢 [NAWGTI_CRITICAL] 🎯 CRITICAL: NAWGTI MUST NOT DISAPPEAR FROM THIS POINT FORWARD 🎯');
      }
    };
    
    window.addEventListener('nawgti-auth-state', handleAuthStateChange);
    console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Auth state listener added to window');
    
    // Enhanced heartbeat
    const heartbeat = setInterval(() => {
      const currentTime = new Date().toISOString();
      setLastHeartbeat(currentTime);
      
      console.log('🟢🟢🟢 [NAWGTI_CRITICAL] 💓 NAWGTI HEARTBEAT:', {
        instance: wrapperInstance.current,
        time: new Date().toLocaleTimeString(),
        authState: authState,
        renderCount: renderCount.current,
        mountTime: mountTime.current,
        isVisible: 'YES - LOGGING FROM INSIDE COMPONENT',
        timestamp: currentTime
      });
      
      if (authState === 'AUTHENTICATED') {
        console.log('🟢🟢🟢 [NAWGTI_CRITICAL] 🎯 AUTHENTICATED HEARTBEAT - NAWGTI IS STABLE 🎯');
      }
    }, 2000);
    
    console.log('🟢🟢🟢 [NAWGTI_CRITICAL] All monitoring and listeners established');
    
    return () => {
      console.log('🟢🟢🟢 [NAWGTI_CRITICAL] ===== NAWGTI UNMOUNT DETECTED =====');
      console.log('🟢🟢🟢 [NAWGTI_CRITICAL] 🚨🚨🚨 NAWGTI WRAPPER UNMOUNTING 🚨🚨🚨');
      console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Instance (nawgti) unmounting at:', new Date().toISOString());
      console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Total renders before unmount:', renderCount.current);
      console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Auth state at unmount:', authState);
      console.log('🟢🟢🟢 [NAWGTI_CRITICAL] THIS IS THE CRITICAL FAILURE - NAWGTI SHOULD NOT UNMOUNT POST-LOGIN');
      
      // Set flag and try to log to window
      unmountDetectedRef.current = true;
      
      if (typeof window !== 'undefined') {
        (window as any).nawgtiUnmountDetected = {
          instance: wrapperInstance.current,
          authState,
          renderCount: renderCount.current,
          unmountTime: new Date().toISOString()
        };
        console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Unmount info saved to window.nawgtiUnmountDetected');
      }
      
      window.removeEventListener('nawgti-auth-state', handleAuthStateChange);
      clearInterval(heartbeat);
      clearInterval(monitoringInterval);
      
      console.log('🟢🟢🟢 [NAWGTI_CRITICAL] NAWGTI cleanup completed');
    };
  }, []);

  // Auth state monitoring effect
  useEffect(() => {
    console.log('🟢🟢🟢 [NAWGTI_CRITICAL] ===== AUTH STATE MONITORING EFFECT =====');
    console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Auth state monitoring effect triggered');
    console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Current perceived auth state:', authState);
    console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Render count at state change:', renderCount.current);
    
    if (authState === 'AUTHENTICATED') {
      console.log('🟢🟢🟢 [NAWGTI_CRITICAL] ✅ NAWGTI SEES AUTHENTICATED STATE ✅');
      console.log('🟢🟢🟢 [NAWGTI_CRITICAL] 🔥 CRITICAL: NAWGTI MUST REMAIN VISIBLE FROM THIS POINT 🔥');
    }
  }, [authState]);

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('🟢🟢🟢 [NAWGTI_CRITICAL] ❌ ERROR IN NAWGTI WRAPPER:', {
      error: error.message,
      authState,
      renderCount: renderCount.current,
      timestamp: new Date().toISOString()
    });
  };

  // Check for minimal rendering mode
  const useMinimalMode = new URLSearchParams(window.location.search).get('minimal') === 'true';
  
  console.log('🟢🟢🟢 [NAWGTI_CRITICAL] About to render JSX structure');
  console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Minimal mode:', useMinimalMode);
  console.log('🟢🟢🟢 [NAWGTI_CRITICAL] Current auth state for rendering decision:', authState);

  // CRITICAL: Always render the outer wrapper structure with stable keys
  return (
    <AuthWrapperErrorBoundary onError={handleError}>
      <div className="auth-wrapper-container" style={{ minHeight: '100vh', position: 'relative' }} key="nawgti-container">
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
          🟢 OUTER WRAPPER BOX (NAWGTI) 🟢<br/>
          Instance ID: {wrapperInstance.current}<br/>
          Render #{renderCount.current}<br/>
          Auth State: {authState}<br/>
          Time: {new Date().toLocaleTimeString()}<br/>
          Last Heartbeat: {new Date(lastHeartbeat).toLocaleTimeString()}<br/>
          <span style={{ color: 'red', fontSize: '12px' }}>
            ⚠️ THIS SHOULD NEVER DISAPPEAR AFTER LOGIN ⚠️
          </span><br/>
          <span style={{ color: 'yellow', fontSize: '11px' }}>
            If this disappears post-login, the wrapper unmounted
          </span>
        </div>
        
        <AuthProvider key="auth-provider-stable">
          <ImpliedBattleTrackerProvider key="battle-tracker-stable">
            {useMinimalMode ? (
              <div style={{ 
                border: '8px solid green', 
                padding: '20px', 
                margin: '20px',
                marginTop: '180px', 
                backgroundColor: '#e0ffe0',
                minHeight: '200px'
              }} key="minimal-mode-container">
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
              <div style={{ marginTop: '160px' }} key="main-children-container">
                {children}
              </div>
            )}
          </ImpliedBattleTrackerProvider>
        </AuthProvider>
      </div>
    </AuthWrapperErrorBoundary>
  );
};
