
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

    console.log('🔄 [PROFILE_LOADER] ===== STARTING PROFILE LOAD =====');
    console.log('🔄 [PROFILE_LOADER] Loading profile for user:', userId);
    
    isLoadingProfile.current = true;
    lastUserId.current = userId;
    setIsProfileLoaded(false);
    
    // Get cached profile first
    const cachedProfile = getProfileFromCache(userId);
    console.log('🔄 [PROFILE_LOADER] 🎯 CACHED PROFILE RESULT:', {
      hasCachedProfile: !!cachedProfile,
      cachedAvatarUrl: cachedProfile?.avatar_url,
      cachedDisplayName: cachedProfile?.display_name,
      cachedUsername: cachedProfile?.username,
      fullCachedProfile: cachedProfile
    });
    
    if (cachedProfile) {
      console.log('🔄 [PROFILE_LOADER] ✅ SETTING CACHED PROFILE - Avatar:', cachedProfile.avatar_url);
      console.log('🔄 [PROFILE_LOADER] 🚨 STATE UPDATE: setCurrentProfile with cached data');
      setCurrentProfile(cachedProfile);
      setIsProfileLoaded(true);
    }
    
    // Always fetch fresh profile data
    console.log('🔄 [PROFILE_LOADER] 🚀 FETCHING FRESH PROFILE DATA...');
    prefetchProfile(userId).then(() => {
      const freshProfile = getProfileFromCache(userId);
      console.log('🔄 [PROFILE_LOADER] 🎯 FRESH PROFILE RESULT:', {
        hasFreshProfile: !!freshProfile,
        freshAvatarUrl: freshProfile?.avatar_url,
        freshDisplayName: freshProfile?.display_name,
        freshUsername: freshProfile?.username,
        fullFreshProfile: freshProfile
      });
      
      if (freshProfile) {
        console.log('🔄 [PROFILE_LOADER] ✅ SETTING FRESH PROFILE - Avatar:', freshProfile.avatar_url);
        console.log('🔄 [PROFILE_LOADER] 🚨 STATE UPDATE: setCurrentProfile with fresh data');
        console.log('🔄 [PROFILE_LOADER] 🚨 FRESH PROFILE FULL OBJECT:', JSON.stringify(freshProfile, null, 2));
        
        // CRITICAL FIX: Force state update with a new object reference
        setCurrentProfile({ ...freshProfile });
      }
      setIsProfileLoaded(true);
      
      console.log('🔄 [PROFILE_LOADER] ===== PROFILE LOAD COMPLETE =====');
    }).finally(() => {
      isLoadingProfile.current = false;
    });
  }, [userId, prefetchProfile, getProfileFromCache]);

  // CRITICAL: Add logging whenever currentProfile state actually changes
  useEffect(() => {
    console.log('🔄 [PROFILE_LOADER] 🚨🚨🚨 CURRENT PROFILE STATE CHANGE DETECTED 🚨🚨🚨');
    console.log('🔄 [PROFILE_LOADER] 📊 NEW CURRENT PROFILE STATE:', {
      hasCurrentProfile: !!currentProfile,
      currentProfileType: typeof currentProfile,
      currentProfileIsNull: currentProfile === null,
      currentProfileIsUndefined: currentProfile === undefined,
      currentProfileAvatarUrl: currentProfile?.avatar_url,
      currentProfileDisplayName: currentProfile?.display_name,
      currentProfileUsername: currentProfile?.username,
      isProfileLoaded,
      timestamp: new Date().toISOString(),
      fullCurrentProfileObject: currentProfile ? JSON.stringify(currentProfile, null, 2) : 'NULL/UNDEFINED'
    });
    
    // CRITICAL: Log what we're about to return to the consuming component
    console.log('🔄 [PROFILE_LOADER] 🎯 ABOUT TO RETURN TO COMPONENT:', {
      willReturnProfile: !!currentProfile,
      willReturnAvatarUrl: currentProfile?.avatar_url,
      willReturnLoaded: isProfileLoaded
    });
  }, [currentProfile, isProfileLoaded]);

  // CRITICAL: Log every time the hook returns values
  const returnValue = {
    currentProfile,
    setCurrentProfile,
    isProfileLoaded,
    setIsProfileLoaded,
    isLoadingProfile
  };
  
  console.log('🔄 [PROFILE_LOADER] 🎯 HOOK RETURN VALUES:', {
    returningProfile: !!returnValue.currentProfile,
    returningAvatarUrl: returnValue.currentProfile?.avatar_url,
    returningLoaded: returnValue.isProfileLoaded,
    timestamp: new Date().toISOString()
  });

  return returnValue;
};
