
import React from 'react';
import { CloudSyncButton } from '@/components/auth/CloudSyncButton';
import { AuthenticatedUserDisplay } from '@/components/auth/AuthenticatedUserDisplay';
import { useAuth } from '@/contexts/auth/useAuth';

export const SaveProgressSection = () => {
  const { user, session } = useAuth();

  // Simple auth check using context only - no additional API calls
  const isAuthenticated = !!(user || session?.user);
  const currentUser = user || session?.user;

  return (
    <div className="flex items-center gap-4">
      {isAuthenticated ? (
        <>
          <AuthenticatedUserDisplay currentUser={currentUser} />
          {/* Manual Sync button removed as per request to reduce clutter. */}
        </>
      ) : (
        <CloudSyncButton />
      )}
    </div>
  );
};
