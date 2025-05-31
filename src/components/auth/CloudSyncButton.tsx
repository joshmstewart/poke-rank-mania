
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Cloud } from 'lucide-react';
import { AuthDialog } from './AuthDialog';
import { useAuth } from '@/contexts/AuthContext';

export const CloudSyncButton: React.FC = () => {
  const { user } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  console.log('🟡🟡🟡 CloudSyncButton: RENDER START - Component is rendering');
  console.log('🟡🟡🟡 CloudSyncButton: Auth state:', {
    hasUser: !!user,
    userEmail: user?.email,
    userId: user?.id,
    timestamp: new Date().toISOString()
  });

  // CRITICAL: Don't render anything if user is authenticated
  if (user) {
    console.log('🟡🟡🟡 CloudSyncButton: ❌ User IS authenticated - RETURNING NULL (should not render anything)');
    return null;
  }

  console.log('🟡🟡🟡 CloudSyncButton: ✅ User is NOT authenticated, rendering save progress button');

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
