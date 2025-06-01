
import { useState, useEffect, useMemo } from 'react';
import { useProfileCache } from './useProfileCache';
import type { Profile } from '@/services/profileService';

export const useOptimizedProfileData = (effectiveUser: any) => {
  const { getProfileFromCache } = useProfileCache();
  const [profile, setProfile] = useState<Profile | null>(null);

  // Get cached profile immediately
  const cachedProfile = useMemo(() => {
    if (!effectiveUser?.id) return null;
    return getProfileFromCache(effectiveUser.id);
  }, [effectiveUser?.id, getProfileFromCache]);

  // Update profile state when cache changes
  useEffect(() => {
    if (cachedProfile !== null) {
      setProfile(cachedProfile);
    }
  }, [cachedProfile]);

  // Create optimized display values
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
      sourceUsed: 'OPTIMIZED_CACHE'
    };
  }, [effectiveUser, profile?.display_name, profile?.username, profile?.avatar_url]);

  return {
    profile,
    displayValues
  };
};
