
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

  // FORCED DIAGNOSTIC APPROACH: Always render AuthenticatedUserDisplay if we have ANY auth data
  const hasAnyAuthData = !!user || !!session?.user || !!session;
  const authenticatedUser = user || session?.user;
  
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION: FORCED DIAGNOSTIC DECISION LOGIC:', {
    hasAnyAuthData,
    hasUser: !!user,
    hasSessionUser: !!session?.user,
    hasSession: !!session,
    userEmail: user?.email,
    sessionUserEmail: session?.user?.email,
    authenticatedUserEmail: authenticatedUser?.email,
    FORCING_AUTHENTICATED_DISPLAY: hasAnyAuthData,
    timestamp: new Date().toISOString()
  });

  // CRITICAL DIAGNOSTIC: Force render AuthenticatedUserDisplay if ANY auth data exists
  if (hasAnyAuthData) {
    console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION: 🟢 FORCING AuthenticatedUserDisplay RENDER 🟢');
    console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION: Passing authenticatedUser to AuthenticatedUserDisplay:', {
      authenticatedUser: !!authenticatedUser,
      userEmail: authenticatedUser?.email || 'no email',
      userId: authenticatedUser?.id || 'no id',
      authDataSource: user ? 'from user' : 'from session.user',
      timestamp: new Date().toISOString()
    });
    
    return (
      <div className="flex items-center gap-4">
        <div className="bg-red-500 border-4 border-yellow-400 p-2">
          <div className="text-white font-bold text-xs">🔥 FORCED DIAGNOSTIC MODE 🔥</div>
          <div className="text-white text-xs">SaveProgressSection FORCING AuthenticatedUserDisplay</div>
          <div className="text-white text-xs">Auth data: {hasAnyAuthData ? 'YES' : 'NO'}</div>
          <div className="text-white text-xs">User email: {authenticatedUser?.email || 'none'}</div>
          <div className="text-white text-xs">Time: {new Date().toLocaleTimeString()}</div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-700 border-green-200">
            <Check className="h-3 w-3" />
            <span className="text-xs">Synced</span>
          </Badge>
        </div>
        <AuthenticatedUserDisplay currentUser={authenticatedUser} />
      </div>
    );
  }

  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION: 🔴 NO AUTH DATA DETECTED - RENDERING CloudSyncButton 🔴');
  return <CloudSyncButton />;
};

export default SaveProgressSection;
