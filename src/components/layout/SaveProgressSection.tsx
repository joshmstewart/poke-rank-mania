
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedUserDisplay } from '@/components/auth/AuthenticatedUserDisplay';
import { CloudSyncButton } from '@/components/auth/CloudSyncButton';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SaveProgressSection: React.FC = () => {
  console.log('🚨 SaveProgressSection: Component rendering');
  
  const { user, loading, session } = useAuth();

  console.log('🚨 SaveProgressSection: Auth state:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email || session?.user?.email,
    timestamp: new Date().toISOString()
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
      </div>
    );
  }

  // Show authenticated display if we have EITHER user OR session with user
  const isAuthenticated = !!user || !!session?.user;
  
  console.log('🚨 SaveProgressSection: Authentication check:', {
    isAuthenticated,
    hasUser: !!user,
    hasSessionUser: !!session?.user,
    willShowAuthenticatedDisplay: isAuthenticated
  });
  
  if (isAuthenticated) {
    console.log('🚨 SaveProgressSection: SHOWING AUTHENTICATED USER DISPLAY');
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

  console.log('🚨 SaveProgressSection: SHOWING CLOUD SYNC BUTTON');
  return <CloudSyncButton />;
};

export default SaveProgressSection;
