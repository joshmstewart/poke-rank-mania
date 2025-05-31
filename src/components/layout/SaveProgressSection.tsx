
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedUserDisplay } from '@/components/auth/AuthenticatedUserDisplay';
import { CloudSyncButton } from '@/components/auth/CloudSyncButton';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SaveProgressSection: React.FC = () => {
  console.log('🚨 SaveProgressSection: Component rendering');
  
  const { user, loading, session } = useAuth();

  console.log('🚨 SaveProgressSection: Auth state in detail:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email,
    userId: user?.id,
    sessionAccessToken: session?.access_token ? 'present' : 'missing',
    sessionUser: !!session?.user,
    sessionUserEmail: session?.user?.email,
    sessionUserId: session?.user?.id,
    timestamp: new Date().toISOString()
  });

  // Let's see the raw objects
  console.log('🚨 SaveProgressSection: Raw user object:', user);
  console.log('🚨 SaveProgressSection: Raw session object:', session);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
      </div>
    );
  }

  // FORCE showing the authenticated display if we have ANY indication of being logged in
  // This includes checking if we can see "Synced" status (which means we're authenticated)
  console.log('🚨 SaveProgressSection: About to make auth decision...');
  
  // For now, let's ALWAYS show the AuthenticatedUserDisplay to see if it renders
  console.log('🚨 SaveProgressSection: FORCING AuthenticatedUserDisplay to show');
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
};

export default SaveProgressSection;
