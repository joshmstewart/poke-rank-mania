
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

  console.log('🎭🎭🎭 [AUTH_USER_DISPLAY_TRACE] 📊 PROFILE LOADER RESULTS:', {
    hasCurrentProfile: !!currentProfile,
    currentProfileId: currentProfile?.id?.substring(0, 8),
    currentProfileAvatarUrl: currentProfile?.avatar_url,
    currentProfileDisplayName: currentProfile?.display_name,
    currentProfileUsername: currentProfile?.username,
    isProfileLoaded,
    isLoadingProfile: isLoadingProfile.current,
    fullCurrentProfile: currentProfile
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

  console.log('🎭🎭🎭 [AUTH_USER_DISPLAY_TRACE] 🎯 ENHANCED USER CREATION INPUTS:', {
    effectiveUserHasMetadata: !!effectiveUser?.user_metadata,
    effectiveUserMetadataAvatarUrl: effectiveUser?.user_metadata?.avatar_url,
    currentProfileExists: !!currentProfile,
    currentProfileAvatarUrl: currentProfile?.avatar_url,
    timestamp: new Date().toISOString()
  });

  console.log('🎭🎭🎭 [AUTH_USER_DISPLAY_TRACE] 🎯 ENHANCED USER FINAL RESULT:', {
    hasEnhancedUser: !!enhancedUser,
    enhancedUserAvatarUrl: enhancedUser?.user_metadata?.avatar_url,
    enhancedUserDisplayName: enhancedUser?.user_metadata?.display_name,
    enhancedUserUsername: enhancedUser?.user_metadata?.username,
    enhancedUserFullMetadata: enhancedUser?.user_metadata
  });

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
  console.log('🎭🎭🎭 [AUTH_USER_DISPLAY_TRACE] Final avatar being passed to dropdown:', enhancedUser.user_metadata?.avatar_url);

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
