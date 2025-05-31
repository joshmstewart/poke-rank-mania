
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Cloud } from 'lucide-react';
import { AuthDialog } from './AuthDialog';

export const CloudSyncButton: React.FC = () => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  console.log('🟡 CloudSyncButton: RENDERING - This should NOT show when authenticated!');
  console.log('🟡 CloudSyncButton: Component is being rendered from:', new Error().stack);

  return (
    <>
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
    </>
  );
};
