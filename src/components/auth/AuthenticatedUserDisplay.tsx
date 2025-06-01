
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { getProfile, type Profile } from '@/services/profileService';
import { ProfileModal } from './ProfileModal';

interface AuthenticatedUserDisplayProps {
  currentUser?: any;
}

export const AuthenticatedUserDisplay: React.FC<AuthenticatedUserDisplayProps> = ({ currentUser }) => {
  const { user, session, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [renderCount, setRenderCount] = useState(0);

  // Increment render count for diagnostics
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  });

  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: ===== MAXIMUM FORCE RENDER START =====');
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: 🔥 ABSOLUTELY FORCED RENDERING 🔥');
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: Render count:', renderCount);
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: Props received:', {
    currentUserProp: !!currentUser,
    currentUserEmail: currentUser?.email || 'no prop email',
    currentUserId: currentUser?.id || 'no prop id',
    timestamp: new Date().toISOString()
  });
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: Auth context state:', {
    hasUser: !!user,
    hasSession: !!session,
    userEmail: user?.email || 'no user email',
    userId: user?.id || 'no user id',
    sessionUserEmail: session?.user?.email || 'no session email',
    sessionUserId: session?.user?.id || 'no session id',
    timestamp: new Date().toISOString()
  });

  // 🔥 FORCE DISPLAY WITH FALLBACK - NEVER RETURN NULL 🔥
  const effectiveUser = currentUser || user || session?.user || {
    email: 'fallback-diagnostic-user@example.com',
    id: 'fallback-diagnostic-id'
  };
  
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: 🔥 EFFECTIVE USER FORCED:', {
    effectiveUser: !!effectiveUser,
    sourceUsed: currentUser ? 'prop' : user ? 'context-user' : session?.user ? 'context-session' : 'fallback',
    effectiveUserEmail: effectiveUser?.email || 'no effective email',
    effectiveUserId: effectiveUser?.id || 'no effective id'
  });
  
  const displayEmail = effectiveUser?.email || 'diagnostic-user@example.com';
  const displayName = profile?.display_name || profile?.username || effectiveUser?.email?.split('@')[0] || 'Diagnostic User';
  const avatarUrl = profile?.avatar_url;

  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: 🔥 FORCED DISPLAY VALUES:', {
    displayName,
    displayEmail,
    avatarUrl: avatarUrl || 'no avatar',
    profilePresent: !!profile,
    ABSOLUTELY_WILL_RENDER: true,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: ===== MOUNT EFFECT =====');
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: Component mounted, render count:', renderCount);
    
    return () => {
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: ===== UNMOUNT DETECTED =====');
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: 🚨 AuthenticatedUserDisplay UNMOUNTING 🚨');
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: Final render count was:', renderCount);
    };
  }, []);

  useEffect(() => {
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: Profile loading effect triggered');
    if (effectiveUser?.id && effectiveUser.id !== 'fallback-diagnostic-id') {
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: Loading profile for user ID:', effectiveUser.id);
      loadProfile(effectiveUser.id);
    } else {
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: Using fallback user, skipping profile load');
    }
  }, [currentUser, user, session]);

  const loadProfile = async (userId: string) => {
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: Loading profile for user:', userId);
    try {
      const profileData = await getProfile(userId);
      setProfile(profileData);
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: Profile loaded successfully:', profileData);
    } catch (error) {
      console.error('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: Error loading profile:', error);
    }
  };

  const handleSignOut = async () => {
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: Signing out...');
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been successfully signed out.',
    });
  };

  const handleProfileModalClose = (open: boolean) => {
    setProfileModalOpen(open);
    if (!open && effectiveUser?.id && effectiveUser.id !== 'fallback-diagnostic-id') {
      loadProfile(effectiveUser.id);
    }
  };

  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: 🔥 ABSOLUTELY FORCED RENDER - NEVER NULL 🔥');
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: About to render JSX with values:', {
    displayName,
    displayEmail,
    hasAvatar: !!avatarUrl,
    renderCount,
    effectiveUser: !!effectiveUser,
    timestamp: new Date().toISOString()
  });

  // 🔥 ABSOLUTELY FORCED RENDER - BRIGHT BLUE BOX 🔥
  return (
    <div style={{ 
      position: 'fixed',
      top: '200px',
      right: '10px',
      zIndex: 9999,
      backgroundColor: '#0066ff',
      border: '8px solid #ffff00',
      padding: '20px',
      borderRadius: '10px',
      maxWidth: '400px'
    }}>
      <div style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', marginBottom: '10px' }}>
        🌟 AUTHENTICATED USER DISPLAY (MAXIMUM FORCE) 🌟
      </div>
      <div style={{ color: 'white', fontSize: '14px' }}>
        Render #{renderCount}<br/>
        User: {displayName}<br/>
        Email: {displayEmail}<br/>
        Source: {currentUser ? 'prop' : user ? 'ctx-user' : session?.user ? 'ctx-session' : 'fallback'}<br/>
        Time: {new Date().toLocaleTimeString()}
      </div>
      
      <div style={{ marginTop: '15px' }}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" style={{ backgroundColor: 'white', color: 'black' }}>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                  <AvatarFallback className="bg-blue-500 text-white">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {displayName}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white shadow-lg border z-50">
            <DropdownMenuItem onClick={() => setProfileModalOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ProfileModal 
        open={profileModalOpen} 
        onOpenChange={handleProfileModalClose}
      />
    </div>
  );
};
