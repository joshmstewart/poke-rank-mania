
import { useState, useCallback, useRef } from 'react';
import { getProfile, type Profile } from '@/services/profileService';

interface ProfileCache {
  [userId: string]: {
    profile: Profile | null;
    timestamp: number;
    loading: boolean;
  };
}

export const useProfileCache = () => {
  const [cache, setCache] = useState<ProfileCache>({});
  const fetchingRef = useRef<Set<string>>(new Set());

  const getCachedProfile = useCallback((userId: string): Profile | null => {
    const cached = cache[userId];
    if (!cached) return null;
    
    // Cache is valid for 5 minutes
    const isExpired = Date.now() - cached.timestamp > 5 * 60 * 1000;
    return isExpired ? null : cached.profile;
  }, [cache]);

  const prefetchProfile = useCallback(async (userId: string) => {
    if (!userId || fetchingRef.current.has(userId)) return;
    
    const cached = getCachedProfile(userId);
    if (cached !== null) return; // Already cached and valid
    
    fetchingRef.current.add(userId);
    
    try {
      const profile = await getProfile(userId);
      setCache(prev => ({
        ...prev,
        [userId]: {
          profile,
          timestamp: Date.now(),
          loading: false
        }
      }));
    } catch (error) {
      console.error('Profile prefetch error:', error);
    } finally {
      fetchingRef.current.delete(userId);
    }
  }, [getCachedProfile]);

  const getProfileFromCache = useCallback((userId: string): Profile | null => {
    return getCachedProfile(userId);
  }, [getCachedProfile]);

  return {
    prefetchProfile,
    getProfileFromCache
  };
};
