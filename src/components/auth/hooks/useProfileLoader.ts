
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
    console.log('🔄 [PROFILE_LOADER] 🎯 CACHED PROFILE ANALYSIS:', {
      hasCachedProfile: !!cachedProfile,
      cachedProfileType: typeof cachedProfile,
      cachedProfileIsNull: cachedProfile === null,
      cachedProfileId: cachedProfile?.id?.substring(0, 8),
      cachedAvatarUrl: cachedProfile?.avatar_url,
      cachedAvatarUrlType: typeof cachedProfile?.avatar_url,
      cachedAvatarUrlLength: cachedProfile?.avatar_url?.length || 0,
      fullCachedProfile: cachedProfile ? JSON.stringify(cachedProfile, null, 2) : 'NULL_OR_UNDEFINED'
    });
    
    if (cachedProfile) {
      console.log('🔄 [PROFILE_LOADER] ✅ Setting cached profile with avatar:', cachedProfile.avatar_url);
      const profileWithNewReference = { ...cachedProfile };
      console.log('🔄 [PROFILE_LOADER] 🎯 SETTING CURRENT PROFILE TO:', {
        profileId: profileWithNewReference.id?.substring(0, 8),
        avatarUrl: profileWithNewReference.avatar_url,
        avatarUrlType: typeof profileWithNewReference.avatar_url,
        avatarUrlLength: profileWithNewReference.avatar_url?.length || 0,
        timestamp: new Date().toISOString()
      });
      setCurrentProfile(profileWithNewReference);
      setIsProfileLoaded(true);
    }
    
    // Always fetch fresh profile data
    console.log('🔄 [PROFILE_LOADER] 🚀 Fetching fresh profile data...');
    prefetchProfile(userId).then(() => {
      const freshProfile = getProfileFromCache(userId);
      console.log('🔄 [PROFILE_LOADER] 🎯 FRESH PROFILE ANALYSIS:', {
        hasFreshProfile: !!freshProfile,
        freshProfileType: typeof freshProfile,
        freshProfileIsNull: freshProfile === null,
        freshProfileId: freshProfile?.id?.substring(0, 8),
        freshAvatarUrl: freshProfile?.avatar_url,
        freshAvatarUrlType: typeof freshProfile?.avatar_url,
        freshAvatarUrlLength: freshProfile?.avatar_url?.length || 0,
        fullFreshProfile: freshProfile ? JSON.stringify(freshProfile, null, 2) : 'NULL_OR_UNDEFINED'
      });
      
      if (freshProfile) {
        console.log('🔄 [PROFILE_LOADER] ✅ Setting fresh profile with avatar:', freshProfile.avatar_url);
        const freshProfileWithNewReference = { ...freshProfile };
        console.log('🔄 [PROFILE_LOADER] 🎯 SETTING CURRENT PROFILE TO (FRESH):', {
          profileId: freshProfileWithNewReference.id?.substring(0, 8),
          avatarUrl: freshProfileWithNewReference.avatar_url,
          avatarUrlType: typeof freshProfileWithNewReference.avatar_url,
          avatarUrlLength: freshProfileWithNewReference.avatar_url?.length || 0,
          timestamp: new Date().toISOString()
        });
        setCurrentProfile(freshProfileWithNewReference);
      }
      setIsProfileLoaded(true);
      
      console.log('🔄 [PROFILE_LOADER] ===== PROFILE LOAD COMPLETE =====');
    }).finally(() => {
      isLoadingProfile.current = false;
    });
  }, [userId, prefetchProfile, getProfileFromCache]);

  // CRITICAL: Log every single state change
  useEffect(() => {
    console.log('🔄 [PROFILE_LOADER] 🚨🚨🚨 PROFILE STATE CHANGED 🚨🚨🚨');
    console.log('🔄 [PROFILE_LOADER] Profile state updated:', {
      hasCurrentProfile: !!currentProfile,
      currentProfileType: typeof currentProfile,
      currentProfileIsNull: currentProfile === null,
      currentProfileId: currentProfile?.id?.substring(0, 8),
      avatarUrl: currentProfile?.avatar_url,
      avatarUrlType: typeof currentProfile?.avatar_url,
      avatarUrlLength: currentProfile?.avatar_url?.length || 0,
      isProfileLoaded,
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack?.split('\n').slice(0, 5).join('\n')
    });
  }, [currentProfile, isProfileLoaded]);

  const returnValue = {
    currentProfile,
    setCurrentProfile,
    isProfileLoaded,
    setIsProfileLoaded,
    isLoadingProfile
  };
  
  console.log('🔄 [PROFILE_LOADER] 🎯 RETURNING PROFILE DATA:', {
    hasCurrentProfile: !!returnValue.currentProfile,
    currentProfileAvatarUrl: returnValue.currentProfile?.avatar_url,
    isProfileLoaded: returnValue.isProfileLoaded,
    timestamp: new Date().toISOString()
  });
  
  return returnValue;
};
