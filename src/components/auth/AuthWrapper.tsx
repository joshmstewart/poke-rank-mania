
import React, { useRef, useEffect } from 'react';
import { AuthProvider } from '@/contexts/auth';
import { ImpliedBattleTrackerProvider } from '@/contexts/ImpliedBattleTracker';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const wrapperInstance = useRef(Math.random().toString(36).substring(7));
  const renderCount = useRef(0);
  
  renderCount.current += 1;
  
  console.log('🟢🟢🟢 AUTH_WRAPPER: ===== WRAPPER RENDER START =====');
  console.log('🟢🟢🟢 AUTH_WRAPPER: Wrapper instance ID:', wrapperInstance.current);
  console.log('🟢🟢🟢 AUTH_WRAPPER: Render count:', renderCount.current);
  console.log('🟢🟢🟢 AUTH_WRAPPER: Timestamp:', new Date().toISOString());
  console.log('🟢🟢🟢 AUTH_WRAPPER: About to render AuthProvider and children');
  
  useEffect(() => {
    console.log('🟢🟢🟢 AUTH_WRAPPER: ===== WRAPPER MOUNT EFFECT =====');
    console.log('🟢🟢🟢 AUTH_WRAPPER: Wrapper mounted with instance:', wrapperInstance.current);
    console.log('🟢🟢🟢 AUTH_WRAPPER: Mount timestamp:', new Date().toISOString());
    
    return () => {
      console.log('🟢🟢🟢 AUTH_WRAPPER: ===== WRAPPER UNMOUNT DETECTED =====');
      console.log('🟢🟢🟢 AUTH_WRAPPER: 🚨🚨🚨 WRAPPER UNMOUNTING 🚨🚨🚨');
      console.log('🟢🟢🟢 AUTH_WRAPPER: Wrapper instance unmounting:', wrapperInstance.current);
      console.log('🟢🟢🟢 AUTH_WRAPPER: Unmount timestamp:', new Date().toISOString());
    };
  }, []);

  // STRATEGY 1: Log before and after rendering children
  console.log('🟢🟢🟢 AUTH_WRAPPER: About to render children. Children type:', typeof children);
  
  return (
    <div className="auth-wrapper-container">
      <div style={{ 
        position: 'fixed', 
        top: '30px', 
        left: 0, 
        zIndex: 9998, 
        backgroundColor: 'green', 
        color: 'white', 
        padding: '5px',
        fontSize: '12px'
      }}>
        🟢 AUTH WRAPPER ACTIVE: {new Date().toLocaleTimeString()} | Render #{renderCount.current}
      </div>
      <AuthProvider>
        <ImpliedBattleTrackerProvider>
          {children}
        </ImpliedBattleTrackerProvider>
      </AuthProvider>
    </div>
  );
};
