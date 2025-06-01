
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getProfile, type Profile } from '@/services/profileService';

export const useProfileData = (effectiveUser: any, renderCount: number, lastLogTime: React.MutableRefObject<number>) => {
  const [profile, setProfile] = useState<Profile | null>(null);

  // STABILIZED: Create display values using useMemo with stable dependencies
  const displayValues = useMemo(() => {
    if (!effectiveUser) return null;

    const displayEmail = effectiveUser?.email;
    const displayPhone = effectiveUser?.phone;
    const displayId = effectiveUser?.id;
    
    let displayName = 'User';
    let displayIdentifier = 'unknown';
    
    if (displayEmail) {
      displayName = profile?.display_name || profile?.username || displayEmail.split('@')[0];
      displayIdentifier = displayEmail;
    } else if (displayPhone) {
      displayName = profile?.display_name || profile?.username || 'Phone User';
      displayIdentifier = displayPhone;
    } else if (displayId) {
      displayName = profile?.display_name || profile?.username || 'User';
      displayIdentifier = displayId.substring(0, 8) + '...';
    }

    return {
      displayName,
      displayIdentifier,
      displayEmail,
      displayPhone,
      displayId,
      avatarUrl: profile?.avatar_url,
      sourceUsed: effectiveUser ? 'EFFECTIVE_USER' : 'NONE'
    };
  }, [effectiveUser, profile?.display_name, profile?.username, profile?.avatar_url]);

  // STABILIZED: Load profile with useCallback to prevent re-renders
  const loadProfile = useCallback(async (userId: string) => {
    try {
      const profileData = await getProfile(userId);
      setProfile(profileData);
      if (renderCount <= 5) {
        console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Profile loaded successfully:', profileData);
      }
    } catch (error) {
      console.error('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Error loading profile:', error);
    }
  }, [renderCount]);

  // Load profile when user ID changes
  useEffect(() => {
    if (effectiveUser?.id && effectiveUser?.id.length > 10) {
      loadProfile(effectiveUser.id);
    }
  }, [effectiveUser?.id, loadProfile]);

  // Log display values periodically
  useEffect(() => {
    const now = Date.now();
    if (displayValues && (now - lastLogTime.current > 10000 || renderCount <= 10)) { // Log display values every 10 seconds or early renders
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: 🔥 DISPLAY VALUES 🔥');
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Display values:', {
        ...displayValues,
        renderCount,
        effectiveUser: !!effectiveUser,
        RENDER_SUCCESS: true,
        timestamp: new Date().toISOString()
      });
    }
  }, [displayValues, effectiveUser, renderCount, lastLogTime]);

  return {
    profile,
    displayValues,
    loadProfile
  };
};
