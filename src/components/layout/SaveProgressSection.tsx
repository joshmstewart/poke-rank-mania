
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedUserDisplay } from '@/components/auth/AuthenticatedUserDisplay';
import { CloudSyncButton } from '@/components/auth/CloudSyncButton';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SaveProgressSection: React.FC = () => {
  console.log('🚨🚨🚨 SaveProgressSection: COMPONENT IS BEING CALLED - this should ALWAYS appear');
  
  const { user, loading, session } = useAuth();

  console.log('🚨🚨🚨 SaveProgressSection: Auth state received from useAuth:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email,
    userId: user?.id,
    timestamp: new Date().toISOString()
  });

  // ALWAYS RENDER THE DEBUG CONTAINER - NEVER RETURN NULL OR EARLY EXIT
  return (
    <div className="bg-red-500 border-8 border-black p-8 m-4 min-h-[200px]">
      <div className="text-2xl font-bold text-white mb-4">🚨 SAVE PROGRESS SECTION IS RENDERING 🚨</div>
      <div className="text-xl font-bold text-white mb-2">Loading: {loading ? 'TRUE' : 'FALSE'}</div>
      <div className="text-xl font-bold text-white mb-2">User: {user ? 'EXISTS' : 'NULL'}</div>
      <div className="text-xl font-bold text-white mb-4">Session: {session ? 'EXISTS' : 'NULL'}</div>
      
      {loading && (
        <div className="bg-purple-500 border-4 border-white p-4 mb-4">
          <div className="text-xl font-bold text-white">🟣 LOADING STATE 🟣</div>
          <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
        </div>
      )}

      {!loading && user && session && (
        <div className="bg-green-500 border-4 border-white p-4 mb-4">
          <div className="text-xl font-bold text-white">🟢 AUTHENTICATED USER PATH 🟢</div>
          <div className="text-white">User: {user.email}</div>
          <div className="text-white">Session exists: {!!session}</div>
          
          <div className="bg-blue-500 border-2 border-white p-2 mt-2 mb-2">
            <div className="text-white font-bold">🔵 SYNC STATUS 🔵</div>
            <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-700 border-green-200">
              <Check className="h-3 w-3" />
              <span className="text-xs">Synced</span>
            </Badge>
          </div>
          
          <div className="bg-orange-500 border-2 border-white p-2 mt-2">
            <div className="text-white font-bold">🟠 USER DISPLAY COMPONENT 🟠</div>
            <AuthenticatedUserDisplay />
          </div>
        </div>
      )}

      {!loading && (!user || !session) && (
        <div className="bg-yellow-500 border-4 border-white p-4">
          <div className="text-xl font-bold text-black">🟡 NOT AUTHENTICATED PATH 🟡</div>
          <div className="text-black">No user or session found</div>
          <div className="bg-white border-2 border-black p-2 mt-2">
            <CloudSyncButton />
          </div>
        </div>
      )}
      
      <div className="text-white font-bold mt-4">🚨 END OF SAVE PROGRESS SECTION 🚨</div>
    </div>
  );
};

export default SaveProgressSection;
