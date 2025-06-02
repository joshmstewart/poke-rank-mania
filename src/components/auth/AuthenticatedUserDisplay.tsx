
import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth/useAuth';
import { toast } from '@/hooks/use-toast';
import { ProfileModal } from './ProfileModal';
import { UserDropdownMenu } from './components/UserDropdownMenu';
import { UserDisplayLoading } from './components/UserDisplayLoading';
import { useProfileLoader } from './hooks/useProfileLoader';
import { useProfileUpdateHandler } from './hooks/useProfileUpdateHandler';
import { useEnhancedUser } from './hooks/useEnhancedUser';

interface AuthenticatedUserDisplayProps {
  currentUser?: any;
}

export const AuthenticatedUserDisplay: React.FC<AuthenticatedUserDisplayProps> = ({ currentUser }) => {
  const { user, signOut } = useAuth();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  
  const effectiveUser = currentUser || user;

  console.log('🎭🎭🎭 [AUTH_USER_DISPLAY_TRACE] ===== AUTHENTICATED USER DISPLAY RENDER =====');
  console.log('🎭🎭🎭 [AUTH_USER_DISPLAY_TRACE] Rendering with:', {
    hasEffectiveUser: !!effectiveUser,
    effectiveUserId: effectiveUser?.id?.substring(0, 8),
    effectiveUserEmail: effectiveUser?.email,
    timestamp: new Date().toISOString()
  });

  // Use custom hooks for profile management
  const {
    currentProfile,
    setCurrentProfile,
    isProfileLoaded,
    setIsProfileLoaded,
    isLoadingProfile
  } = useProfileLoader(effectiveUser?.id);

  console.log('🎭🎭🎭 [AUTH_USER_DISPLAY_TRACE] 🚨🚨🚨 PROFILE LOADER HOOK RESULTS 🚨🚨🚨');
  console.log('🎭🎭🎭 [AUTH_USER_DISPLAY_TRACE] 📊 DETAILED PROFILE ANALYSIS:', {
    hasCurrentProfile: !!currentProfile,
    currentProfileType: typeof currentProfile,
    currentProfileIsNull: currentProfile === null,
    currentProfileIsUndefined: currentProfile === undefined,
    currentProfileId: currentProfile?.id?.substring(0, 8),
    currentProfileAvatarUrl: currentProfile?.avatar_url,
    currentProfileAvatarUrlType: typeof currentProfile?.avatar_url,
    currentProfileAvatarUrlLength: currentProfile?.avatar_url?.length || 0,
    currentProfileDisplayName: currentProfile?.display_name,
    currentProfileUsername: currentProfile?.username,
    isProfileLoaded,
    isLoadingProfile: isLoadingProfile.current,
    fullCurrentProfile: currentProfile ? JSON.stringify(currentProfile, null, 2) : 'NULL/UNDEFINED',
    timestamp: new Date().toISOString()
  });

  // Handle profile update events
  useProfileUpdateHandler({
    userId: effectiveUser?.id,
    currentProfile,
    setCurrentProfile,
    setIsProfileLoaded,
    isLoadingProfile
  });

  // Create enhanced user object
  const enhancedUser = useEnhancedUser(effectiveUser, currentProfile);

  console.log('🎭🎭🎭 [AUTH_USER_DISPLAY_TRACE] 🎯 ENHANCED USER HOOK INPUTS:');
  console.log('🎭🎭🎭 [AUTH_USER_DISPLAY_TRACE] - effectiveUser has metadata:', !!effectiveUser?.user_metadata);
  console.log('🎭🎭🎭 [AUTH_USER_DISPLAY_TRACE] - effectiveUser metadata avatar:', effectiveUser?.user_metadata?.avatar_url);
  console.log('🎭🎭🎭 [AUTH_USER_DISPLAY_TRACE] - currentProfile passed:', !!currentProfile);
  console.log('🎭🎭🎭 [AUTH_USER_DISPLAY_TRACE] - currentProfile avatar:', currentProfile?.avatar_url);

  console.log('🎭🎭🎭 [AUTH_USER_DISPLAY_TRACE] 🎯 ENHANCED USER HOOK RESULTS:');
  console.log('🎭🎭🎭 [AUTH_USER_DISPLAY_TRACE] - hasEnhancedUser:', !!enhancedUser);
  console.log('🎭🎭🎭 [AUTH_USER_DISPLAY_TRACE] - enhancedUser avatar:', enhancedUser?.user_metadata?.avatar_url);
  console.log('🎭🎭🎭 [AUTH_USER_DISPLAY_TRACE] - enhancedUser display name:', enhancedUser?.user_metadata?.display_name);
  console.log('🎭🎭🎭 [AUTH_USER_DISPLAY_TRACE] - enhancedUser username:', enhancedUser?.user_metadata?.username);
  console.log('🎭🎭🎭 [AUTH_USER_DISPLAY_TRACE] - enhancedUser full metadata:', enhancedUser?.user_metadata);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out.',
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: 'Sign out error',
        description: 'There was an error signing out. Please try again.',
        variant: 'destructive',
      });
    }
  }, [signOut]);

  const handleProfileModalClose = useCallback((open: boolean) => {
    setProfileModalOpen(open);
  }, []);

  if (!effectiveUser) {
    console.log('🎭🎭🎭 [AUTH_USER_DISPLAY_TRACE] No effective user - returning null');
    return null;
  }

  // Don't render until we've at least attempted to load the profile
  if (!isProfileLoaded) {
    console.log('🎭🎭🎭 [AUTH_USER_DISPLAY_TRACE] Profile not loaded yet - showing loading');
    return <UserDisplayLoading />;
  }

  if (!enhancedUser) {
    console.log('🎭🎭🎭 [AUTH_USER_DISPLAY_TRACE] No enhanced user - showing loading');
    return <UserDisplayLoading />;
  }

  console.log('🎭🎭🎭 [AUTH_USER_DISPLAY_TRACE] ===== RENDERING USER DROPDOWN =====');
  console.log('🎭🎭🎭 [AUTH_USER_DISPLAY_TRACE] 🎯 FINAL AVATAR BEING PASSED TO DROPDOWN:', {
    avatarUrl: enhancedUser.user_metadata?.avatar_url,
    avatarUrlType: typeof enhancedUser.user_metadata?.avatar_url,
    avatarUrlLength: enhancedUser.user_metadata?.avatar_url?.length || 0,
    timestamp: new Date().toISOString()
  });

  return (
    <div className="flex items-center gap-2">
      <UserDropdownMenu user={enhancedUser} />

      <ProfileModal 
        open={profileModalOpen} 
        onOpenChange={handleProfileModalClose}
      />
    </div>
  );
};
