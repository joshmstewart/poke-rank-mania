import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth/useAuth';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { toast } from '@/hooks/use-toast';

interface BattleData {
  selectedGeneration: number;
  battleType: "pairs" | "triplets";
  battleResults: any[];
  battlesCompleted: number;
  battleHistory: { battle: any[], selected: number[] }[];
  completionPercentage: number;
  fullRankingMode: boolean;
}

export const useCloudSync = () => {
  const { user, session } = useAuth();
  const { smartSync, getAllRatings, isHydrated, restoreSessionFromCloud } = useTrueSkillStore();

  // CRITICAL DEBUG: Always log hook execution
  console.log(`🔍🔍🔍 [CLOUD_SYNC_HOOK_EXECUTION] useCloudSync hook is running at: ${new Date().toISOString()}`);
  console.log(`🔍🔍🔍 [CLOUD_SYNC_HOOK_EXECUTION] user?.id: ${user?.id || 'UNDEFINED'}`);
  console.log(`🔍🔍🔍 [CLOUD_SYNC_HOOK_EXECUTION] session?.user?.id: ${session?.user?.id || 'UNDEFINED'}`);
  console.log(`🔍🔍🔍 [CLOUD_SYNC_HOOK_EXECUTION] isHydrated: ${isHydrated}`);

  // FIXED: Enhanced logging for sync trigger debugging with better dependency tracking
  useEffect(() => {
    const syncCheckId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🔍🔍🔍 [CLOUD_SYNC_DEBUG_${syncCheckId}] ===== SYNC EFFECT TRIGGER CHECK =====`);
    console.log(`🔍🔍🔍 [CLOUD_SYNC_DEBUG_${syncCheckId}] user?.id: ${user?.id || 'UNDEFINED'}`);
    console.log(`🔍🔍🔍 [CLOUD_SYNC_DEBUG_${syncCheckId}] session?.user?.id: ${session?.user?.id || 'UNDEFINED'}`);
    console.log(`🔍🔍🔍 [CLOUD_SYNC_DEBUG_${syncCheckId}] isHydrated: ${isHydrated}`);
    
    const effectiveUserId = user?.id || session?.user?.id;
    console.log(`🔍🔍🔍 [CLOUD_SYNC_DEBUG_${syncCheckId}] effectiveUserId: ${effectiveUserId || 'UNDEFINED'}`);
    console.log(`🔍🔍🔍 [CLOUD_SYNC_DEBUG_${syncCheckId}] Both conditions met: ${!!(effectiveUserId && isHydrated)}`);
    
    if (effectiveUserId && isHydrated) {
      console.log(`🔍🔍🔍 [CLOUD_SYNC_DEBUG_${syncCheckId}] ✅ CONDITIONS MET - TRIGGERING RESTORE SESSION`);
      console.log(`🔍🔍🔍 [CLOUD_SYNC_DEBUG_${syncCheckId}] User authenticated and hydrated, restoring session with smart sync`);
      
      const ratingsBeforeSync = getAllRatings();
      const rankedCountBefore = Object.keys(ratingsBeforeSync).length;
      console.log(`🔍🔍🔍 [CLOUD_SYNC_DEBUG_${syncCheckId}] Local rankings before sync: ${rankedCountBefore}`);
      
      restoreSessionFromCloud(effectiveUserId);
      
      // Check after sync with a delay
      setTimeout(() => {
        const ratingsAfterSync = getAllRatings();
        const rankedCountAfter = Object.keys(ratingsAfterSync).length;
        console.log(`🔍🔍🔍 [CLOUD_SYNC_DEBUG_${syncCheckId}] Local rankings after sync: ${rankedCountAfter}`);
        if (rankedCountAfter !== rankedCountBefore) {
          console.log(`🚨🚨🚨 [CLOUD_SYNC_DEBUG_${syncCheckId}] RANKING COUNT CHANGED! Before: ${rankedCountBefore}, After: ${rankedCountAfter}`);
        }
      }, 2000);
    } else {
      console.log(`🔍🔍🔍 [CLOUD_SYNC_DEBUG_${syncCheckId}] ❌ CONDITIONS NOT MET - SYNC WILL NOT RUN`);
      if (!effectiveUserId) {
        console.log(`🔍🔍🔍 [CLOUD_SYNC_DEBUG_${syncCheckId}] Missing user ID`);
      }
      if (!isHydrated) {
        console.log(`🔍🔍🔍 [CLOUD_SYNC_DEBUG_${syncCheckId}] Store not hydrated yet`);
      }
    }
    console.log(`🔍🔍🔍 [CLOUD_SYNC_DEBUG_${syncCheckId}] ===== SYNC EFFECT CHECK COMPLETE =====`);
  }, [user?.id, session?.user?.id, isHydrated, restoreSessionFromCloud, getAllRatings]);

  // Manual sync function for testing
  const triggerManualSync = useCallback(async () => {
    console.log(`🔧🔧🔧 [MANUAL_SYNC] ===== MANUAL SYNC TRIGGERED =====`);
    
    const effectiveUserId = user?.id || session?.user?.id;
    
    if (!effectiveUserId) {
      console.log(`🔧🔧🔧 [MANUAL_SYNC] ❌ No user ID available`);
      toast({
        title: "Sync Failed",
        description: "No user authenticated",
        variant: "destructive"
      });
      return;
    }
    
    if (!isHydrated) {
      console.log(`🔧🔧🔧 [MANUAL_SYNC] ❌ Store not hydrated`);
      toast({
        title: "Sync Failed", 
        description: "Store not ready",
        variant: "destructive"
      });
      return;
    }
    
    const ratingsBeforeSync = getAllRatings();
    const rankedCountBefore = Object.keys(ratingsBeforeSync).length;
    console.log(`🔧🔧🔧 [MANUAL_SYNC] Local rankings before manual sync: ${rankedCountBefore}`);
    
    try {
      await smartSync();
      
      const ratingsAfterSync = getAllRatings();
      const rankedCountAfter = Object.keys(ratingsAfterSync).length;
      console.log(`🔧🔧🔧 [MANUAL_SYNC] Local rankings after manual sync: ${rankedCountAfter}`);
      
      toast({
        title: "Manual Sync Complete",
        description: `Before: ${rankedCountBefore} rankings, After: ${rankedCountAfter} rankings`,
        duration: 5000
      });
      
      if (rankedCountAfter !== rankedCountBefore) {
        console.log(`🚨🚨🚨 [MANUAL_SYNC] RANKING COUNT CHANGED! Before: ${rankedCountBefore}, After: ${rankedCountAfter}`);
      }
    } catch (error) {
      console.error(`🔧🔧🔧 [MANUAL_SYNC] Manual sync failed:`, error);
      toast({
        title: "Manual Sync Failed",
        description: "Check console for details",
        variant: "destructive"
      });
    }
  }, [user?.id, session?.user?.id, isHydrated, smartSync, getAllRatings]);

  const saveBattleToCloud = useCallback(async (battleData: BattleData) => {
    // Sync is now handled automatically by the store when data changes
    console.log('[CLOUD_SYNC] Battle data saved - auto-sync will handle cloud updates');
  }, []);

  const loadBattleFromCloud = useCallback(async (generation: number): Promise<BattleData | null> => {
    if (!isHydrated) {
      return null;
    }
    
    await smartSync();
    
    const allRatings = getAllRatings();
    const battlesCompleted = Object.values(allRatings).reduce((sum, rating) => sum + rating.battleCount, 0);
    
    return {
      selectedGeneration: generation,
      battleType: "pairs" as const,
      battleResults: [],
      battlesCompleted,
      battleHistory: [],
      completionPercentage: 0,
      fullRankingMode: false
    };
  }, [smartSync, getAllRatings, isHydrated]);

  const saveRankingsToCloud = useCallback(async (rankings: any[], generation: number) => {
    if (!isHydrated) {
      return;
    }
    
    // Sync is now handled automatically by the store
    console.log('[CLOUD_SYNC] Rankings saved - auto-sync will handle cloud updates');

    toast({
      title: "Progress Saved",
      description: "Your rankings have been saved to the cloud!",
    });
  }, [isHydrated]);

  const saveSessionToCloud = useCallback(async (sessionId: string, sessionData: any) => {
    // Sync is now handled automatically by the store
    return isHydrated;
  }, [isHydrated]);

  const loadSessionFromCloud = useCallback(async (sessionId: string) => {
    if (!isHydrated) {
      return {};
    }
    
    await smartSync();
    return getAllRatings();
  }, [smartSync, getAllRatings, isHydrated]);

  return {
    saveBattleToCloud,
    loadBattleFromCloud,
    saveRankingsToCloud,
    saveSessionToCloud,
    loadSessionFromCloud,
    triggerManualSync, // New manual sync function
    isAuthenticated: !!(user || session?.user)
  };
};
