
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedUserDisplay } from '@/components/auth/AuthenticatedUserDisplay';
import { CloudSyncButton } from '@/components/auth/CloudSyncButton';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SaveProgressSection: React.FC = () => {
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FORCED: ===== COMPONENT RENDER START =====');
  
  const { user, loading, session } = useAuth();

  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FORCED: 🔥 AUTH STATE FROM useAuth (POTENTIALLY FIXED) 🔥');
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FORCED: Auth state received from useAuth:', {
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
    console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FORCED: 🔄 RETURNING LOADING STATE 🔄');
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
      </div>
    );
  }

  // CRITICAL: CREATE A FORCED DIAGNOSTIC USER FOR RENDERING
  const forcedDiagnosticUser = {
    id: 'forced-diagnostic-id',
    email: 'forced-diagnostic-user@example.com',
    user_metadata: {
      full_name: 'Forced Diagnostic User'
    }
  };

  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FORCED: 🔥 FORCED RENDERING DECISION 🔥');
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FORCED: Will FORCE render AuthenticatedUserDisplay with diagnostic user');
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FORCED: Forced user:', forcedDiagnosticUser.email);
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FORCED: Real auth state (for comparison):', {
    realUserExists: !!user,
    realSessionExists: !!session,
    realUserEmail: user?.email,
    realSessionUserEmail: session?.user?.email
  });

  // ALWAYS FORCE RENDER - this is the critical diagnostic mechanism
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FORCED: ✅ FORCED RENDERING AuthenticatedUserDisplay ✅');
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FORCED: 🟢 FORCING USER DISPLAY WITH DIAGNOSTIC DATA 🟢');

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-700 border-green-200">
          <Check className="h-3 w-3" />
          <span className="text-xs">Synced (FORCED)</span>
        </Badge>
      </div>
      
      {/* FORCED RENDER - ALWAYS APPEARS */}
      <div style={{
        position: 'fixed',
        top: '150px',
        right: '10px',
        zIndex: 9997,
        border: '5px solid blue',
        backgroundColor: 'lightblue',
        padding: '10px',
        fontSize: '12px',
        maxWidth: '300px'
      }}>
        <div style={{ fontWeight: 'bold', color: 'blue' }}>
          🌟 FORCED AuthenticatedUserDisplay 🌟
        </div>
        <div style={{ fontSize: '10px', color: 'darkblue' }}>
          This box proves forced rendering works<br/>
          Real auth state comparison available in logs
        </div>
        <AuthenticatedUserDisplay currentUser={forcedDiagnosticUser} />
      </div>
      
      {/* ALSO RENDER NORMAL CONDITIONAL VERSION FOR COMPARISON */}
      {(!!user || !!session?.user) ? (
        <div style={{
          border: '2px solid green',
          padding: '5px',
          backgroundColor: 'lightgreen'
        }}>
          <div style={{ fontSize: '10px', color: 'darkgreen', fontWeight: 'bold' }}>
            🟢 NORMAL AUTH RENDER 🟢
          </div>
          <AuthenticatedUserDisplay currentUser={user || session?.user} />
        </div>
      ) : (
        <div style={{
          border: '2px solid orange',
          padding: '5px',
          backgroundColor: 'lightyellow'
        }}>
          <div style={{ fontSize: '10px', color: 'darkorange', fontWeight: 'bold' }}>
            🟠 NO AUTH - SHOWING SYNC BUTTON 🟠
          </div>
          <CloudSyncButton />
        </div>
      )}
    </div>
  );
};

export default SaveProgressSection;
