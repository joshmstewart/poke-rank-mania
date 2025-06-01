
import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  
  // CRITICAL FIX: Prevent infinite loops with refs to track loading state
  const isLoadingProfile = useRef(false);
  const lastUserId = useRef<string | null>(null);

  const effectiveUser = currentUser || user;

  console.log('🎭 [AUTH_USER_DISPLAY] Rendering with user:', {
    hasEffectiveUser: !!effectiveUser,
    effectiveUserId: effectiveUser?.id?.substring(0, 8),
    currentProfileAvatar: currentProfile?.avatar_url,
    userMetadataAvatar: effectiveUser?.user_metadata?.avatar_url
  });

  // CRITICAL FIX: Simplified profile loading with loop prevention
  useEffect(() => {
    if (!effectiveUser?.id || isLoadingProfile.current || lastUserId.current === effectiveUser.id) {
      return;
    }

    console.log('🔄 [AUTH_USER_DISPLAY] Loading profile for user:', effectiveUser.id);
    
    // Prevent concurrent loads
    isLoadingProfile.current = true;
    lastUserId.current = effectiveUser.id;
    
    // Get cached profile first
    const cachedProfile = getProfileFromCache(effectiveUser.id);
    if (cachedProfile) {
      console.log('🔄 [AUTH_USER_DISPLAY] Using cached profile with avatar:', cachedProfile.avatar_url);
      setCurrentProfile(cachedProfile);
    }
    
    // Always try to get fresh profile data to ensure we have the latest avatar
    prefetchProfile(effectiveUser.id).then(() => {
      const freshProfile = getProfileFromCache(effectiveUser.id);
      if (freshProfile) {
        console.log('🔄 [AUTH_USER_DISPLAY] Updated with fresh profile avatar:', freshProfile.avatar_url);
        setCurrentProfile(freshProfile);
      }
    }).finally(() => {
      isLoadingProfile.current = false;
    });
  }, [effectiveUser?.id, prefetchProfile, getProfileFromCache]);

  // CRITICAL FIX: Simplified profile update listener with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleProfileUpdate = (event: CustomEvent) => {
      console.log('🔄 [AUTH_USER_DISPLAY] Profile updated event received:', event.detail);
      
      // Debounce rapid updates
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (effectiveUser?.id && !isLoadingProfile.current) {
          setRefreshKey(prev => prev + 1);
          const updatedProfile = getProfileFromCache(effectiveUser.id);
          if (updatedProfile) {
            console.log('🔄 [AUTH_USER_DISPLAY] Setting updated profile with avatar:', updatedProfile.avatar_url);
            setCurrentProfile(updatedProfile);
          }
        }
      }, 100); // 100ms debounce
    };

    window.addEventListener('profile-updated', handleProfileUpdate as EventListener);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('profile-updated', handleProfileUpdate as EventListener);
    };
  }, [effectiveUser?.id, getProfileFromCache]);

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

  // Create enhanced user object with PRIORITY for profile avatar over user metadata
  const enhancedUser = {
    ...effectiveUser,
    user_metadata: {
      ...effectiveUser.user_metadata,
      // CRITICAL: Prioritize profile avatar_url over user_metadata avatar_url
      avatar_url: currentProfile?.avatar_url || effectiveUser.user_metadata?.avatar_url,
      username: currentProfile?.username || effectiveUser.user_metadata?.username,
      display_name: currentProfile?.display_name || effectiveUser.user_metadata?.display_name,
    }
  };

  console.log('🎭 [AUTH_USER_DISPLAY] Enhanced user for dropdown:', {
    avatarUrl: enhancedUser.user_metadata.avatar_url,
    displayName: enhancedUser.user_metadata.display_name,
    username: enhancedUser.user_metadata.username
  });

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
