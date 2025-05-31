
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Cloud } from 'lucide-react';
import { AuthDialog } from './AuthDialog';
import { useAuth } from '@/contexts/AuthContext';

export const CloudSyncButton: React.FC = () => {
  const { user } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  console.log('🟡 CloudSyncButton: Rendering - user authenticated:', !!user);

  // Only show for unauthenticated users
  if (user) {
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
