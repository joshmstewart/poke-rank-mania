
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
  const hookInstanceRef = useRef(`profile-cache-${Date.now()}`);

  // Remove excessive logging that's causing spam
  // Only log on major operations, not on every render

  const getCachedProfile = useCallback((userId: string): Profile | null => {
    const cached = cache[userId];
    if (!cached) {
      return null;
    }
    
    // Cache is valid for 5 minutes
    const isExpired = Date.now() - cached.timestamp > 5 * 60 * 1000;
    return isExpired ? null : cached.profile;
  }, [cache]);

  const prefetchProfile = useCallback(async (userId: string) => {
    if (!userId || fetchingRef.current.has(userId)) {
      return;
    }
    
    // Check cache but don't skip if we have data - we might want to refresh
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
    setCache(prev => {
      const newCache = { ...prev };
      delete newCache[userId];
      return newCache;
    });
  }, []);

  return {
    prefetchProfile,
    getProfileFromCache,
    invalidateCache
  };
};
