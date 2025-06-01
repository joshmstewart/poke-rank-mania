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
  const [currentProfile, setCurrentProfile] = useState(null);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const { prefetchProfile, getProfileFromCache, invalidateCache } = useProfileCache();
  
  const isLoadingProfile = useRef(false);
  const lastUserId = useRef<string | null>(null);

  const effectiveUser = currentUser || user;

  console.log('🎭 [AUTH_USER_DISPLAY] ===== CRITICAL DEBUG =====');
  console.log('🎭 [AUTH_USER_DISPLAY] Rendering with user:', {
    hasEffectiveUser: !!effectiveUser,
    effectiveUserId: effectiveUser?.id?.substring(0, 8),
    currentProfileAvatar: currentProfile?.avatar_url,
    userMetadataAvatar: effectiveUser?.user_metadata?.avatar_url,
    isProfileLoaded,
    profileId: currentProfile?.id,
    profileUsername: currentProfile?.username,
    profileDisplayName: currentProfile?.display_name
  });
  console.log('🎭 [AUTH_USER_DISPLAY] Full current profile:', JSON.stringify(currentProfile, null, 2));
  console.log('🎭 [AUTH_USER_DISPLAY] Full effective user:', JSON.stringify(effectiveUser, null, 2));
  console.log('🎭 [AUTH_USER_DISPLAY] ===== END DEBUG =====');

  // Load profile data when user changes
  useEffect(() => {
    if (!effectiveUser?.id || isLoadingProfile.current || lastUserId.current === effectiveUser.id) {
      console.log('🔄 [AUTH_USER_DISPLAY] Skipping profile load:', {
        hasUser: !!effectiveUser?.id,
        isLoading: isLoadingProfile.current,
        sameUser: lastUserId.current === effectiveUser.id
      });
      return;
    }

    console.log('🔄 [AUTH_USER_DISPLAY] Loading profile for user:', effectiveUser.id);
    
    isLoadingProfile.current = true;
    lastUserId.current = effectiveUser.id;
    setIsProfileLoaded(false);
    
    // Get cached profile first
    const cachedProfile = getProfileFromCache(effectiveUser.id);
    if (cachedProfile) {
      console.log('🔄 [AUTH_USER_DISPLAY] Using cached profile with avatar:', cachedProfile.avatar_url);
      setCurrentProfile(cachedProfile);
      setIsProfileLoaded(true);
    }
    
    // Always fetch fresh profile data
    prefetchProfile(effectiveUser.id).then(() => {
      const freshProfile = getProfileFromCache(effectiveUser.id);
      if (freshProfile) {
        console.log('🔄 [AUTH_USER_DISPLAY] Updated with fresh profile avatar:', freshProfile.avatar_url);
        setCurrentProfile(freshProfile);
      }
      setIsProfileLoaded(true);
    }).finally(() => {
      isLoadingProfile.current = false;
    });
  }, [effectiveUser?.id, prefetchProfile, getProfileFromCache]);

  // FIXED: Listen for profile updates with immediate fresh fetch (not cache)
  useEffect(() => {
    const handleProfileUpdate = async (event: CustomEvent) => {
      console.log('🔄 [AUTH_USER_DISPLAY] ===== PROFILE UPDATE EVENT =====');
      console.log('🔄 [AUTH_USER_DISPLAY] Profile updated event received:', event.detail);
      console.log('🔄 [AUTH_USER_DISPLAY] Event detail avatar_url:', event.detail?.avatar_url);
      console.log('🔄 [AUTH_USER_DISPLAY] Event detail timestamp:', event.detail?.timestamp);
      
      if (effectiveUser?.id && !isLoadingProfile.current) {
        console.log('🔄 [AUTH_USER_DISPLAY] 🚀 PROCESSING PROFILE UPDATE - FORCING FRESH FETCH');
        
        // Immediately invalidate cache to ensure we don't use stale data
        invalidateCache(effectiveUser.id);
        
        // CRITICAL FIX: Use the event data directly first, then fetch fresh
        if (event.detail && event.detail.avatar_url) {
          console.log('🔄 [AUTH_USER_DISPLAY] 🎯 Using FRESH event data directly');
          const updatedProfile = {
            ...currentProfile,
            id: effectiveUser.id,
            avatar_url: event.detail.avatar_url,
            username: event.detail.username || currentProfile?.username,
            display_name: event.detail.display_name || currentProfile?.display_name,
            updated_at: event.detail.timestamp
          };
          
          console.log('🔄 [AUTH_USER_DISPLAY] 🎯 Setting profile from event data:', updatedProfile.avatar_url);
          setCurrentProfile(updatedProfile);
          setIsProfileLoaded(true);
        }
        
        // Also fetch fresh data to ensure cache is updated
        isLoadingProfile.current = true;
        
        try {
          // Small delay to ensure database consistency
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Fetch completely fresh profile data
          await prefetchProfile(effectiveUser.id);
          const freshProfile = getProfileFromCache(effectiveUser.id);
          
          if (freshProfile) {
            console.log('🔄 [AUTH_USER_DISPLAY] 🎯 FINAL: Setting fresh profile with avatar:', freshProfile.avatar_url);
            setCurrentProfile(freshProfile);
          }
          setIsProfileLoaded(true);
        } finally {
          isLoadingProfile.current = false;
        }
      }
    };

    window.addEventListener('profile-updated', handleProfileUpdate as EventListener);
    
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate as EventListener);
    };
  }, [effectiveUser?.id, getProfileFromCache, prefetchProfile, invalidateCache, currentProfile]);

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
    console.log('🔄 [AUTH_USER_DISPLAY] Showing loading state - profile not loaded yet');
    return (
      <div className="flex items-center gap-2">
        <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse" />
        <div className="hidden sm:inline h-4 w-24 bg-gray-200 animate-pulse rounded" />
      </div>
    );
  }

  // FIXED: Create enhanced user with proper avatar priority - Profile avatar takes absolute priority
  const enhancedUser = {
    ...effectiveUser,
    user_metadata: {
      ...effectiveUser.user_metadata,
      // CRITICAL FIX: Use the profile avatar directly, not fallback to user metadata
      avatar_url: currentProfile?.avatar_url || '',
      username: currentProfile?.username || effectiveUser.user_metadata?.username || effectiveUser.email?.split('@')[0] || 'User',
      display_name: currentProfile?.display_name || effectiveUser.user_metadata?.display_name || effectiveUser.user_metadata?.username || 'User',
    }
  };

  console.log('🎭 [AUTH_USER_DISPLAY] ===== ENHANCED USER DEBUG =====');
  console.log('🎭 [AUTH_USER_DISPLAY] Enhanced user for dropdown:', {
    avatarUrl: enhancedUser.user_metadata.avatar_url,
    displayName: enhancedUser.user_metadata.display_name,
    username: enhancedUser.user_metadata.username,
    hasProfileAvatar: !!currentProfile?.avatar_url,
    profileAvatarUrl: currentProfile?.avatar_url
  });
  console.log('🎭 [AUTH_USER_DISPLAY] Full enhanced user metadata:', JSON.stringify(enhancedUser.user_metadata, null, 2));
  console.log('🎭 [AUTH_USER_DISPLAY] ===== END ENHANCED USER DEBUG =====');

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
