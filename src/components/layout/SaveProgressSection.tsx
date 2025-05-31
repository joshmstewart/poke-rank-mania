
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
  
  if (isAuthenticated) {
    console.log('🔴🔴🔴 SaveProgressSection: ✅ AUTHENTICATED - About to render BOTH sync status AND user display');
    console.log('🔴🔴🔴 SaveProgressSection: RENDERING AUTHENTICATED LAYOUT NOW');
    return (
      <div className="flex items-center gap-4 bg-yellow-100 border border-yellow-300 p-2">
        {/* Temporary debug styling to make the container visible */}
        
        {/* Sync Status Indicator */}
        <div className="bg-red-100 border border-red-300 p-1">
          <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-700 border-green-200">
            <Check className="h-3 w-3" />
            <span className="text-xs">Synced</span>
          </Badge>
        </div>
        
        {/* User Profile Management */}
        <div className="bg-purple-100 border border-purple-300 p-1">
          <AuthenticatedUserDisplay />
        </div>
      </div>
    );
  }

  console.log('🔴🔴🔴 SaveProgressSection: ❌ NOT AUTHENTICATED - About to render CloudSyncButton');
  return <CloudSyncButton />;
};

export default SaveProgressSection;
