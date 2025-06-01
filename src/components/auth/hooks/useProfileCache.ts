
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
      return null;
    }
    
    // Cache is valid for 5 minutes
    const isExpired = Date.now() - cached.timestamp > 5 * 60 * 1000;
    return isExpired ? null : cached.profile;
  }, [cache]);

  const prefetchProfile = useCallback(async (userId: string): Promise<void> => {
    if (!userId || fetchingRef.current.has(userId)) {
      return;
    }
    
    const cached = getCachedProfile(userId);
    
    fetchingRef.current.add(userId);
    
    // Set loading state
    setCache(prev => ({
      ...prev,
      [userId]: {
        profile: cached,
        timestamp: cached ? prev[userId]?.timestamp || Date.now() : Date.now(),
        loading: true
      }
    }));
    
    try {
      console.log('🎯 [PROFILE_CACHE] Fetching fresh profile for:', userId);
      const profile = await getProfile(userId);
      
      console.log('🎯 [PROFILE_CACHE] Fresh profile received:', profile?.avatar_url);
      
      setCache(prev => ({
        ...prev,
        [userId]: {
          profile,
          timestamp: Date.now(),
          loading: false
        }
      }));
    } catch (error) {
      console.error('❌ [PROFILE_CACHE] Profile prefetch error:', error);
      setCache(prev => ({
        ...prev,
        [userId]: {
          profile: cached,
          timestamp: cached ? prev[userId]?.timestamp || Date.now() : Date.now(),
          loading: false
        }
      }));
    } finally {
      fetchingRef.current.delete(userId);
    }
  }, [getCachedProfile]);

  const getProfileFromCache = useCallback((userId: string): Profile | null => {
    return getCachedProfile(userId);
  }, [getCachedProfile]);

  const invalidateCache = useCallback((userId: string) => {
    console.log('🎯 [PROFILE_CACHE] Invalidating cache for user:', userId);
    setCache(prev => {
      const newCache = { ...prev };
      delete newCache[userId];
      return newCache;
    });
    
    // Also remove from fetching set to allow immediate refetch
    fetchingRef.current.delete(userId);
  }, []);

  return {
    prefetchProfile,
    getProfileFromCache,
    invalidateCache
  };
};
