
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
    console.log('🔍 [PROFILE_CACHE] getCachedProfile called for userId:', userId);
    const cached = cache[userId];
    if (!cached) {
      console.log('🔍 [PROFILE_CACHE] No cached profile found');
      return null;
    }
    
    // Cache is valid for 5 minutes
    const isExpired = Date.now() - cached.timestamp > 5 * 60 * 1000;
    console.log('🔍 [PROFILE_CACHE] Cache expired?', isExpired);
    const result = isExpired ? null : cached.profile;
    console.log('🔍 [PROFILE_CACHE] Returning cached profile:', result);
    return result;
  }, [cache]);

  const prefetchProfile = useCallback(async (userId: string) => {
    console.log('🔄 [PROFILE_CACHE] ===== PREFETCH PROFILE START =====');
    console.log('🔄 [PROFILE_CACHE] User ID:', userId);
    console.log('🔄 [PROFILE_CACHE] Currently fetching?', fetchingRef.current.has(userId));
    
    if (!userId || fetchingRef.current.has(userId)) {
      console.log('🔄 [PROFILE_CACHE] Skipping - no userId or already fetching');
      return;
    }
    
    const cached = getCachedProfile(userId);
    if (cached !== null) {
      console.log('🔄 [PROFILE_CACHE] Valid cache exists, skipping fetch');
      return;
    }
    
    console.log('🔄 [PROFILE_CACHE] Starting fresh fetch...');
    fetchingRef.current.add(userId);
    
    try {
      console.log('🔄 [PROFILE_CACHE] Calling getProfile...');
      const profile = await getProfile(userId);
      console.log('🔄 [PROFILE_CACHE] getProfile returned:', profile);
      
      setCache(prev => {
        const newCache = {
          ...prev,
          [userId]: {
            profile,
            timestamp: Date.now(),
            loading: false
          }
        };
        console.log('🔄 [PROFILE_CACHE] Cache updated:', newCache);
        return newCache;
      });
      console.log('🔄 [PROFILE_CACHE] Profile cache updated successfully');
    } catch (error) {
      console.error('❌ [PROFILE_CACHE] Profile prefetch error:', error);
    } finally {
      console.log('🔄 [PROFILE_CACHE] Removing from fetching set');
      fetchingRef.current.delete(userId);
      console.log('🔄 [PROFILE_CACHE] ===== PREFETCH PROFILE END =====');
    }
  }, [getCachedProfile]);

  const getProfileFromCache = useCallback((userId: string): Profile | null => {
    console.log('📖 [PROFILE_CACHE] getProfileFromCache called for userId:', userId);
    const result = getCachedProfile(userId);
    console.log('📖 [PROFILE_CACHE] Returning:', result);
    return result;
  }, [getCachedProfile]);

  return {
    prefetchProfile,
    getProfileFromCache
  };
};
