
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
  const { smartSync, getAllRatings, isHydrated, restoreSessionFromCloud, incrementalSync } = useTrueSkillStore();

  console.log(`🚀 [PERF_SYNC] useCloudSync hook is running at: ${new Date().toISOString()}`);
  console.log(`🚀 [PERF_SYNC] user?.id: ${user?.id || 'UNDEFINED'}`);
  console.log(`🚀 [PERF_SYNC] session?.user?.id: ${session?.user?.id || 'UNDEFINED'}`);
  console.log(`🚀 [PERF_SYNC] isHydrated: ${isHydrated}`);

  // Enhanced auto-sync with incremental sync
  useEffect(() => {
    const syncCheckId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🚀 [PERF_SYNC] ===== ENHANCED SYNC EFFECT TRIGGER CHECK =====`);
    console.log(`🚀 [PERF_SYNC] user?.id: ${user?.id || 'UNDEFINED'}`);
    console.log(`🚀 [PERF_SYNC] session?.user?.id: ${session?.user?.id || 'UNDEFINED'}`);
    console.log(`🚀 [PERF_SYNC] isHydrated: ${isHydrated}`);
    
    const effectiveUserId = user?.id || session?.user?.id;
    console.log(`🚀 [PERF_SYNC] effectiveUserId: ${effectiveUserId || 'UNDEFINED'}`);
    console.log(`🚀 [PERF_SYNC] Both conditions met: ${!!(effectiveUserId && isHydrated)}`);
    
    if (effectiveUserId && isHydrated) {
      console.log(`🚀 [PERF_SYNC] ✅ CONDITIONS MET - TRIGGERING ENHANCED RESTORE SESSION`);
      console.log(`🚀 [PERF_SYNC] User authenticated and hydrated, restoring session with enhanced smart sync`);
      
      const ratingsBeforeSync = getAllRatings();
      const rankedCountBefore = Object.keys(ratingsBeforeSync).length;
      console.log(`🚀 [PERF_SYNC] Local rankings before enhanced sync: ${rankedCountBefore}`);
      
      restoreSessionFromCloud(effectiveUserId);
      
      // Check after sync with a delay
      setTimeout(() => {
        const ratingsAfterSync = getAllRatings();
        const rankedCountAfter = Object.keys(ratingsAfterSync).length;
        console.log(`🚀 [PERF_SYNC] Local rankings after enhanced sync: ${rankedCountAfter}`);
        if (rankedCountAfter !== rankedCountBefore) {
          console.log(`🚀 [PERF_SYNC] RANKING COUNT CHANGED! Before: ${rankedCountBefore}, After: ${rankedCountAfter}`);
        }
      }, 2000);
    } else {
      console.log(`🚀 [PERF_SYNC] ❌ CONDITIONS NOT MET - ENHANCED SYNC WILL NOT RUN`);
      if (!effectiveUserId) {
        console.log(`🚀 [PERF_SYNC] Missing user ID`);
      }
      if (!isHydrated) {
        console.log(`🚀 [PERF_SYNC] Store not hydrated yet`);
      }
    }
    console.log(`🚀 [PERF_SYNC] ===== ENHANCED SYNC EFFECT CHECK COMPLETE =====`);
  }, [user?.id, session?.user?.id, isHydrated, restoreSessionFromCloud, getAllRatings]);

  // Enhanced manual sync function using incremental sync
  const triggerManualSync = useCallback(async () => {
    console.log(`🚀 [PERF_SYNC] ===== ENHANCED MANUAL SYNC TRIGGERED =====`);
    
    const effectiveUserId = user?.id || session?.user?.id;
    
    if (!effectiveUserId) {
      console.log(`🚀 [PERF_SYNC] ❌ No user ID available`);
      toast({
        title: "Sync Failed",
        description: "No user authenticated",
        variant: "destructive"
      });
      return;
    }
    
    if (!isHydrated) {
      console.log(`🚀 [PERF_SYNC] ❌ Store not hydrated`);
      toast({
        title: "Sync Failed", 
        description: "Store not ready",
        variant: "destructive"
      });
      return;
    }
    
    const ratingsBeforeSync = getAllRatings();
    const rankedCountBefore = Object.keys(ratingsBeforeSync).length;
    console.log(`🚀 [PERF_SYNC] Local rankings before enhanced manual sync: ${rankedCountBefore}`);
    
    try {
      // Use incremental sync for much better performance
      await incrementalSync();
      
      const ratingsAfterSync = getAllRatings();
      const rankedCountAfter = Object.keys(ratingsAfterSync).length;
      console.log(`🚀 [PERF_SYNC] Local rankings after enhanced manual sync: ${rankedCountAfter}`);
      
      toast({
        title: "Enhanced Manual Sync Complete",
        description: `Synced with incremental sync (much faster!) - ${rankedCountAfter} rankings`,
        duration: 5000
      });
      
      if (rankedCountAfter !== rankedCountBefore) {
        console.log(`🚀 [PERF_SYNC] RANKING COUNT CHANGED! Before: ${rankedCountBefore}, After: ${rankedCountAfter}`);
      }
    } catch (error) {
      console.error(`🚀 [PERF_SYNC] Enhanced manual sync failed:`, error);
      toast({
        title: "Enhanced Manual Sync Failed",
        description: "Check console for details",
        variant: "destructive"
      });
    }
  }, [user?.id, session?.user?.id, isHydrated, incrementalSync, getAllRatings]);

  const saveBattleToCloud = useCallback(async (battleData: BattleData) => {
    console.log('🚀 [PERF_SYNC] Battle data saved - enhanced auto-sync will handle cloud updates with incremental sync');
    
    // Force incremental sync for battle data (much faster)
    await incrementalSync();
  }, [incrementalSync]);

  const loadBattleFromCloud = useCallback(async (generation: number): Promise<BattleData | null> => {
    if (!isHydrated) {
      return null;
    }
    
    // Use enhanced smart sync
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
    
    console.log('🚀 [PERF_SYNC] Rankings saved - enhanced auto-sync will handle cloud updates with incremental sync');

    // Force incremental sync for rankings (much faster)
    await incrementalSync();

    toast({
      title: "Progress Saved",
      description: "Your rankings have been saved to the cloud with enhanced incremental sync!",
    });
  }, [isHydrated, incrementalSync]);

  const saveSessionToCloud = useCallback(async (sessionId: string, sessionData: any) => {
    // Enhanced auto-sync for session data
    await incrementalSync();
    return isHydrated;
  }, [isHydrated, incrementalSync]);

  const loadSessionFromCloud = useCallback(async (sessionId: string) => {
    if (!isHydrated) {
      return {};
    }
    
    // Use enhanced smart sync
    await smartSync();
    return getAllRatings();
  }, [smartSync, getAllRatings, isHydrated]);

  return {
    saveBattleToCloud,
    loadBattleFromCloud,
    saveRankingsToCloud,
    saveSessionToCloud,
    loadSessionFromCloud,
    triggerManualSync, // Enhanced manual sync function with incremental sync
    isAuthenticated: !!(user || session?.user)
  };
};
