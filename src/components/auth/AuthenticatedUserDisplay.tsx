
import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth/useAuth';
import { toast } from '@/hooks/use-toast';
import { ProfileModal } from './ProfileModal';
import { UserDropdownMenu } from './components/UserDropdownMenu';

interface AuthenticatedUserDisplayProps {
  currentUser?: any;
}

export const AuthenticatedUserDisplay: React.FC<AuthenticatedUserDisplayProps> = ({ currentUser }) => {
  const { user, signOut } = useAuth();
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Use the user from context or props, no additional auth calls needed
  const effectiveUser = currentUser || user;

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
    <div className="flex items-center gap-2">
      <UserDropdownMenu user={effectiveUser} />

      <ProfileModal 
        open={profileModalOpen} 
        onOpenChange={handleProfileModalClose}
      />
    </div>
  );
};
