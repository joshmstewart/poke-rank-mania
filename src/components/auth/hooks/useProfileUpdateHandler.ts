
import { useEffect } from 'react';
import { useProfileCache } from './useProfileCache';

interface UseProfileUpdateHandlerProps {
  userId: string | undefined;
  currentProfile: any;
  setCurrentProfile: (profile: any) => void;
  setIsProfileLoaded: (loaded: boolean) => void;
  isLoadingProfile: React.MutableRefObject<boolean>;
}

export const useProfileUpdateHandler = ({
  userId,
  currentProfile,
  setCurrentProfile,
  setIsProfileLoaded,
  isLoadingProfile
}: UseProfileUpdateHandlerProps) => {
  const { prefetchProfile, getProfileFromCache, invalidateCache } = useProfileCache();

  useEffect(() => {
    const handleProfileUpdate = async (event: CustomEvent) => {
      console.log('🔄 [PROFILE_UPDATE_HANDLER] ===== PROFILE UPDATE EVENT =====');
      console.log('🔄 [PROFILE_UPDATE_HANDLER] Profile updated event received:', event.detail);
      console.log('🔄 [PROFILE_UPDATE_HANDLER] Event detail avatar_url:', event.detail?.avatar_url);
      console.log('🔄 [PROFILE_UPDATE_HANDLER] Event detail timestamp:', event.detail?.timestamp);
      
      if (userId && !isLoadingProfile.current) {
        console.log('🔄 [PROFILE_UPDATE_HANDLER] 🚀 PROCESSING PROFILE UPDATE - FORCING FRESH FETCH');
        
        // Immediately invalidate cache to ensure we don't use stale data
        invalidateCache(userId);
        
        // CRITICAL FIX: Use the event data directly first, then fetch fresh
        if (event.detail && event.detail.avatar_url !== undefined) {
          console.log('🔄 [PROFILE_UPDATE_HANDLER] 🎯 Using FRESH event data directly');
          const updatedProfile = {
            ...currentProfile,
            id: userId,
            avatar_url: event.detail.avatar_url,
            username: event.detail.username || currentProfile?.username,
            display_name: event.detail.display_name || currentProfile?.display_name,
            updated_at: event.detail.timestamp
          };
          
          console.log('🔄 [PROFILE_UPDATE_HANDLER] 🎯 Setting profile from event data with avatar:', updatedProfile.avatar_url);
          setCurrentProfile(updatedProfile);
          setIsProfileLoaded(true);
        }
        
        // Also fetch fresh data to ensure cache is updated
        isLoadingProfile.current = true;
        
        try {
          // Small delay to ensure database consistency
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Fetch completely fresh profile data
          await prefetchProfile(userId);
          const freshProfile = getProfileFromCache(userId);
          
          if (freshProfile) {
            console.log('🔄 [PROFILE_UPDATE_HANDLER] 🎯 FINAL: Setting fresh profile with avatar:', freshProfile.avatar_url);
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
  }, [userId, getProfileFromCache, prefetchProfile, invalidateCache, currentProfile, setCurrentProfile, setIsProfileLoaded, isLoadingProfile]);
};
