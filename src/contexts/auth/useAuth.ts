
import { useContext } from 'react';
import { AuthContext } from './AuthProvider';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  console.log('🔴 useAuth: Returning context:', {
    hasUser: !!context.user,
    hasSession: !!context.session,
    loading: context.loading,
    userEmail: context.user?.email,
    timestamp: new Date().toISOString()
  });
  
  return context;
};
