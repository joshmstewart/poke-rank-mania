
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedUserDisplay } from '@/components/auth/AuthenticatedUserDisplay';
import { CloudSyncButton } from '@/components/auth/CloudSyncButton';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

const SaveProgressSection: React.FC = () => {
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_ULTIMATE: ===== COMPONENT RENDER START =====');
  
  const { user, loading, session } = useAuth();
  const [directSupabaseUser, setDirectSupabaseUser] = React.useState<any>(null);

  // Get direct Supabase user for comparison
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: directUser }, error }) => {
      setDirectSupabaseUser(directUser);
      console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_ULTIMATE: Direct Supabase user check:', {
        hasDirectUser: !!directUser,
        directEmail: directUser?.email,
        error: error?.message,
        timestamp: new Date().toISOString()
      });
    });
  }, []);

  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_ULTIMATE: 🔥 AUTH STATE FROM useAuth 🔥');
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_ULTIMATE: Auth state received from useAuth:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email || 'no email',
    sessionUserEmail: session?.user?.email || 'no session email',
    userFromAuth: user ? 'present' : 'null',
    sessionFromAuth: session ? 'present' : 'null',
    timestamp: new Date().toISOString()
  });

  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_ULTIMATE: 🔥 DIRECT SUPABASE USER 🔥');
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_ULTIMATE: Direct Supabase user:', {
    hasDirectUser: !!directSupabaseUser,
    directUserEmail: directSupabaseUser?.email || 'no direct email',
    directUserId: directSupabaseUser?.id || 'no direct id',
    timestamp: new Date().toISOString()
  });

  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_ULTIMATE: Call stack:', new Error().stack);

  if (loading) {
    console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_ULTIMATE: 🔄 RETURNING LOADING STATE 🔄');
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
      </div>
    );
  }

  // Check for authentication from any source
  const isAuthenticated = !!(user || session?.user || directSupabaseUser);
  const effectiveUser = user || session?.user || directSupabaseUser;
  
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_ULTIMATE: 🔥 AUTHENTICATION CHECK 🔥');
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_ULTIMATE: Authentication analysis:', {
    isAuthenticated,
    hasUser: !!user,
    hasSessionUser: !!session?.user,
    hasDirectUser: !!directSupabaseUser,
    effectiveUserEmail: effectiveUser?.email,
    renderDecision: isAuthenticated ? 'RENDER_AUTHENTICATED' : 'RENDER_UNAUTHENTICATED',
    timestamp: new Date().toISOString()
  });

  if (isAuthenticated) {
    console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_ULTIMATE: ✅ USER IS AUTHENTICATED - RENDERING AUTH UI ✅');
    
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-700 border-green-200">
            <Check className="h-3 w-3" />
            <span className="text-xs">Synced</span>
          </Badge>
        </div>
        
        <AuthenticatedUserDisplay currentUser={effectiveUser} />
      </div>
    );
  }

  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_ULTIMATE: ❌ USER NOT AUTHENTICATED - RENDERING SYNC BUTTON ❌');
  
  return (
    <div className="flex items-center gap-4">
      <CloudSyncButton />
    </div>
  );
};

export default SaveProgressSection;
