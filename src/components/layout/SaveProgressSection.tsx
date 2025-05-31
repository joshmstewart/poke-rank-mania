
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedUserDisplay } from '@/components/auth/AuthenticatedUserDisplay';
import { CloudSyncButton } from '@/components/auth/CloudSyncButton';
import { Cloud, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SaveProgressSection: React.FC = () => {
  const { user, loading, session } = useAuth();

  console.log('🔴🔴🔴 SaveProgressSection: RENDER START - Component is rendering');
  console.log('🔴🔴🔴 SaveProgressSection: Auth state details:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email,
    userId: user?.id,
    userObject: user,
    sessionObject: session,
    timestamp: new Date().toISOString()
  });
  
  if (loading) {
    console.log('🔴🔴🔴 SaveProgressSection: LOADING STATE - showing spinner');
    return (
      <div className="flex items-center gap-2">
        <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
      </div>
    );
  }

  const isAuthenticated = !!(user && session);
  console.log('🔴🔴🔴 SaveProgressSection: Authentication check result:', isAuthenticated);
  console.log('🔴🔴🔴 SaveProgressSection: User check:', !!user);
  console.log('🔴🔴🔴 SaveProgressSection: Session check:', !!session);
  
  if (isAuthenticated) {
    console.log('🔴🔴🔴 SaveProgressSection: ✅ AUTHENTICATED - About to render BOTH sync status AND user display');
    console.log('🔴🔴🔴 SaveProgressSection: RENDERING AUTHENTICATED LAYOUT NOW');
    return (
      <div className="flex items-center gap-4 bg-yellow-100 border-2 border-yellow-500 p-4">
        {/* Make debug styling VERY visible */}
        <div className="text-xs text-yellow-800">DEBUG: AUTHENTICATED CONTAINER</div>
        
        {/* Sync Status Indicator */}
        <div className="bg-red-100 border-2 border-red-500 p-2">
          <div className="text-xs text-red-800 mb-1">DEBUG: SYNC STATUS</div>
          <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-700 border-green-200">
            <Check className="h-3 w-3" />
            <span className="text-xs">Synced</span>
          </Badge>
        </div>
        
        {/* User Profile Management */}
        <div className="bg-purple-100 border-2 border-purple-500 p-2">
          <div className="text-xs text-purple-800 mb-1">DEBUG: USER DISPLAY</div>
          <AuthenticatedUserDisplay />
        </div>
      </div>
    );
  }

  console.log('🔴🔴🔴 SaveProgressSection: ❌ NOT AUTHENTICATED - About to render CloudSyncButton');
  return (
    <div className="bg-orange-100 border-2 border-orange-500 p-2">
      <div className="text-xs text-orange-800 mb-1">DEBUG: UNAUTHENTICATED</div>
      <CloudSyncButton />
    </div>
  );
};

export default SaveProgressSection;
