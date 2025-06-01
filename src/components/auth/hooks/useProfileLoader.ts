
import { useState, useEffect, useRef } from 'react';
import { useProfileCache } from './useProfileCache';

export const useProfileLoader = (userId: string | undefined) => {
  const [currentProfile, setCurrentProfile] = useState(null);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const { prefetchProfile, getProfileFromCache } = useProfileCache();
  
  const isLoadingProfile = useRef(false);
  const lastUserId = useRef<string | null>(null);

  // Load profile data when user changes
  useEffect(() => {
    if (!userId || isLoadingProfile.current || lastUserId.current === userId) {
      console.log('🔄 [PROFILE_LOADER] Skipping profile load:', {
        hasUser: !!userId,
        isLoading: isLoadingProfile.current,
        sameUser: lastUserId.current === userId
      });
      return;
    }

    console.log('🔄 [PROFILE_LOADER] Loading profile for user:', userId);
    
    isLoadingProfile.current = true;
    lastUserId.current = userId;
    setIsProfileLoaded(false);
    
    // Get cached profile first
    const cachedProfile = getProfileFromCache(userId);
    if (cachedProfile) {
      console.log('🔄 [PROFILE_LOADER] Using cached profile with avatar:', cachedProfile.avatar_url);
      setCurrentProfile(cachedProfile);
      setIsProfileLoaded(true);
    }
    
    // Always fetch fresh profile data
    prefetchProfile(userId).then(() => {
      const freshProfile = getProfileFromCache(userId);
      if (freshProfile) {
        console.log('🔄 [PROFILE_LOADER] Updated with fresh profile avatar:', freshProfile.avatar_url);
        setCurrentProfile(freshProfile);
      }
      setIsProfileLoaded(true);
    }).finally(() => {
      isLoadingProfile.current = false;
    });
  }, [userId, prefetchProfile, getProfileFromCache]);

  return {
    currentProfile,
    setCurrentProfile,
    isProfileLoaded,
    setIsProfileLoaded,
    isLoadingProfile
  };
};
