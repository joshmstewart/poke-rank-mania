
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
  const [currentProfile, setCurrentProfile] = useState(null);
  const { prefetchProfile, getProfileFromCache } = useProfileCache();

  // Use the user from context or props, no additional auth calls needed
  const effectiveUser = currentUser || user;

  // Load profile data immediately when component mounts or user changes
  useEffect(() => {
    if (effectiveUser?.id) {
      console.log('🔄 [AUTH_USER_DISPLAY] Loading profile for user:', effectiveUser.id);
      
      // Get cached profile first
      const cachedProfile = getProfileFromCache(effectiveUser.id);
      if (cachedProfile) {
        console.log('🔄 [AUTH_USER_DISPLAY] Using cached profile:', cachedProfile);
        setCurrentProfile(cachedProfile);
      }
      
      // Prefetch fresh profile data
      prefetchProfile(effectiveUser.id).then(() => {
        const freshProfile = getProfileFromCache(effectiveUser.id);
        if (freshProfile) {
          console.log('🔄 [AUTH_USER_DISPLAY] Updated with fresh profile:', freshProfile);
          setCurrentProfile(freshProfile);
        }
      });
    }
  }, [effectiveUser?.id, prefetchProfile, getProfileFromCache]);

  // Listen for profile updates to refresh the display
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      console.log('🔄 [AUTH_USER_DISPLAY] Profile updated event received:', event.detail);
      
      if (effectiveUser?.id) {
        // Force refresh by incrementing key
        setRefreshKey(prev => prev + 1);
        
        // Get updated profile from cache
        const updatedProfile = getProfileFromCache(effectiveUser.id);
        if (updatedProfile) {
          console.log('🔄 [AUTH_USER_DISPLAY] Setting updated profile:', updatedProfile);
          setCurrentProfile(updatedProfile);
        }
        
        // Also prefetch to ensure we have the latest
        prefetchProfile(effectiveUser.id).then(() => {
          const freshProfile = getProfileFromCache(effectiveUser.id);
          if (freshProfile) {
            console.log('🔄 [AUTH_USER_DISPLAY] Final profile update:', freshProfile);
            setCurrentProfile(freshProfile);
          }
        });
      }
    };

    window.addEventListener('profile-updated', handleProfileUpdate as EventListener);
    
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate as EventListener);
    };
  }, [effectiveUser?.id, prefetchProfile, getProfileFromCache]);

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

  // Create enhanced user object with profile data
  const enhancedUser = {
    ...effectiveUser,
    user_metadata: {
      ...effectiveUser.user_metadata,
      avatar_url: currentProfile?.avatar_url || effectiveUser.user_metadata?.avatar_url,
      username: currentProfile?.username || effectiveUser.user_metadata?.username,
      display_name: currentProfile?.display_name || effectiveUser.user_metadata?.display_name,
    }
  };

  return (
    <div className="flex items-center gap-2" key={`${refreshKey}-${currentProfile?.updated_at}`}>
      <UserDropdownMenu user={enhancedUser} />

      <ProfileModal 
        open={profileModalOpen} 
        onOpenChange={handleProfileModalClose}
      />
    </div>
  );
};
