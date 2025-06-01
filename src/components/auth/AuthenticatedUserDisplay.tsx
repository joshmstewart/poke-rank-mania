
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

  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_NORMAL: ===== NORMAL RENDER START =====');
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_NORMAL: 🟢 NORMAL RENDERING MODE 🟢');
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_NORMAL: Render count:', renderCount);
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_NORMAL: Props received:', {
    currentUserProp: !!currentUser,
    currentUserEmail: currentUser?.email || 'no prop email',
    currentUserId: currentUser?.id || 'no prop id',
    timestamp: new Date().toISOString()
  });
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_NORMAL: Auth context state (FIXED):', {
    hasUser: !!user,
    hasSession: !!session,
    userEmail: user?.email || 'no user email',
    userId: user?.id || 'no user id',
    sessionUserEmail: session?.user?.email || 'no session email',
    sessionUserId: session?.user?.id || 'no session id',
    timestamp: new Date().toISOString()
  });

  // Use current user from props or context
  const effectiveUser = currentUser || user || session?.user;
  
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_NORMAL: 🔥 EFFECTIVE USER (NORMAL) 🔥');
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_NORMAL: Effective user:', {
    effectiveUser: !!effectiveUser,
    sourceUsed: currentUser ? 'prop' : user ? 'context-user' : session?.user ? 'context-session' : 'none',
    effectiveUserEmail: effectiveUser?.email || 'no effective email',
    effectiveUserId: effectiveUser?.id || 'no effective id'
  });
  
  if (!effectiveUser) {
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_NORMAL: ❌ NO EFFECTIVE USER - RETURNING NULL ❌');
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_NORMAL: This should only happen if auth is truly not working');
    return null;
  }
  
  const displayEmail = effectiveUser?.email || 'unknown-user@example.com';
  const displayName = profile?.display_name || profile?.username || effectiveUser?.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url;

  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_NORMAL: 🔥 NORMAL DISPLAY VALUES 🔥');
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_NORMAL: Display values:', {
    displayName,
    displayEmail,
    avatarUrl: avatarUrl || 'no avatar',
    profilePresent: !!profile,
    WILL_RENDER_NORMALLY: true,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_NORMAL: ===== MOUNT EFFECT =====');
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_NORMAL: Component mounted, render count:', renderCount);
    
    return () => {
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_NORMAL: ===== UNMOUNT DETECTED =====');
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_NORMAL: 🚨 AuthenticatedUserDisplay UNMOUNTING 🚨');
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_NORMAL: Final render count was:', renderCount);
    };
  }, []);

  useEffect(() => {
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_NORMAL: Profile loading effect triggered');
    if (effectiveUser?.id) {
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_NORMAL: Loading profile for user ID:', effectiveUser.id);
      loadProfile(effectiveUser.id);
    } else {
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_NORMAL: No user ID, skipping profile load');
    }
  }, [currentUser, user, session]);

  const loadProfile = async (userId: string) => {
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_NORMAL: Loading profile for user:', userId);
    try {
      const profileData = await getProfile(userId);
      setProfile(profileData);
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_NORMAL: Profile loaded successfully:', profileData);
    } catch (error) {
      console.error('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_NORMAL: Error loading profile:', error);
    }
  };

  const handleSignOut = async () => {
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_NORMAL: Signing out...');
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

  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_NORMAL: 🔥 NORMAL RENDER - REAL USER UI 🔥');
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_NORMAL: About to render JSX with values:', {
    displayName,
    displayEmail,
    hasAvatar: !!avatarUrl,
    renderCount,
    effectiveUser: !!effectiveUser,
    timestamp: new Date().toISOString()
  });

  // Normal rendering - no more forced styles
  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-3 py-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl || undefined} alt={displayName} />
              <AvatarFallback className="bg-blue-500 text-white">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden sm:inline">
              {displayName}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
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
