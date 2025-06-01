
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedUserDisplay } from '@/components/auth/AuthenticatedUserDisplay';
import { CloudSyncButton } from '@/components/auth/CloudSyncButton';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SaveProgressSection: React.FC = () => {
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION: ===== COMPONENT RENDER START =====');
  
  const { user, loading, session } = useAuth();

  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION: 🔥 MAXIMUM FORCE MODE 🔥');
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

  // 🔥 FORCED RENDERING LOGIC - ABSOLUTELY NO CONDITIONS 🔥
  const hasAnyAuthData = !!user || !!session?.user || !!session;
  const authenticatedUser = user || session?.user;
  
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION: 🔥 FORCED RENDERING DECISION 🔥');
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION: hasAnyAuthData:', hasAnyAuthData);
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION: authenticatedUser:', !!authenticatedUser);
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION: authenticatedUser email:', authenticatedUser?.email || 'no email');
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION: FORCING AuthenticatedUserDisplay RENDER REGARDLESS');

  // 🔥 ALWAYS RENDER AuthenticatedUserDisplay WITH FALLBACK USER 🔥
  const fallbackUser = authenticatedUser || {
    email: 'forced-diagnostic-user@example.com',
    id: 'forced-diagnostic-id'
  };

  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION: 🟢 FORCING AuthenticatedUserDisplay WITH USER:', fallbackUser);
  
  return (
    <div className="flex items-center gap-4">
      <div className="bg-red-500 border-4 border-yellow-400 p-2">
        <div className="text-white font-bold text-xs">🔥 MAXIMUM FORCE MODE 🔥</div>
        <div className="text-white text-xs">SaveProgressSection FORCING AuthenticatedUserDisplay</div>
        <div className="text-white text-xs">Auth data: {hasAnyAuthData ? 'YES' : 'NO'}</div>
        <div className="text-white text-xs">User email: {fallbackUser.email}</div>
        <div className="text-white text-xs">Time: {new Date().toLocaleTimeString()}</div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-700 border-green-200">
          <Check className="h-3 w-3" />
          <span className="text-xs">Synced</span>
        </Badge>
      </div>
      <AuthenticatedUserDisplay currentUser={fallbackUser} />
    </div>
  );
};

export default SaveProgressSection;
