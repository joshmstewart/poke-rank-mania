
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedUserDisplay } from '@/components/auth/AuthenticatedUserDisplay';
import { CloudSyncButton } from '@/components/auth/CloudSyncButton';

const SaveProgressSection: React.FC = () => {
  const { user, loading, session } = useAuth();

  // More detailed logging
  console.log('SaveProgressSection render:', { 
    user: !!user, 
    loading, 
    userId: user?.id,
    userEmail: user?.email,
    hasSession: !!session,
    sessionUserId: session?.user?.id 
  });

  if (loading) {
    console.log('SaveProgressSection: showing loading state');
    return (
      <div className="flex items-center gap-2">
        <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
      </div>
    );
  }

  if (user && session) {
    console.log('SaveProgressSection: rendering authenticated user display for:', user.email);
    console.log('SaveProgressSection: About to render AuthenticatedUserDisplay component');
    console.log('SaveProgressSection: DEFINITELY returning AuthenticatedUserDisplay, NOT CloudSyncButton');
    return (
      <div className="save-progress-authenticated">
        <AuthenticatedUserDisplay />
      </div>
    );
  }

  console.log('SaveProgressSection: no user found, rendering cloud sync button');
  console.log('SaveProgressSection: DEFINITELY returning CloudSyncButton, NOT AuthenticatedUserDisplay');
  return (
    <div className="save-progress-unauthenticated">
      <CloudSyncButton />
    </div>
  );
};

export default SaveProgressSection;
