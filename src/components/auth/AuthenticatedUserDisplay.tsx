
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

  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: ===== FORCED RENDER START =====');
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: 🔥 FORCED RENDERING MODE (RE-IMPLEMENTED) 🔥');
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: Render count:', renderCount);
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: Props received:', {
    currentUserProp: !!currentUser,
    currentUserEmail: currentUser?.email || 'no prop email',
    currentUserId: currentUser?.id || 'no prop id',
    propSource: currentUser?.email === 'forced-diagnostic-user@example.com' ? 'FORCED_DIAGNOSTIC' : 'REAL_USER_PROP',
    timestamp: new Date().toISOString()
  });

  // CRITICAL: Log the auth context state from useAuth (this should show if your fixes worked)
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: 🎯 AUTH CONTEXT STATE FROM useAuth (VALIDATION TARGET) 🎯');
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: Auth context state (potentially FIXED):', {
    hasUser: !!user,
    hasSession: !!session,
    userEmail: user?.email || 'no user email',
    userId: user?.id || 'no user id',
    sessionUserEmail: session?.user?.email || 'no session email',
    sessionUserId: session?.user?.id || 'no session id',
    contextWorking: (!!user || !!session?.user) ? 'YES - CONTEXT FIXED!' : 'NO - CONTEXT STILL BROKEN',
    timestamp: new Date().toISOString()
  });

  // Use current user from props or context
  const effectiveUser = currentUser || user || session?.user;
  
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: 🔥 EFFECTIVE USER (FORCED MODE) 🔥');
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: Effective user analysis:', {
    effectiveUser: !!effectiveUser,
    sourceUsed: currentUser ? 'prop' : user ? 'context-user' : session?.user ? 'context-session' : 'none',
    effectiveUserEmail: effectiveUser?.email || 'no effective email',
    effectiveUserId: effectiveUser?.id || 'no effective id',
    isForced: currentUser?.email === 'forced-diagnostic-user@example.com',
    willRender: !!effectiveUser
  });
  
  if (!effectiveUser) {
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: ❌ NO EFFECTIVE USER - THIS SHOULD NOT HAPPEN IN FORCED MODE ❌');
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: This indicates a critical failure in the forced rendering mechanism');
    return (
      <div style={{ color: 'red', fontWeight: 'bold', fontSize: '12px' }}>
        ❌ FORCED RENDER FAILED - NO USER ❌
      </div>
    );
  }
  
  const displayEmail = effectiveUser?.email || 'unknown-user@example.com';
  const displayName = profile?.display_name || profile?.username || effectiveUser?.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url;

  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: 🔥 FORCED DISPLAY VALUES 🔥');
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: Display values:', {
    displayName,
    displayEmail,
    avatarUrl: avatarUrl || 'no avatar',
    profilePresent: !!profile,
    renderCount,
    effectiveUser: !!effectiveUser,
    FORCED_RENDER_SUCCESS: true,
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
    if (effectiveUser?.id && effectiveUser?.email !== 'forced-diagnostic-user@example.com') {
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: Loading profile for real user ID:', effectiveUser.id);
      loadProfile(effectiveUser.id);
    } else {
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: Skipping profile load (forced diagnostic user or no ID)');
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
    if (!open && effectiveUser?.id && effectiveUser?.email !== 'forced-diagnostic-user@example.com') {
      loadProfile(effectiveUser.id);
    }
  };

  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: 🔥 FORCED RENDER - ABOUT TO RENDER JSX 🔥');
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FORCED: About to render JSX with values:', {
    displayName,
    displayEmail,
    hasAvatar: !!avatarUrl,
    renderCount,
    effectiveUser: !!effectiveUser,
    isForced: effectiveUser?.email === 'forced-diagnostic-user@example.com',
    timestamp: new Date().toISOString()
  });

  // Special styling for forced diagnostic mode
  const isForced = effectiveUser?.email === 'forced-diagnostic-user@example.com';
  const containerStyle = isForced ? {
    border: '3px solid blue',
    backgroundColor: 'rgba(0, 0, 255, 0.1)',
    padding: '5px',
    borderRadius: '5px'
  } : {};

  return (
    <div className="flex items-center gap-2" style={containerStyle}>
      {isForced && (
        <div style={{ fontSize: '10px', color: 'blue', fontWeight: 'bold' }}>
          FORCED:
        </div>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-3 py-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl || undefined} alt={displayName} />
              <AvatarFallback className={isForced ? "bg-blue-500 text-white" : "bg-blue-500 text-white"}>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden sm:inline">
              {isForced ? 'FORCED USER' : displayName}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setProfileModalOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            {isForced ? 'Profile (Forced)' : 'My Profile'}
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
