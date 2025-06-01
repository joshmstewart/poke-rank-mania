
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedUserDisplay } from '@/components/auth/AuthenticatedUserDisplay';
import { CloudSyncButton } from '@/components/auth/CloudSyncButton';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SaveProgressSection: React.FC = () => {
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION: ===== COMPONENT RENDER START =====');
  
  const { user, loading, session } = useAuth();

  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION: Auth state received from useAuth:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email || 'no email',
    sessionUserEmail: session?.user?.email || 'no session email',
    userFromAuth: user ? 'present' : 'null',
    sessionFromAuth: session ? 'present' : 'null',
    timestamp: new Date().toISOString()
  });

  if (loading) {
    console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION: 🔄 RETURNING LOADING STATE 🔄');
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
      </div>
    );
  }

  // DIAGNOSTIC EXPERIMENT: Force AuthenticatedUserDisplay to render if ANY auth data exists
  const hasAnyAuthData = !!user || !!session?.user || !!session;
  const isAuthenticated = !!user || !!session?.user;
  
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION: DIAGNOSTIC EXPERIMENT - Authentication decision logic:', {
    hasAnyAuthData,
    isAuthenticated,
    hasUser: !!user,
    hasSessionUser: !!session?.user,
    hasSession: !!session,
    userEmail: user?.email,
    sessionUserEmail: session?.user?.email,
    experimentalForceRender: hasAnyAuthData,
    normalRenderDecision: isAuthenticated,
    willForceAuthenticatedDisplay: hasAnyAuthData,
    timestamp: new Date().toISOString()
  });

  // DIAGNOSTIC: Force render AuthenticatedUserDisplay if we have ANY auth data
  if (hasAnyAuthData) {
    console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION: 🟢 DIAGNOSTIC EXPERIMENT - FORCING AuthenticatedUserDisplay RENDER 🟢');
    console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION: User data being passed to AuthenticatedUserDisplay:', {
      user: user ? 'present' : 'null',
      session: session ? 'present' : 'null',
      userEmail: user?.email || session?.user?.email || 'no email',
      experimentType: 'FORCED_RENDER_FOR_DIAGNOSTICS'
    });
    
    return (
      <div className="flex items-center gap-4">
        <div className="bg-orange-500 border-4 border-red-500 p-2">
          <div className="text-white font-bold text-xs">🔧 DIAGNOSTIC MODE 🔧</div>
          <div className="text-white text-xs">Force rendering AuthenticatedUserDisplay</div>
          <div className="text-white text-xs">Auth data detected: {hasAnyAuthData ? 'YES' : 'NO'}</div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-700 border-green-200">
            <Check className="h-3 w-3" />
            <span className="text-xs">Synced</span>
          </Badge>
        </div>
        <AuthenticatedUserDisplay />
      </div>
    );
  }

  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION: 🔴 NO AUTH DATA DETECTED - RENDERING CloudSyncButton 🔴');
  return <CloudSyncButton />;
};

export default SaveProgressSection;
