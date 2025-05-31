
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedUserDisplay } from '@/components/auth/AuthenticatedUserDisplay';
import { CloudSyncButton } from '@/components/auth/CloudSyncButton';

const SaveProgressSection: React.FC = () => {
  const { user, loading, session } = useAuth();

  // CRITICAL DEBUG LOGGING
  console.log('🔴 SaveProgressSection CRITICAL DEBUG:', {
    user: user,
    userExists: !!user,
    session: session,
    sessionExists: !!session,
    loading: loading,
    userEmail: user?.email,
    sessionUserId: session?.user?.id,
    authContextValues: { user, loading, session }
  });

  console.log('🔴 SaveProgressSection: Raw user object:', user);
  console.log('🔴 SaveProgressSection: Raw session object:', session);
  console.log('🔴 SaveProgressSection: typeof user:', typeof user);
  console.log('🔴 SaveProgressSection: typeof session:', typeof session);
  
  if (loading) {
    console.log('🔴 SaveProgressSection: LOADING STATE - showing loading spinner');
    return (
      <div className="flex items-center gap-2">
        <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
      </div>
    );
  }

  console.log('🔴 SaveProgressSection: Checking auth conditions...');
  console.log('🔴 SaveProgressSection: user && session =', !!(user && session));
  
  if (user && session) {
    console.log('🔴 SaveProgressSection: ✅ AUTHENTICATED - should show user display');
    return (
      <div className="save-progress-authenticated" style={{ border: '3px solid blue', padding: '8px', backgroundColor: 'lightblue' }}>
        <div style={{ fontSize: '14px', color: 'darkblue', fontWeight: 'bold' }}>✅ AUTHENTICATED SECTION - USER FOUND</div>
        <div style={{ fontSize: '10px', color: 'darkblue' }}>User: {user.email}, Session: {session.user?.id}</div>
        <AuthenticatedUserDisplay />
      </div>
    );
  }

  console.log('🔴 SaveProgressSection: ❌ NOT AUTHENTICATED - showing cloud sync button');
  return (
    <div className="save-progress-unauthenticated" style={{ border: '3px solid red', padding: '8px', backgroundColor: 'lightpink' }}>
      <div style={{ fontSize: '14px', color: 'darkred', fontWeight: 'bold' }}>❌ UNAUTHENTICATED SECTION - NO USER</div>
      <div style={{ fontSize: '10px', color: 'darkred' }}>User: {user ? 'exists' : 'null'}, Session: {session ? 'exists' : 'null'}</div>
      <CloudSyncButton />
    </div>
  );
};

export default SaveProgressSection;
