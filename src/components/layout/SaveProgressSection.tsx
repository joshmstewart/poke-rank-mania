
import React from 'react';
import { CloudSyncButton } from '@/components/auth/CloudSyncButton';
import { AuthenticatedUserDisplay } from '@/components/auth/AuthenticatedUserDisplay';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const SaveProgressSection = () => {
  const { user, session } = useAuth();
  const [directSupabaseUser, setDirectSupabaseUser] = React.useState<any>(null);

  // Get direct Supabase user for comparison
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: directUser }, error }) => {
      setDirectSupabaseUser(directUser);
      console.log('💾💾💾 SAVE_PROGRESS_SECTION_FIXED: Direct Supabase user check:', {
        hasDirectUser: !!directUser,
        directEmail: directUser?.email,
        directPhone: directUser?.phone,
        error: error?.message,
        timestamp: new Date().toISOString()
      });
    });
  }, []);

  console.log('💾💾💾 SAVE_PROGRESS_SECTION_FIXED: ===== RENDER START =====');
  console.log('💾💾💾 SAVE_PROGRESS_SECTION_FIXED: 🔥 FIXED RENDERING MODE 🔥');
  console.log('💾💾💾 SAVE_PROGRESS_SECTION_FIXED: Auth state from useAuth:', {
    hasUser: !!user,
    hasSession: !!session,
    userEmail: user?.email || 'no email',
    userPhone: user?.phone || 'no phone',
    sessionUserEmail: session?.user?.email || 'no session email',
    sessionUserPhone: session?.user?.phone || 'no session phone',
    contextFixed: (!!user || !!session?.user) ? 'YES - useAuth WORKING!' : 'NO - useAuth STILL BROKEN',
    timestamp: new Date().toISOString()
  });

  console.log('💾💾💾 SAVE_PROGRESS_SECTION_FIXED: Direct Supabase user:', {
    hasDirectUser: !!directSupabaseUser,
    directUserEmail: directSupabaseUser?.email || 'no direct email',
    directUserPhone: directSupabaseUser?.phone || 'no direct phone',
    timestamp: new Date().toISOString()
  });

  console.log('💾💾💾 SAVE_PROGRESS_SECTION_FIXED: Call stack:', new Error().stack);

  const isAuthenticated = !!(user || session?.user || directSupabaseUser);

  console.log('💾💾💾 SAVE_PROGRESS_SECTION_FIXED: 🔥 AUTHENTICATION CHECK 🔥');
  console.log('💾💾💾 SAVE_PROGRESS_SECTION_FIXED: Authentication check:', {
    isAuthenticated,
    hasUser: !!user,
    hasSessionUser: !!session?.user,
    hasDirectUser: !!directSupabaseUser,
    renderDecision: isAuthenticated ? 'RENDER_AUTHENTICATED_DISPLAY' : 'RENDER_CLOUD_SYNC_BUTTON',
    timestamp: new Date().toISOString()
  });

  console.log('💾💾💾 SAVE_PROGRESS_SECTION_FIXED: 🔥 ABOUT TO RENDER JSX 🔥');
  console.log('💾💾💾 SAVE_PROGRESS_SECTION_FIXED: About to render JSX with decision:', {
    isAuthenticated,
    willRenderAuthenticatedDisplay: isAuthenticated,
    willRenderCloudSyncButton: !isAuthenticated,
    timestamp: new Date().toISOString()
  });

  // VISUAL DEBUG OVERLAY REMOVED - Clean production interface
  return (
    <div className="flex items-center gap-4">
      {isAuthenticated ? (
        <AuthenticatedUserDisplay currentUser={user || session?.user || directSupabaseUser} />
      ) : (
        <CloudSyncButton />
      )}
    </div>
  );
};
