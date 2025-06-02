
import { useState, useEffect, useRef } from 'react';
import { useProfileCache } from './useProfileCache';

export const useProfileLoader = (userId: string | undefined) => {
  const [currentProfile, setCurrentProfile] = useState(null);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const { prefetchProfile, getProfileFromCache, clearAllCache } = useProfileCache();
  
  const isLoadingProfile = useRef(false);
  const lastUserId = useRef<string | null>(null);

  // Clear all cache on mount/user change to ensure fresh data
  useEffect(() => {
    if (userId && userId !== lastUserId.current) {
      console.log('🔄 [PROFILE_LOADER] User changed, clearing all cache');
      clearAllCache();
    }
  }, [userId, clearAllCache]);

  // Load profile data when user changes
  useEffect(() => {
    if (!userId || isLoadingProfile.current) {
      return;
    }

    // If same user, don't reload unless we don't have data
    if (lastUserId.current === userId && isProfileLoaded && currentProfile) {
      console.log('🔄 [PROFILE_LOADER] Same user and already loaded, skipping');
      return;
    }

    console.log('🔄 [PROFILE_LOADER] ===== LOADING PROFILE =====');
    console.log('🔄 [PROFILE_LOADER] Loading profile for user:', userId?.substring(0, 8));
    
    isLoadingProfile.current = true;
    lastUserId.current = userId;
    setIsProfileLoaded(false);
    
    // Always fetch fresh profile data (no cache check first)
    prefetchProfile(userId, true).then(() => {
      const freshProfile = getProfileFromCache(userId);
      
      if (freshProfile) {
        console.log('🔄 [PROFILE_LOADER] ✅ Setting fresh profile with avatar:', freshProfile.avatar_url);
        setCurrentProfile({ ...freshProfile });
      } else {
        console.log('🔄 [PROFILE_LOADER] ⚠️ No profile found for user');
        setCurrentProfile(null);
      }
      setIsProfileLoaded(true);
      
    }).finally(() => {
      isLoadingProfile.current = false;
      console.log('🔄 [PROFILE_LOADER] Profile loading completed');
    });
  }, [userId, prefetchProfile, getProfileFromCache]);

  const returnValue = {
    currentProfile,
    setCurrentProfile,
    isProfileLoaded,
    setIsProfileLoaded,
    isLoadingProfile
  };
  
  return returnValue;
};
