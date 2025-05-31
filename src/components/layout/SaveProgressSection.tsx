
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedUserDisplay } from '@/components/auth/AuthenticatedUserDisplay';
import { CloudSyncButton } from '@/components/auth/CloudSyncButton';

const SaveProgressSection: React.FC = () => {
  const { user, loading, session } = useAuth();

  console.log('🔴 SaveProgressSection: Auth state check:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email
  });
  
  if (loading) {
    console.log('🔴 SaveProgressSection: LOADING STATE - showing loading spinner');
    return (
      <div className="flex items-center gap-2">
        <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
      </div>
    );
  }

  if (user && session) {
    console.log('🔴 SaveProgressSection: ✅ AUTHENTICATED - showing user display directly');
    return <AuthenticatedUserDisplay />;
  }

  console.log('🔴 SaveProgressSection: ❌ NOT AUTHENTICATED - showing cloud sync button');
  return <CloudSyncButton />;
};

export default SaveProgressSection;
