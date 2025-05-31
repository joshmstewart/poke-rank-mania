
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedUserDisplay } from '@/components/auth/AuthenticatedUserDisplay';
import { CloudSyncButton } from '@/components/auth/CloudSyncButton';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SaveProgressSection: React.FC = () => {
  console.log('🚨🚨🚨 SaveProgressSection: ===== COMPONENT RENDER START =====');
  
  const { user, loading, session } = useAuth();

  console.log('🚨🚨🚨 SaveProgressSection: Auth state received from useAuth:', {
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
    console.log('🚨🚨🚨 SaveProgressSection: 🔄 RETURNING LOADING STATE 🔄');
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
      </div>
    );
  }

  // Show authenticated display if we have EITHER user OR session with user
  const isAuthenticated = !!user || !!session?.user;
  
  console.log('🚨🚨🚨 SaveProgressSection: Authentication decision logic:', {
    isAuthenticated,
    hasUser: !!user,
    hasSessionUser: !!session?.user,
    userEmail: user?.email,
    sessionUserEmail: session?.user?.email,
    willShowAuthenticatedDisplay: isAuthenticated,
    willShowCloudSyncButton: !isAuthenticated,
    timestamp: new Date().toISOString()
  });
  
  if (isAuthenticated) {
    console.log('🚨🚨🚨 SaveProgressSection: 🟢 AUTHENTICATED - RENDERING AuthenticatedUserDisplay 🟢');
    console.log('🚨🚨🚨 SaveProgressSection: User data being passed to AuthenticatedUserDisplay:', {
      user: user ? 'present' : 'null',
      session: session ? 'present' : 'null',
      userEmail: user?.email || session?.user?.email || 'no email'
    });
    
    return (
      <div className="flex items-center gap-4">
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

  console.log('🚨🚨🚨 SaveProgressSection: 🔴 NOT AUTHENTICATED - RENDERING CloudSyncButton 🔴');
  return <CloudSyncButton />;
};

export default SaveProgressSection;
