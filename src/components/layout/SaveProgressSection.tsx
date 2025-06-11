
import React from 'react';
import { CloudSyncButton } from '@/components/auth/CloudSyncButton';
import { AuthenticatedUserDisplay } from '@/components/auth/AuthenticatedUserDisplay';
import { useAuth } from '@/contexts/auth/useAuth';
import { useCloudSync } from '@/hooks/useCloudSync';
import { Button } from '@/components/ui/button';

export const SaveProgressSection = () => {
  const { user, session } = useAuth();
  const { triggerManualSync } = useCloudSync();

  // Simple auth check using context only - no additional API calls
  const isAuthenticated = !!(user || session?.user);
  const currentUser = user || session?.user;

  return (
    <div className="flex items-center gap-4">
      {isAuthenticated ? (
        <>
          <AuthenticatedUserDisplay currentUser={currentUser} />
          <Button 
            onClick={triggerManualSync}
            variant="outline"
            size="sm"
            className="bg-blue-100 border-blue-400 text-blue-800 hover:bg-blue-200"
          >
            🔧 Manual Sync
          </Button>
        </>
      ) : (
        <CloudSyncButton />
      )}
    </div>
  );
};
