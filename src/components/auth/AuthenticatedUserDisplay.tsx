
import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/auth/useAuth';
import { toast } from '@/hooks/use-toast';
import { ProfileModal } from './ProfileModal';
import { UserDropdownMenu } from './components/UserDropdownMenu';
import { useProfileCache } from './hooks/useProfileCache';

interface AuthenticatedUserDisplayProps {
  currentUser?: any;
}

export const AuthenticatedUserDisplay: React.FC<AuthenticatedUserDisplayProps> = ({ currentUser }) => {
  const { user, signOut } = useAuth();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { prefetchProfile } = useProfileCache();

  // Use the user from context or props, no additional auth calls needed
  const effectiveUser = currentUser || user;

  // Listen for profile updates to refresh the display
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      console.log('🔄 [AUTH_USER_DISPLAY] Profile updated, refreshing display');
      
      // Force refresh by incrementing key
      setRefreshKey(prev => prev + 1);
      
      // Prefetch updated profile
      if (effectiveUser?.id) {
        prefetchProfile(effectiveUser.id);
      }
    };

    window.addEventListener('profile-updated', handleProfileUpdate as EventListener);
    
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate as EventListener);
    };
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

  if (!effectiveUser) {
    return null;
  }

  return (
    <div className="flex items-center gap-2" key={refreshKey}>
      <UserDropdownMenu user={effectiveUser} />

      <ProfileModal 
        open={profileModalOpen} 
        onOpenChange={handleProfileModalClose}
      />
    </div>
  );
};
