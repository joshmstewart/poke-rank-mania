
import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/auth/useAuth';
import { toast } from '@/hooks/use-toast';
import { ProfileModal } from './ProfileModal';
import { AvatarSelectionModal } from './AvatarSelectionModal';
import { UserDropdownMenu } from './components/UserDropdownMenu';
import { useAuthenticatedUser } from './hooks/useAuthenticatedUser';
import { useOptimizedProfileData } from './hooks/useOptimizedProfileData';
import { useProfileCache } from './hooks/useProfileCache';
import { updateProfile } from '@/services/profile';

interface AuthenticatedUserDisplayProps {
  currentUser?: any;
}

export const AuthenticatedUserDisplay: React.FC<AuthenticatedUserDisplayProps> = ({ currentUser }) => {
  const { user, signOut } = useAuth();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const { prefetchProfile } = useProfileCache();

  const { effectiveUser } = useAuthenticatedUser(currentUser);
  const { displayValues } = useOptimizedProfileData(effectiveUser);

  // Pre-fetch profile data immediately when component mounts
  useEffect(() => {
    if (effectiveUser?.id && effectiveUser?.id.length > 10) {
      prefetchProfile(effectiveUser.id);
    }
  }, [effectiveUser?.id, prefetchProfile]);

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

  const handleProfileClick = useCallback(() => {
    setProfileModalOpen(true);
  }, []);

  const handleAvatarClick = useCallback(() => {
    setAvatarModalOpen(true);
  }, []);

  const handleProfileModalClose = useCallback((open: boolean) => {
    setProfileModalOpen(open);
  }, []);

  const handleAvatarSelection = useCallback(async (avatarUrl: string) => {
    if (!user?.id) return;

    try {
      const success = await updateProfile(user.id, {
        avatar_url: avatarUrl,
      });

      if (success) {
        toast({
          title: 'Avatar Updated',
          description: 'Your avatar has been successfully updated.',
        });
        // Refresh the profile cache
        prefetchProfile(user.id);
      } else {
        toast({
          title: 'Update Failed',
          description: 'Failed to update your avatar. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast({
        title: 'Update Error',
        description: 'An error occurred while updating your avatar.',
        variant: 'destructive',
      });
    }
  }, [user?.id, prefetchProfile]);

  if (!effectiveUser || !displayValues) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <UserDropdownMenu
        displayValues={displayValues}
        onProfileClick={handleProfileClick}
        onAvatarClick={handleAvatarClick}
        onSignOut={handleSignOut}
      />

      <ProfileModal 
        open={profileModalOpen} 
        onOpenChange={handleProfileModalClose}
      />

      <AvatarSelectionModal
        open={avatarModalOpen}
        onOpenChange={setAvatarModalOpen}
        currentAvatar={displayValues.avatarUrl || ''}
        onSelectAvatar={handleAvatarSelection}
      />
    </div>
  );
};
