
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

  console.log('🔵🔵🔵 AUTHENTICATED_USER_DISPLAY: ===== DIAGNOSTIC RENDER START =====');
  console.log('🔵🔵🔵 AUTHENTICATED_USER_DISPLAY: Render count:', renderCount);
  console.log('🔵🔵🔵 AUTHENTICATED_USER_DISPLAY: Props received:', {
    currentUserProp: !!currentUser,
    currentUserEmail: currentUser?.email || 'no prop email',
    currentUserId: currentUser?.id || 'no prop id',
    timestamp: new Date().toISOString()
  });
  console.log('🔵🔵🔵 AUTHENTICATED_USER_DISPLAY: Auth context state:', {
    hasUser: !!user,
    hasSession: !!session,
    userEmail: user?.email || 'no user email',
    userId: user?.id || 'no user id',
    sessionUserEmail: session?.user?.email || 'no session email',
    sessionUserId: session?.user?.id || 'no session id',
    timestamp: new Date().toISOString()
  });

  // DIAGNOSTIC: Use prop first, then fallback to context
  const effectiveUser = currentUser || user || session?.user;
  
  console.log('🔵🔵🔵 AUTHENTICATED_USER_DISPLAY: Effective user determination:', {
    effectiveUser: !!effectiveUser,
    sourceUsed: currentUser ? 'prop' : user ? 'context-user' : session?.user ? 'context-session' : 'none',
    effectiveUserEmail: effectiveUser?.email || 'no effective email',
    effectiveUserId: effectiveUser?.id || 'no effective id'
  });
  
  // FORCE RENDER WITH BASIC FALLBACKS - never return null in diagnostic mode
  const displayEmail = effectiveUser?.email || 'diagnostic-user@example.com';
  const displayName = profile?.display_name || profile?.username || effectiveUser?.email?.split('@')[0] || 'Diagnostic User';
  const avatarUrl = profile?.avatar_url;

  console.log('🔵🔵🔵 AUTHENTICATED_USER_DISPLAY: Display values computed:', {
    displayName,
    displayEmail,
    avatarUrl: avatarUrl || 'no avatar',
    profilePresent: !!profile,
    WILL_RENDER: true,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    console.log('🔵🔵🔵 AUTHENTICATED_USER_DISPLAY: ===== MOUNT EFFECT =====');
    console.log('🔵🔵🔵 AUTHENTICATED_USER_DISPLAY: Component mounted, render count:', renderCount);
    
    return () => {
      console.log('🔵🔵🔵 AUTHENTICATED_USER_DISPLAY: ===== UNMOUNT DETECTED =====');
      console.log('🔵🔵🔵 AUTHENTICATED_USER_DISPLAY: 🚨 AuthenticatedUserDisplay UNMOUNTING 🚨');
      console.log('🔵🔵🔵 AUTHENTICATED_USER_DISPLAY: Final render count was:', renderCount);
    };
  }, []);

  useEffect(() => {
    console.log('🔵🔵🔵 AUTHENTICATED_USER_DISPLAY: Profile loading effect triggered');
    if (effectiveUser?.id) {
      console.log('🔵🔵🔵 AUTHENTICATED_USER_DISPLAY: Loading profile for user ID:', effectiveUser.id);
      loadProfile(effectiveUser.id);
    } else {
      console.log('🔵🔵🔵 AUTHENTICATED_USER_DISPLAY: No effective user ID for profile loading');
    }
  }, [currentUser, user, session]);

  const loadProfile = async (userId: string) => {
    console.log('🔵🔵🔵 AUTHENTICATED_USER_DISPLAY: Loading profile for user:', userId);
    try {
      const profileData = await getProfile(userId);
      setProfile(profileData);
      console.log('🔵🔵🔵 AUTHENTICATED_USER_DISPLAY: Profile loaded successfully:', profileData);
    } catch (error) {
      console.error('🔵🔵🔵 AUTHENTICATED_USER_DISPLAY: Error loading profile:', error);
    }
  };

  const handleSignOut = async () => {
    console.log('🔵🔵🔵 AUTHENTICATED_USER_DISPLAY: Signing out...');
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been successfully signed out.',
    });
  };

  const handleProfileModalClose = (open: boolean) => {
    setProfileModalOpen(open);
    if (!open && effectiveUser?.id) {
      loadProfile(effectiveUser.id);
    }
  };

  console.log('🔵🔵🔵 AUTHENTICATED_USER_DISPLAY: 🟢 FORCED DIAGNOSTIC RENDER - ALWAYS RENDERS 🟢');
  console.log('🔵🔵🔵 AUTHENTICATED_USER_DISPLAY: About to render JSX with values:', {
    displayName,
    displayEmail,
    hasAvatar: !!avatarUrl,
    renderCount,
    effectiveUser: !!effectiveUser,
    timestamp: new Date().toISOString()
  });

  // CRITICAL: Always render in diagnostic mode - never return null
  return (
    <div className="bg-blue-500 border-4 border-red-400 p-2">
      <div className="text-white font-bold text-xs">🔵 AUTHENTICATED USER DISPLAY (FORCED) 🔵</div>
      <div className="text-white text-xs">Render #{renderCount}</div>
      <div className="text-white text-xs">User: {displayName}</div>
      <div className="text-white text-xs">Email: {displayEmail}</div>
      <div className="text-white text-xs">Source: {currentUser ? 'prop' : user ? 'ctx-user' : 'ctx-session'}</div>
      <div className="text-white text-xs">Time: {new Date().toLocaleTimeString()}</div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-auto p-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                <AvatarFallback className="bg-blue-500 text-white">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-white">
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

      <ProfileModal 
        open={profileModalOpen} 
        onOpenChange={handleProfileModalClose}
      />
    </div>
  );
};
