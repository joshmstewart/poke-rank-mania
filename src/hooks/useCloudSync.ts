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
  const isHydrated = useTrueSkillStore(state => state.isHydrated);

  console.log(`🚨🚨🚨 [SYNC_AUDIT] useCloudSync hook is running at: ${new Date().toISOString()}`);
  console.log(`🚨🚨🚨 [SYNC_AUDIT] user?.id: ${user?.id || 'UNDEFINED'}`);
  console.log(`🚨🚨🚨 [SYNC_AUDIT] session?.user?.id: ${session?.user?.id || 'UNDEFINED'}`);
  console.log(`🚨🚨🚨 [SYNC_AUDIT] isHydrated: ${isHydrated}`);

  // PREDICTABLE FLOW: Load local first, then sync with cloud in background
  useEffect(() => {
    const effectiveUserId = user?.id || session?.user?.id;
    console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== PREDICTABLE SYNC FLOW =====`);
    console.log(`🚨🚨🚨 [SYNC_AUDIT] effectiveUserId: ${effectiveUserId || 'UNDEFINED'}`);
    console.log(`🚨🚨🚨 [SYNC_AUDIT] isHydrated: ${isHydrated}`);
    
    if (effectiveUserId && isHydrated) {
      const { smartSync, getAllRatings } = useTrueSkillStore.getState();
      console.log(`🚨🚨🚨 [SYNC_AUDIT] ✅ STARTING PREDICTABLE SYNC FLOW`);
      console.log(`🚨🚨🚨 [SYNC_AUDIT] Step 1: Local data already loaded (hydrated)`);
      console.log(`🚨🚨🚨 [SYNC_AUDIT] Step 2: Starting background cloud sync`);
      
      const ratingsBeforeSync = getAllRatings();
      const rankedCountBefore = Object.keys(ratingsBeforeSync).length;
      console.log(`🚨🚨🚨 [SYNC_AUDIT] Local rankings before sync: ${rankedCountBefore}`);
      
      // Show subtle sync indicator
      toast({
        title: "Syncing...",
        description: "Checking for updates from your other devices",
        duration: 2000
      });
      
      // Perform background sync with timestamp-based merging
      smartSync().then(() => {
        const ratingsAfterSync = getAllRatings();
        const rankedCountAfter = Object.keys(ratingsAfterSync).length;
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Local rankings after sync: ${rankedCountAfter}`);
        
        if (rankedCountAfter !== rankedCountBefore) {
          console.log(`🚨🚨🚨 [SYNC_AUDIT] RANKING COUNT CHANGED! Before: ${rankedCountBefore}, After: ${rankedCountAfter}`);
          toast({
            title: "Sync Complete",
            description: `Updated with ${rankedCountAfter - rankedCountBefore} changes from your other devices`,
            duration: 3000
          });
        } else {
          console.log(`🚨🚨🚨 [SYNC_AUDIT] No changes from cloud`);
        }
      }).catch(error => {
        console.error(`🚨🚨🚨 [SYNC_AUDIT] Background sync failed:`, error);
        // Don't show error toast for background sync failures
      });
    } else {
      console.log(`🚨🚨🚨 [SYNC_AUDIT] ❌ CONDITIONS NOT MET - SYNC WILL NOT RUN`);
      if (!effectiveUserId) {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Missing user ID`);
      }
      if (!isHydrated) {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] Store not hydrated yet`);
      }
    }
    console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== SYNC FLOW COMPLETE =====`);
  }, [user?.id, session?.user?.id, isHydrated]);

  // Manual sync function for testing
  const triggerManualSync = useCallback(async () => {
    const { smartSync, getAllRatings } = useTrueSkillStore.getState();
    console.log(`🚨🚨🚨 [SYNC_AUDIT] ===== MANUAL SYNC TRIGGERED =====`);
    
    const effectiveUserId = user?.id || session?.user?.id;
    
    if (!effectiveUserId) {
      console.log(`🚨🚨🚨 [SYNC_AUDIT] ❌ No user ID available`);
      toast({
        title: "Sync Failed",
        description: "No user authenticated",
        variant: "destructive"
      });
      return;
    }
    
    if (!isHydrated) {
      console.log(`🚨🚨🚨 [SYNC_AUDIT] ❌ Store not hydrated`);
      toast({
        title: "Sync Failed", 
        description: "Store not ready",
        variant: "destructive"
      });
      return;
    }
    
    const ratingsBeforeSync = getAllRatings();
    const rankedCountBefore = Object.keys(ratingsBeforeSync).length;
    console.log(`🚨🚨🚨 [SYNC_AUDIT] Local rankings before manual sync: ${rankedCountBefore}`);
    
    try {
      await smartSync();
      
      const ratingsAfterSync = getAllRatings();
      const rankedCountAfter = Object.keys(ratingsAfterSync).length;
      console.log(`🚨🚨🚨 [SYNC_AUDIT] Local rankings after manual sync: ${rankedCountAfter}`);
      
      toast({
        title: "Manual Sync Complete",
        description: `Before: ${rankedCountBefore} rankings, After: ${rankedCountAfter} rankings`,
        duration: 5000
      });
      
      if (rankedCountAfter !== rankedCountBefore) {
        console.log(`🚨🚨🚨 [SYNC_AUDIT] RANKING COUNT CHANGED! Before: ${rankedCountBefore}, After: ${rankedCountAfter}`);
      }
    } catch (error) {
      console.error(`🚨🚨🚨 [SYNC_AUDIT] Manual sync failed:`, error);
      toast({
        title: "Manual Sync Failed",
        description: "Check console for details",
        variant: "destructive"
      });
    }
  }, [user?.id, session?.user?.id, isHydrated]);

  const saveBattleToCloud = useCallback(async (battleData: BattleData) => {
    console.log('🚨🚨🚨 [SYNC_AUDIT] Battle data saved - auto-sync will handle cloud updates');
  }, []);

  const loadBattleFromCloud = useCallback(async (generation: number): Promise<BattleData | null> => {
    if (!isHydrated) {
      return null;
    }
    
    const { smartSync, getAllRatings } = useTrueSkillStore.getState();
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
  }, [isHydrated]);

  const saveRankingsToCloud = useCallback(async (rankings: any[], generation: number) => {
    if (!isHydrated) {
      return;
    }
    
    console.log('🚨🚨🚨 [SYNC_AUDIT] Rankings saved - auto-sync will handle cloud updates');

    toast({
      title: "Progress Saved",
      description: "Your rankings have been saved to the cloud!",
    });
  }, [isHydrated]);

  const saveSessionToCloud = useCallback(async (sessionId: string, sessionData: any) => {
    return isHydrated;
  }, [isHydrated]);

  const loadSessionFromCloud = useCallback(async (sessionId: string) => {
    if (!isHydrated) {
      return {};
    }
    
    const { smartSync, getAllRatings } = useTrueSkillStore.getState();
    await smartSync();
    return getAllRatings();
  }, [isHydrated]);

  return {
    saveBattleToCloud,
    loadBattleFromCloud,
    saveRankingsToCloud,
    saveSessionToCloud,
    loadSessionFromCloud,
    triggerManualSync,
    isAuthenticated: !!(user || session?.user)
  };
};
