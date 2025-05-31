
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Cloud } from 'lucide-react';
import { AuthDialog } from './AuthDialog';

export const CloudSyncButton: React.FC = () => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowAuthDialog(true)}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Cloud className="h-4 w-4" />
        <span className="hidden sm:inline">Save Progress</span>
      </Button>
      
      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog}
      />
    </>
  );
};
