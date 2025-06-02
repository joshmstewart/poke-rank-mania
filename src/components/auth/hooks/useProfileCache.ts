
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
    if (!cached) {
      console.log('🎯 [PROFILE_CACHE] No cache entry for user:', userId);
      return null;
    }
    
    // Cache is valid for 2 minutes (shorter for more frequent updates)
    const isExpired = Date.now() - cached.timestamp > 2 * 60 * 1000;
    if (isExpired) {
      console.log('🎯 [PROFILE_CACHE] Cache expired for user:', userId);
      return null;
    }
    
    console.log('🎯 [PROFILE_CACHE] Returning cached profile for user:', userId, 'with avatar:', cached.profile?.avatar_url);
    return cached.profile;
  }, [cache]);

  const prefetchProfile = useCallback(async (userId: string): Promise<void> => {
    if (!userId || fetchingRef.current.has(userId)) {
      console.log('🎯 [PROFILE_CACHE] Skipping prefetch - no userId or already fetching:', userId);
      return;
    }
    
    fetchingRef.current.add(userId);
    console.log('🎯 [PROFILE_CACHE] Starting prefetch for user:', userId);
    
    // Set loading state
    setCache(prev => ({
      ...prev,
      [userId]: {
        profile: prev[userId]?.profile || null,
        timestamp: Date.now(),
        loading: true
      }
    }));
    
    try {
      console.log('🎯 [PROFILE_CACHE] Fetching fresh profile for:', userId);
      const profile = await getProfile(userId);
      
      console.log('🎯 [PROFILE_CACHE] Fresh profile received for:', userId, 'with avatar:', profile?.avatar_url);
      
      setCache(prev => ({
        ...prev,
        [userId]: {
          profile,
          timestamp: Date.now(),
          loading: false
        }
      }));
    } catch (error) {
      console.error('❌ [PROFILE_CACHE] Profile prefetch error for user:', userId, error);
      setCache(prev => ({
        ...prev,
        [userId]: {
          profile: prev[userId]?.profile || null,
          timestamp: Date.now(),
          loading: false
        }
      }));
    } finally {
      fetchingRef.current.delete(userId);
      console.log('🎯 [PROFILE_CACHE] Prefetch completed for user:', userId);
    }
  }, []);

  const getProfileFromCache = useCallback((userId: string): Profile | null => {
    const cachedProfile = getCachedProfile(userId);
    console.log('🎯 [PROFILE_CACHE] getProfileFromCache called for:', userId, 'returning:', cachedProfile?.avatar_url || 'NO_AVATAR');
    return cachedProfile;
  }, [getCachedProfile]);

  const invalidateCache = useCallback((userId: string) => {
    console.log('🎯 [PROFILE_CACHE] 🔥 INVALIDATING CACHE for user:', userId);
    setCache(prev => {
      const newCache = { ...prev };
      delete newCache[userId];
      return newCache;
    });
    
    // Also remove from fetching set to allow immediate refetch
    fetchingRef.current.delete(userId);
    console.log('🎯 [PROFILE_CACHE] 🔥 Cache invalidated and fetching cleared for user:', userId);
  }, []);

  return {
    prefetchProfile,
    getProfileFromCache,
    invalidateCache
  };
};
