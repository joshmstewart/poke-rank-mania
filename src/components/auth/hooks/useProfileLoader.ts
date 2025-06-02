
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
      console.log('🔄 [PROFILE_LOADER] Skipping profile load - conditions not met');
      return;
    }

    console.log('🔄 [PROFILE_LOADER] ===== STARTING PROFILE LOAD =====');
    console.log('🔄 [PROFILE_LOADER] Loading profile for user:', userId);
    
    isLoadingProfile.current = true;
    lastUserId.current = userId;
    setIsProfileLoaded(false);
    
    // Get cached profile first
    const cachedProfile = getProfileFromCache(userId);
    console.log('🔄 [PROFILE_LOADER] Cached profile result:', {
      hasCachedProfile: !!cachedProfile,
      cachedAvatarUrl: cachedProfile?.avatar_url
    });
    
    if (cachedProfile) {
      console.log('🔄 [PROFILE_LOADER] ✅ Setting cached profile with avatar:', cachedProfile.avatar_url);
      setCurrentProfile({ ...cachedProfile });
      setIsProfileLoaded(true);
    }
    
    // Always fetch fresh profile data
    console.log('🔄 [PROFILE_LOADER] 🚀 Fetching fresh profile data...');
    prefetchProfile(userId).then(() => {
      const freshProfile = getProfileFromCache(userId);
      console.log('🔄 [PROFILE_LOADER] Fresh profile result:', {
        hasFreshProfile: !!freshProfile,
        freshAvatarUrl: freshProfile?.avatar_url
      });
      
      if (freshProfile) {
        console.log('🔄 [PROFILE_LOADER] ✅ Setting fresh profile with avatar:', freshProfile.avatar_url);
        // CRITICAL: Force state update with new object reference
        setCurrentProfile({ ...freshProfile });
      }
      setIsProfileLoaded(true);
      
      console.log('🔄 [PROFILE_LOADER] ===== PROFILE LOAD COMPLETE =====');
    }).finally(() => {
      isLoadingProfile.current = false;
    });
  }, [userId, prefetchProfile, getProfileFromCache]);

  // Log state changes for debugging
  useEffect(() => {
    console.log('🔄 [PROFILE_LOADER] Profile state updated:', {
      hasCurrentProfile: !!currentProfile,
      avatarUrl: currentProfile?.avatar_url,
      isProfileLoaded,
      timestamp: new Date().toISOString()
    });
  }, [currentProfile, isProfileLoaded]);

  const returnValue = {
    currentProfile,
    setCurrentProfile,
    isProfileLoaded,
    setIsProfileLoaded,
    isLoadingProfile
  };
  
  return returnValue;
};
