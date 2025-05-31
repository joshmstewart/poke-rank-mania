
import React, { useRef } from 'react';
import { AuthProvider } from '@/contexts/auth';
import { ImpliedBattleTrackerProvider } from '@/contexts/ImpliedBattleTracker';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const wrapperInstance = useRef(Math.random().toString(36).substring(7));
  
  console.log('🟢🟢🟢 AUTH_WRAPPER: ===== WRAPPER RENDER START =====');
  console.log('🟢🟢🟢 AUTH_WRAPPER: Wrapper instance ID:', wrapperInstance.current);
  console.log('🟢🟢🟢 AUTH_WRAPPER: Timestamp:', new Date().toISOString());
  console.log('🟢🟢🟢 AUTH_WRAPPER: 🔥 WRAPPER MUST REMAIN STABLE THROUGHOUT AUTH CHANGES 🔥');
  console.log('🟢🟢🟢 AUTH_WRAPPER: About to render AuthProvider and children');
  
  React.useEffect(() => {
    console.log('🟢🟢🟢 AUTH_WRAPPER: ===== WRAPPER MOUNT EFFECT =====');
    console.log('🟢🟢🟢 AUTH_WRAPPER: Wrapper mounted with instance:', wrapperInstance.current);
    console.log('🟢🟢🟢 AUTH_WRAPPER: 🟢 WRAPPER IS MOUNTED AND STABLE 🟢');
    
    return () => {
      console.log('🟢🟢🟢 AUTH_WRAPPER: ===== WRAPPER UNMOUNT DETECTED =====');
      console.log('🟢🟢🟢 AUTH_WRAPPER: 🚨🚨🚨 WRAPPER UNMOUNTING - THIS SHOULD NOT HAPPEN 🚨🚨🚨');
      console.log('🟢🟢🟢 AUTH_WRAPPER: Wrapper instance unmounting:', wrapperInstance.current);
    };
  }, []);
  
  return (
    <div className="auth-wrapper-container">
      <AuthProvider>
        <ImpliedBattleTrackerProvider>
          {children}
        </ImpliedBattleTrackerProvider>
      </AuthProvider>
    </div>
  );
};
