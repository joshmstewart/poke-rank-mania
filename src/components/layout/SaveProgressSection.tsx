
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedUserDisplay } from '@/components/auth/AuthenticatedUserDisplay';
import { CloudSyncButton } from '@/components/auth/CloudSyncButton';

const SaveProgressSection: React.FC = () => {
  const { user, loading, session } = useAuth();

  console.log('🔴 SaveProgressSection: RENDER CHECK - Component is rendering');
  console.log('🔴 SaveProgressSection: DETAILED AUTH STATE CHECK:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email,
    userId: user?.id,
    sessionAccessToken: session?.access_token ? 'present' : 'missing',
    sessionExpiresAt: session?.expires_at,
    currentTime: Date.now() / 1000
  });
  console.log('🔴 SaveProgressSection: Stack trace:', new Error().stack);

  // Add more detailed condition checking
  const isAuthenticated = !!(user && session);
  console.log('🔴 SaveProgressSection: IS AUTHENTICATED?', isAuthenticated);
  console.log('🔴 SaveProgressSection: User check:', !!user);
  console.log('🔴 SaveProgressSection: Session check:', !!session);
  
  if (loading) {
    console.log('🔴 SaveProgressSection: LOADING STATE - showing loading spinner');
    return (
      <div className="flex items-center gap-2">
        <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    console.log('🔴 SaveProgressSection: ✅ AUTHENTICATED - rendering AuthenticatedUserDisplay');
    return <AuthenticatedUserDisplay />;
  }

  console.log('🔴 SaveProgressSection: ❌ NOT AUTHENTICATED - rendering CloudSyncButton');
  return <CloudSyncButton />;
};

export default SaveProgressSection;
