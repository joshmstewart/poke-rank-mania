
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedUserDisplay } from '@/components/auth/AuthenticatedUserDisplay';
import { CloudSyncButton } from '@/components/auth/CloudSyncButton';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SaveProgressSection: React.FC = () => {
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FIXED: ===== COMPONENT RENDER START =====');
  
  const { user, loading, session } = useAuth();

  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FIXED: 🔥 USING FIXED useAuth 🔥');
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FIXED: Auth state received from FIXED useAuth:', {
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
    console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FIXED: 🔄 RETURNING LOADING STATE 🔄');
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
      </div>
    );
  }

  // Use the FIXED auth state - no more forcing
  const isAuthenticated = !!user || !!session?.user;
  const authenticatedUser = user || session?.user;
  
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FIXED: 🔥 FIXED AUTH DECISION 🔥');
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FIXED: isAuthenticated (from fixed useAuth):', isAuthenticated);
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FIXED: authenticatedUser:', !!authenticatedUser);
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FIXED: authenticatedUser email:', authenticatedUser?.email || 'no email');

  if (isAuthenticated && authenticatedUser) {
    console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FIXED: ✅ AUTHENTICATED - RENDERING AuthenticatedUserDisplay ✅');
    console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FIXED: 🟢 NO MORE FORCED RENDERING - USING REAL AUTH STATE 🟢');
    console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FIXED: User to pass to AuthenticatedUserDisplay:', authenticatedUser.email);
    
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-700 border-green-200">
            <Check className="h-3 w-3" />
            <span className="text-xs">Synced</span>
          </Badge>
        </div>
        <AuthenticatedUserDisplay currentUser={authenticatedUser} />
      </div>
    );
  } else {
    console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FIXED: ❌ NOT AUTHENTICATED - RENDERING CloudSyncButton ❌');
    return (
      <div className="flex items-center gap-4">
        <CloudSyncButton />
      </div>
    );
  }
};

export default SaveProgressSection;
