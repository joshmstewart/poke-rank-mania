
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedUserDisplay } from '@/components/auth/AuthenticatedUserDisplay';
import { CloudSyncButton } from '@/components/auth/CloudSyncButton';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SaveProgressSection: React.FC = () => {
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FINAL: ===== COMPONENT RENDER START =====');
  
  const { user, loading, session } = useAuth();

  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FINAL: 🔥 AUTH STATE FROM useAuth 🔥');
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FINAL: Auth state received from useAuth:', {
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
    console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FINAL: 🔄 RETURNING LOADING STATE 🔄');
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
      </div>
    );
  }

  // Check if we're on the page post-login (not loading + potentially has auth data)
  const isPostLoginState = !loading;
  
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FINAL: 🔥 POST-LOGIN STATE CHECK 🔥');
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FINAL: isPostLoginState:', isPostLoginState);
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FINAL: Will force render AuthenticatedUserDisplay:', isPostLoginState);

  // ALWAYS render this if we're in a post-login state (not loading)
  if (isPostLoginState) {
    // Create effective user - use real user if available, otherwise diagnostic user
    const effectiveUser = user || session?.user || {
      id: 'forced-post-login-diagnostic-id',
      email: 'forced-post-login-diagnostic@example.com',
      user_metadata: {
        full_name: 'Forced Post-Login Diagnostic User'
      }
    };

    console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FINAL: 🔥 FORCED POST-LOGIN RENDERING DECISION 🔥');
    console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FINAL: Effective user for forced render:', {
      email: effectiveUser.email,
      id: effectiveUser.id,
      isRealUser: !!(user || session?.user),
      isDiagnosticUser: !(user || session?.user),
      timestamp: new Date().toISOString()
    });

    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-700 border-green-200">
            <Check className="h-3 w-3" />
            <span className="text-xs">Synced (POST-LOGIN)</span>
          </Badge>
        </div>
        
        {/* FORCED POST-LOGIN RENDER */}
        <div style={{
          position: 'fixed',
          top: '150px',
          right: '10px',
          zIndex: 9997,
          border: '5px solid red',
          backgroundColor: 'yellow',
          padding: '15px',
          fontSize: '14px',
          fontWeight: 'bold',
          maxWidth: '400px'
        }}>
          <div style={{ color: 'red', fontSize: '16px', fontWeight: 'bold' }}>
            🚨 FORCED POST-LOGIN AUTH DISPLAY 🚨
          </div>
          <div style={{ fontSize: '12px', color: 'darkred', marginTop: '5px' }}>
            This box proves POST-LOGIN forced rendering works<br/>
            User: {effectiveUser.email}<br/>
            Real User: {!!(user || session?.user) ? 'YES' : 'NO'}<br/>
            Time: {new Date().toLocaleTimeString()}
          </div>
          <AuthenticatedUserDisplay currentUser={effectiveUser} />
        </div>
        
        {/* ALSO RENDER CONDITIONAL VERSION FOR COMPARISON */}
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
  }

  // This should never happen since loading=false means isPostLoginState=true
  console.log('🚨🚨🚨 SAVE_PROGRESS_SECTION_FINAL: ❌ UNEXPECTED STATE - NOT POST-LOGIN ❌');
  return (
    <div className="flex items-center gap-4">
      <CloudSyncButton />
    </div>
  );
};

export default SaveProgressSection;
