
import React from 'react';
import { AuthProvider } from '@/contexts/auth';
import { ImpliedBattleTrackerProvider } from '@/contexts/ImpliedBattleTracker';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  console.log('🟢🟢🟢 AuthWrapper: RENDERING - this should be stable');
  
  return (
    <AuthProvider>
      <ImpliedBattleTrackerProvider>
        {children}
      </ImpliedBattleTrackerProvider>
    </AuthProvider>
  );
};
