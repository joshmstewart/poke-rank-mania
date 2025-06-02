
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
      console.log('🔄 [PROFILE_UPDATE_HANDLER] ===== PROFILE UPDATE EVENT RECEIVED =====');
      console.log('🔄 [PROFILE_UPDATE_HANDLER] Event detail:', event.detail);
      console.log('🔄 [PROFILE_UPDATE_HANDLER] Current userId:', userId);
      console.log('🔄 [PROFILE_UPDATE_HANDLER] Is loading:', isLoadingProfile.current);
      
      if (userId && !isLoadingProfile.current && event.detail) {
        console.log('🔄 [PROFILE_UPDATE_HANDLER] 🚀 PROCESSING PROFILE UPDATE');
        
        // IMMEDIATE UPDATE: Use event data directly for instant UI feedback
        const updatedProfile = {
          ...currentProfile,
          id: userId,
          avatar_url: event.detail.avatar_url,
          username: event.detail.username,
          display_name: event.detail.display_name,
          updated_at: event.detail.timestamp
        };
        
        console.log('🔄 [PROFILE_UPDATE_HANDLER] 🎯 IMMEDIATE: Setting profile from event data');
        console.log('🔄 [PROFILE_UPDATE_HANDLER] 🎯 IMMEDIATE: Avatar URL:', updatedProfile.avatar_url);
        setCurrentProfile(updatedProfile);
        setIsProfileLoaded(true);
        
        // BACKGROUND REFRESH: Invalidate cache and fetch fresh data without waiting
        console.log('🔄 [PROFILE_UPDATE_HANDLER] 🔄 BACKGROUND: Starting fresh data fetch');
        invalidateCache(userId);
        
        // Don't await this - let it happen in background
        prefetchProfile(userId).then(() => {
          const freshProfile = getProfileFromCache(userId);
          if (freshProfile) {
            console.log('🔄 [PROFILE_UPDATE_HANDLER] 🔄 BACKGROUND: Fresh profile fetched');
            console.log('🔄 [PROFILE_UPDATE_HANDLER] 🔄 BACKGROUND: Avatar URL:', freshProfile.avatar_url);
            setCurrentProfile(freshProfile);
          }
        }).catch(error => {
          console.error('🔄 [PROFILE_UPDATE_HANDLER] Background fetch error:', error);
        });
      } else {
        console.log('🔄 [PROFILE_UPDATE_HANDLER] Skipping update - conditions not met');
      }
    };

    console.log('🔄 [PROFILE_UPDATE_HANDLER] Adding profile-updated event listener');
    window.addEventListener('profile-updated', handleProfileUpdate as EventListener);
    
    return () => {
      console.log('🔄 [PROFILE_UPDATE_HANDLER] Removing profile-updated event listener');
      window.removeEventListener('profile-updated', handleProfileUpdate as EventListener);
    };
  }, [userId, getProfileFromCache, prefetchProfile, invalidateCache, currentProfile, setCurrentProfile, setIsProfileLoaded, isLoadingProfile]);
};
