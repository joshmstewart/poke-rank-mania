
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

  console.log('🎭 [AUTH_USER_DISPLAY] ===== CRITICAL DEBUG =====');
  console.log('🎭 [AUTH_USER_DISPLAY] Rendering with user:', {
    hasEffectiveUser: !!effectiveUser,
    effectiveUserId: effectiveUser?.id?.substring(0, 8),
  });
  console.log('🎭 [AUTH_USER_DISPLAY] ===== END DEBUG =====');

  // Use custom hooks for profile management
  const {
    currentProfile,
    setCurrentProfile,
    isProfileLoaded,
    setIsProfileLoaded,
    isLoadingProfile
  } = useProfileLoader(effectiveUser?.id);

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

  // CRITICAL DEBUG: Log what's being passed to UserDropdownMenu
  console.log('🎭 [AUTH_USER_DISPLAY] ===== HEADER USER DEBUG =====');
  console.log('🎭 [AUTH_USER_DISPLAY] Enhanced user for header:', {
    hasEnhancedUser: !!enhancedUser,
    enhancedUserId: enhancedUser?.id?.substring(0, 8),
    avatarUrl: enhancedUser?.user_metadata?.avatar_url,
    displayName: enhancedUser?.user_metadata?.display_name,
    timestamp: new Date().toISOString()
  });
  console.log('🎭 [AUTH_USER_DISPLAY] Profile data:', {
    hasCurrentProfile: !!currentProfile,
    profileAvatarUrl: currentProfile?.avatar_url,
    profileDisplayName: currentProfile?.display_name,
    isProfileLoaded
  });
  console.log('🎭 [AUTH_USER_DISPLAY] ===== END HEADER USER DEBUG =====');

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
    return null;
  }

  // Don't render until we've at least attempted to load the profile
  if (!isProfileLoaded) {
    console.log('🎭 [AUTH_USER_DISPLAY] ⏳ Profile not loaded yet, showing loading...');
    return <UserDisplayLoading />;
  }

  if (!enhancedUser) {
    console.log('🎭 [AUTH_USER_DISPLAY] ❌ No enhanced user, showing loading...');
    return <UserDisplayLoading />;
  }

  console.log('🎭 [AUTH_USER_DISPLAY] ✅ Rendering UserDropdownMenu with enhanced user');

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
