
import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/auth/useAuth';
import { toast } from '@/hooks/use-toast';
import { ProfileModal } from './ProfileModal';
import { UserDropdownMenu } from './components/UserDropdownMenu';
import { useAuthenticatedUser } from './hooks/useAuthenticatedUser';
import { useOptimizedProfileData } from './hooks/useOptimizedProfileData';
import { useProfileCache } from './hooks/useProfileCache';

interface AuthenticatedUserDisplayProps {
  currentUser?: any;
}

export const AuthenticatedUserDisplay: React.FC<AuthenticatedUserDisplayProps> = ({ currentUser }) => {
  const { user, signOut } = useAuth();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
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

  const handleProfileModalClose = useCallback((open: boolean) => {
    setProfileModalOpen(open);
  }, []);

  if (!effectiveUser || !displayValues) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <UserDropdownMenu user={effectiveUser} />

      <ProfileModal 
        open={profileModalOpen} 
        onOpenChange={handleProfileModalClose}
      />
    </div>
  );
};
