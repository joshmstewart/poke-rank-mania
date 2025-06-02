
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

    console.log('🔄 [PROFILE_LOADER] Loading profile for user:', userId?.substring(0, 8));
    
    isLoadingProfile.current = true;
    lastUserId.current = userId;
    setIsProfileLoaded(false);
    
    // Get cached profile first
    const cachedProfile = getProfileFromCache(userId);
    
    if (cachedProfile) {
      console.log('🔄 [PROFILE_LOADER] ✅ Setting cached profile with avatar:', cachedProfile.avatar_url);
      // Force new object reference to ensure state update
      setCurrentProfile({ ...cachedProfile });
      setIsProfileLoaded(true);
    }
    
    // Always fetch fresh profile data
    prefetchProfile(userId).then(() => {
      const freshProfile = getProfileFromCache(userId);
      
      if (freshProfile) {
        console.log('🔄 [PROFILE_LOADER] ✅ Setting fresh profile with avatar:', freshProfile.avatar_url);
        // Force new object reference to ensure state update
        setCurrentProfile({ ...freshProfile });
      }
      setIsProfileLoaded(true);
      
    }).finally(() => {
      isLoadingProfile.current = false;
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
