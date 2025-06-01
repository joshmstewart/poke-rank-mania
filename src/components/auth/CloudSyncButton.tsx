
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Cloud } from 'lucide-react';
import { AuthDialog } from './AuthDialog';
import { useAuth } from '@/contexts/auth/useAuth';

export const CloudSyncButton: React.FC = () => {
  const { user, session } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  // Simple auth check using context only - no additional API calls
  const isAuthenticated = !!(user || session?.user);

  if (isAuthenticated) {
    return null;
  }

  return (
    <AuthDialog 
      open={showAuthDialog} 
      onOpenChange={setShowAuthDialog}
    >
      <Button
        variant="outline"
        className="flex items-center gap-2"
      >
        <Cloud className="h-4 w-4" />
        <span className="hidden sm:inline">Save Progress</span>
      </Button>
    </AuthDialog>
  );
};
