
import React, { useRef } from 'react';
import { AuthProvider } from '@/contexts/auth';
import { ImpliedBattleTrackerProvider } from '@/contexts/ImpliedBattleTracker';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const wrapperInstance = useRef(Math.random());
  
  console.log('🟢🟢🟢 AuthWrapper: RENDERING - this should be stable');
  console.log('🟢🟢🟢 AuthWrapper: Wrapper instance ID:', wrapperInstance.current);
  console.log('🟢🟢🟢 AuthWrapper: Timestamp:', new Date().toISOString());
  console.log('🟢🟢🟢 AuthWrapper: 🔥 WRAPPER MUST REMAIN STABLE 🔥');
  
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
