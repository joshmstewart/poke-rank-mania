
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedUserDisplay } from '@/components/auth/AuthenticatedUserDisplay';
import { CloudSyncButton } from '@/components/auth/CloudSyncButton';

const SaveProgressSection: React.FC = () => {
  const { user, loading, session } = useAuth();

  // CRITICAL LOGGING - Always fires regardless of state
  console.log('🔴🔴🔴 SaveProgressSection: ALWAYS FIRES - Component is rendering');
  console.log('🔴🔴🔴 SaveProgressSection: Auth state details:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email,
    userId: user?.id,
    timestamp: new Date().toISOString()
  });
  
  if (loading) {
    console.log('🔴🔴🔴 SaveProgressSection: LOADING STATE - showing spinner');
    return (
      <div className="flex items-center gap-2">
        <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
      </div>
    );
  }

  const isAuthenticated = !!(user && session);
  console.log('🔴🔴🔴 SaveProgressSection: Authentication check result:', isAuthenticated);
  
  if (isAuthenticated) {
    console.log('🔴🔴🔴 SaveProgressSection: ✅ AUTHENTICATED - About to render AuthenticatedUserDisplay');
    return <AuthenticatedUserDisplay />;
  }

  console.log('🔴🔴🔴 SaveProgressSection: ❌ NOT AUTHENTICATED - About to render CloudSyncButton');
  return <CloudSyncButton />;
};

export default SaveProgressSection;
