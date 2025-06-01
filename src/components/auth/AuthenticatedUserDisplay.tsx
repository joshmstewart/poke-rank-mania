
import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth/useAuth';
import { toast } from '@/hooks/use-toast';
import { ProfileModal } from './ProfileModal';
import { UserDropdownMenu } from './components/UserDropdownMenu';
import { useAuthenticatedUser } from './hooks/useAuthenticatedUser';
import { useProfileData } from './hooks/useProfileData';

interface AuthenticatedUserDisplayProps {
  currentUser?: any;
}

export const AuthenticatedUserDisplay: React.FC<AuthenticatedUserDisplayProps> = ({ currentUser }) => {
  const { signOut } = useAuth();
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const { effectiveUser, renderCount, lastLogTime } = useAuthenticatedUser(currentUser);
  const { displayValues, loadProfile } = useProfileData(effectiveUser, renderCount, lastLogTime);

  // ENHANCED: Sign out handler with comprehensive logging
  const handleSignOut = useCallback(async () => {
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: ===== SIGN OUT INITIATED =====');
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: User clicked sign out button');
    
    try {
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Calling authService.signOut()...');
      await signOut();
      
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: ✅ signOut() completed');
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Showing success toast...');
      
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out.',
      });
      
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: ✅ SIGN OUT PROCESS COMPLETE ✅');
      
    } catch (error) {
      console.error('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: ❌ Sign out error:', error);
      toast({
        title: 'Sign out error',
        description: 'There was an error signing out. Please try again.',
        variant: 'destructive',
      });
    }
  }, [signOut]);

  // STABILIZED: Profile modal handler with useCallback
  const handleProfileModalClose = useCallback((open: boolean) => {
    setProfileModalOpen(open);
    if (!open && effectiveUser?.id && effectiveUser?.id.length > 10) {
      loadProfile(effectiveUser.id);
    }
  }, [effectiveUser?.id, loadProfile]);

  const handleProfileClick = useCallback(() => {
    setProfileModalOpen(true);
  }, []);

  if (!effectiveUser || !displayValues) {
    if (renderCount <= 5) {
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: ❌ NO EFFECTIVE USER - RETURNING NULL ❌');
    }
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <UserDropdownMenu
        displayValues={displayValues}
        onProfileClick={handleProfileClick}
        onSignOut={handleSignOut}
      />

      <ProfileModal 
        open={profileModalOpen} 
        onOpenChange={handleProfileModalClose}
      />
    </div>
  );
};
