
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Cloud } from 'lucide-react';
import { AuthDialog } from './AuthDialog';
import { useAuth } from '@/contexts/AuthContext';

export const CloudSyncButton: React.FC = () => {
  const { user, session } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON: ===== DIAGNOSTIC RENDER START =====');
  console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON: Auth state:', {
    hasUser: !!user,
    hasSession: !!session,
    userEmail: user?.email || 'no email',
    sessionUserEmail: session?.user?.email || 'no session email',
    timestamp: new Date().toISOString()
  });

  const isAuthenticated = !!user || !!session?.user;

  console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON: Authentication check:', {
    isAuthenticated,
    hasUser: !!user,
    hasSessionUser: !!session?.user,
    willReturnNull: isAuthenticated,
    willRenderButton: !isAuthenticated,
    DIAGNOSTIC_NOTE: 'Should return null if authenticated (AuthenticatedUserDisplay should be shown instead)'
  });

  // Only show for unauthenticated users
  if (isAuthenticated) {
    console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON: 🚫 USER IS AUTHENTICATED - RETURNING NULL 🚫');
    console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON: AuthenticatedUserDisplay should be handling this case');
    return null;
  }

  console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON: 🟢 USER NOT AUTHENTICATED - RENDERING BUTTON 🟢');

  return (
    <div className="bg-yellow-500 border-2 border-blue-400 p-2">
      <div className="text-black font-bold text-xs">🟡 CLOUD SYNC BUTTON 🟡</div>
      <div className="text-black text-xs">Not authenticated - showing sync button</div>
      <div className="text-black text-xs">Time: {new Date().toLocaleTimeString()}</div>
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
    </div>
  );
};
