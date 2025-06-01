
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Cloud } from 'lucide-react';
import { AuthDialog } from './AuthDialog';
import { useAuth } from '@/contexts/AuthContext';

export const CloudSyncButton: React.FC = () => {
  const { user, session } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON_FORCED: ===== DIAGNOSTIC RENDER START =====');
  console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON_FORCED: 🔥 FORCED LOGGING MODE (RE-IMPLEMENTED) 🔥');
  console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON_FORCED: Auth state from useAuth (validation target):', {
    hasUser: !!user,
    hasSession: !!session,
    userEmail: user?.email || 'no email',
    sessionUserEmail: session?.user?.email || 'no session email',
    contextFixed: (!!user || !!session?.user) ? 'YES - useAuth WORKING!' : 'NO - useAuth STILL BROKEN',
    timestamp: new Date().toISOString()
  });

  const isAuthenticated = !!user || !!session?.user;

  console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON_FORCED: 🔥 AUTHENTICATION CHECK:', {
    isAuthenticated,
    hasUser: !!user,
    hasSessionUser: !!session?.user,
    willReturnNull: isAuthenticated,
    willRenderButton: !isAuthenticated,
    NOTE: 'Should return null if useAuth fixes worked'
  });

  if (isAuthenticated) {
    console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON_FORCED: 🚫 USER IS AUTHENTICATED - RETURNING NULL 🚫');
    console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON_FORCED: This indicates useAuth context fixes are working!');
    return null;
  }

  console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON_FORCED: 🟢 USER NOT AUTHENTICATED - RENDERING BUTTON 🟢');
  console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON_FORCED: This indicates useAuth context still shows unauthenticated');

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
        Time: {new Date().toLocaleTimeString()}<br/>
        useAuth context: {isAuthenticated ? 'WORKING' : 'BROKEN'}
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
