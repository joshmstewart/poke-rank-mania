
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
      return;
    }

    console.log('🔄 [PROFILE_LOADER] ===== LOADING PROFILE =====');
    console.log('🔄 [PROFILE_LOADER] Loading profile for user:', userId?.substring(0, 8));
    
    isLoadingProfile.current = true;
    lastUserId.current = userId;
    setIsProfileLoaded(false);
    
    // Get cached profile first
    const cachedProfile = getProfileFromCache(userId);
    
    if (cachedProfile) {
      console.log('🔄 [PROFILE_LOADER] ✅ Found cached profile with avatar:', cachedProfile.avatar_url);
      setCurrentProfile({ ...cachedProfile });
      setIsProfileLoaded(true);
    }
    
    // Always fetch fresh profile data
    prefetchProfile(userId).then(() => {
      const freshProfile = getProfileFromCache(userId);
      
      if (freshProfile) {
        console.log('🔄 [PROFILE_LOADER] ✅ Setting fresh profile with avatar:', freshProfile.avatar_url);
        setCurrentProfile({ ...freshProfile });
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
