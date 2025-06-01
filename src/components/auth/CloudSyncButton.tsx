
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Cloud } from 'lucide-react';
import { AuthDialog } from './AuthDialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const CloudSyncButton: React.FC = () => {
  const { user, session } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [directSupabaseUser, setDirectSupabaseUser] = React.useState<any>(null);

  // Get direct Supabase user for comparison
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: directUser }, error }) => {
      setDirectSupabaseUser(directUser);
      console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON_ULTIMATE: Direct Supabase user check:', {
        hasDirectUser: !!directUser,
        directEmail: directUser?.email,
        error: error?.message,
        timestamp: new Date().toISOString()
      });
    });
  }, []);

  console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON_ULTIMATE: ===== RENDER START =====');
  console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON_ULTIMATE: 🔥 ULTIMATE RENDERING MODE 🔥');
  console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON_ULTIMATE: Auth state from useAuth:', {
    hasUser: !!user,
    hasSession: !!session,
    userEmail: user?.email || 'no email',
    sessionUserEmail: session?.user?.email || 'no session email',
    contextFixed: (!!user || !!session?.user) ? 'YES - useAuth WORKING!' : 'NO - useAuth STILL BROKEN',
    timestamp: new Date().toISOString()
  });

  console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON_ULTIMATE: Direct Supabase user:', {
    hasDirectUser: !!directSupabaseUser,
    directUserEmail: directSupabaseUser?.email || 'no direct email',
    timestamp: new Date().toISOString()
  });

  console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON_ULTIMATE: Call stack:', new Error().stack);

  const isAuthenticated = !!(user || session?.user || directSupabaseUser);

  console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON_ULTIMATE: 🔥 AUTHENTICATION CHECK 🔥');
  console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON_ULTIMATE: Authentication check:', {
    isAuthenticated,
    hasUser: !!user,
    hasSessionUser: !!session?.user,
    hasDirectUser: !!directSupabaseUser,
    willReturnNull: isAuthenticated,
    willRenderButton: !isAuthenticated,
    renderDecision: isAuthenticated ? 'RETURN_NULL' : 'RENDER_BUTTON',
    timestamp: new Date().toISOString()
  });

  if (isAuthenticated) {
    console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON_ULTIMATE: 🚫 USER IS AUTHENTICATED - RETURNING NULL 🚫');
    console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON_ULTIMATE: This indicates authentication is working!');
    return null;
  }

  console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON_ULTIMATE: 🟢 USER NOT AUTHENTICATED - RENDERING BUTTON 🟢');
  console.log('🟡🟡🟡 CLOUD_SYNC_BUTTON_ULTIMATE: This indicates user needs to authenticate');

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
