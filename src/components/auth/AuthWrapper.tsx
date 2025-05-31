
import React, { useRef } from 'react';
import { AuthProvider } from '@/contexts/auth';
import { ImpliedBattleTrackerProvider } from '@/contexts/ImpliedBattleTracker';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  console.log('🟢🟢🟢 AuthWrapper: RENDERING - this should be stable');
  console.log('🟢🟢🟢 AuthWrapper: Timestamp:', new Date().toISOString());
  
  // Use a ref to ensure this component doesn't remount unnecessarily
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  return (
    <div ref={wrapperRef} key="stable-auth-wrapper">
      <AuthProvider>
        <ImpliedBattleTrackerProvider>
          {children}
        </ImpliedBattleTrackerProvider>
      </AuthProvider>
    </div>
  );
};
