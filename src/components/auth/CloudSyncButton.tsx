
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Cloud } from 'lucide-react';
import { AuthDialog } from './AuthDialog';
import { useAuth } from '@/contexts/AuthContext';

export const CloudSyncButton: React.FC = () => {
  const { user, session } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON: ===== MAXIMUM FORCE DIAGNOSTIC RENDER START =====');
  console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON: 🔥 FORCED LOGGING MODE 🔥');
  console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON: Auth state:', {
    hasUser: !!user,
    hasSession: !!session,
    userEmail: user?.email || 'no email',
    sessionUserEmail: session?.user?.email || 'no session email',
    timestamp: new Date().toISOString()
  });

  const isAuthenticated = !!user || !!session?.user;

  console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON: 🔥 FORCED AUTHENTICATION CHECK:', {
    isAuthenticated,
    hasUser: !!user,
    hasSessionUser: !!session?.user,
    willReturnNull: isAuthenticated,
    willRenderButton: !isAuthenticated,
    DIAGNOSTIC_NOTE: 'Should return null if authenticated (AuthenticatedUserDisplay should be forced elsewhere)'
  });

  // Only show for unauthenticated users - BUT LOG EVERYTHING
  if (isAuthenticated) {
    console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON: 🚫 USER IS AUTHENTICATED - RETURNING NULL 🚫');
    console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON: AuthenticatedUserDisplay should be FORCED to render elsewhere');
    console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON: 🔥 THIS SHOULD NOT SHOW SYNCED TEXT 🔥');
    return null;
  }

  console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON: 🟢 USER NOT AUTHENTICATED - RENDERING BUTTON 🟢');

  return (
    <div style={{ 
      backgroundColor: '#ffff00', 
      border: '2px solid #0066ff', 
      padding: '10px',
      borderRadius: '5px'
    }}>
      <div style={{ color: 'black', fontWeight: 'bold', fontSize: '12px' }}>
        🟡 CLOUD SYNC BUTTON (FORCED LOGGING) 🟡
      </div>
      <div style={{ color: 'black', fontSize: '10px' }}>
        Not authenticated - showing sync button<br/>
        Time: {new Date().toLocaleTimeString()}
      </div>
      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog}
      >
        <Button
          variant="outline"
          className="flex items-center gap-2 mt-2"
        >
          <Cloud className="h-4 w-4" />
          <span className="hidden sm:inline">Save Progress</span>
        </Button>
      </AuthDialog>
    </div>
  );
};
