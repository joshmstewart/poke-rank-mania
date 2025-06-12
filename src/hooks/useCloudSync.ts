
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
  const { smartSync, getAllRatings, isHydrated, restoreSessionFromCloud, syncToCloud } = useTrueSkillStore();

  // PHASE 2: Enhanced sync audit logging
  console.log(`🚨🚨🚨 [SYNC_AUDIT_PHASE2] useCloudSync hook is running at: ${new Date().toISOString()}`);
  console.log(`🚨🚨🚨 [SYNC_AUDIT_PHASE2] user?.id: ${user?.id || 'UNDEFINED'}`);
  console.log(`🚨🚨🚨 [SYNC_AUDIT_PHASE2] session?.user?.id: ${session?.user?.id || 'UNDEFINED'}`);
  console.log(`🚨🚨🚨 [SYNC_AUDIT_PHASE2] isHydrated: ${isHydrated}`);

  // PHASE 2: Enhanced auto-sync with conflict resolution
  useEffect(() => {
    const syncCheckId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🚨🚨🚨 [SYNC_AUDIT_PHASE2] ===== ENHANCED SYNC EFFECT TRIGGER CHECK =====`);
    console.log(`🚨🚨🚨 [SYNC_AUDIT_PHASE2] user?.id: ${user?.id || 'UNDEFINED'}`);
    console.log(`🚨🚨🚨 [SYNC_AUDIT_PHASE2] session?.user?.id: ${session?.user?.id || 'UNDEFINED'}`);
    console.log(`🚨🚨🚨 [SYNC_AUDIT_PHASE2] isHydrated: ${isHydrated}`);
    
    const effectiveUserId = user?.id || session?.user?.id;
    console.log(`🚨🚨🚨 [SYNC_AUDIT_PHASE2] effectiveUserId: ${effectiveUserId || 'UNDEFINED'}`);
    console.log(`🚨🚨🚨 [SYNC_AUDIT_PHASE2] Both conditions met: ${!!(effectiveUserId && isHydrated)}`);
    
    if (effectiveUserId && isHydrated) {
      console.log(`🚨🚨🚨 [SYNC_AUDIT_PHASE2] ✅ CONDITIONS MET - TRIGGERING ENHANCED RESTORE SESSION`);
      console.log(`🚨🚨🚨 [SYNC_AUDIT_PHASE2] User authenticated and hydrated, restoring session with enhanced smart sync`);
      
      const ratingsBeforeSync = getAllRatings();
      const rankedCountBefore = Object.keys(ratingsBeforeSync).length;
      console.log(`🚨🚨🚨 [SYNC_AUDIT_PHASE2] Local rankings before enhanced sync: ${rankedCountBefore}`);
      
      restoreSessionFromCloud(effectiveUserId);
      
      // Check after sync with a delay
      setTimeout(() => {
        const ratingsAfterSync = getAllRatings();
        const rankedCountAfter = Object.keys(ratingsAfterSync).length;
        console.log(`🚨🚨🚨 [SYNC_AUDIT_PHASE2] Local rankings after enhanced sync: ${rankedCountAfter}`);
        if (rankedCountAfter !== rankedCountBefore) {
          console.log(`🚨🚨🚨 [SYNC_AUDIT_PHASE2] RANKING COUNT CHANGED! Before: ${rankedCountBefore}, After: ${rankedCountAfter}`);
        }
      }, 2000);
    } else {
      console.log(`🚨🚨🚨 [SYNC_AUDIT_PHASE2] ❌ CONDITIONS NOT MET - ENHANCED SYNC WILL NOT RUN`);
      if (!effectiveUserId) {
        console.log(`🚨🚨🚨 [SYNC_AUDIT_PHASE2] Missing user ID`);
      }
      if (!isHydrated) {
        console.log(`🚨🚨🚨 [SYNC_AUDIT_PHASE2] Store not hydrated yet`);
      }
    }
    console.log(`🚨🚨🚨 [SYNC_AUDIT_PHASE2] ===== ENHANCED SYNC EFFECT CHECK COMPLETE =====`);
  }, [user?.id, session?.user?.id, isHydrated, restoreSessionFromCloud, getAllRatings]);

  // PHASE 3: Enhanced manual sync function for testing
  const triggerManualSync = useCallback(async () => {
    console.log(`🚨🚨🚨 [SYNC_AUDIT_PHASE3] ===== ENHANCED MANUAL SYNC TRIGGERED =====`);
    
    const effectiveUserId = user?.id || session?.user?.id;
    
    if (!effectiveUserId) {
      console.log(`🚨🚨🚨 [SYNC_AUDIT_PHASE3] ❌ No user ID available`);
      toast({
        title: "Sync Failed",
        description: "No user authenticated",
        variant: "destructive"
      });
      return;
    }
    
    if (!isHydrated) {
      console.log(`🚨🚨🚨 [SYNC_AUDIT_PHASE3] ❌ Store not hydrated`);
      toast({
        title: "Sync Failed", 
        description: "Store not ready",
        variant: "destructive"
      });
      return;
    }
    
    const ratingsBeforeSync = getAllRatings();
    const rankedCountBefore = Object.keys(ratingsBeforeSync).length;
    console.log(`🚨🚨🚨 [SYNC_AUDIT_PHASE3] Local rankings before enhanced manual sync: ${rankedCountBefore}`);
    
    try {
      // PHASE 3: Use enhanced smart sync instead of basic sync
      await smartSync();
      
      const ratingsAfterSync = getAllRatings();
      const rankedCountAfter = Object.keys(ratingsAfterSync).length;
      console.log(`🚨🚨🚨 [SYNC_AUDIT_PHASE3] Local rankings after enhanced manual sync: ${rankedCountAfter}`);
      
      toast({
        title: "Enhanced Manual Sync Complete",
        description: `Before: ${rankedCountBefore} rankings, After: ${rankedCountAfter} rankings`,
        duration: 5000
      });
      
      if (rankedCountAfter !== rankedCountBefore) {
        console.log(`🚨🚨🚨 [SYNC_AUDIT_PHASE3] RANKING COUNT CHANGED! Before: ${rankedCountBefore}, After: ${rankedCountAfter}`);
      }
    } catch (error) {
      console.error(`🚨🚨🚨 [SYNC_AUDIT_PHASE3] Enhanced manual sync failed:`, error);
      toast({
        title: "Enhanced Manual Sync Failed",
        description: "Check console for details",
        variant: "destructive"
      });
    }
  }, [user?.id, session?.user?.id, isHydrated, smartSync, getAllRatings]);

  const saveBattleToCloud = useCallback(async (battleData: BattleData) => {
    // PHASE 3: Enhanced auto-sync for battle data
    console.log('🚨🚨🚨 [SYNC_AUDIT_PHASE3] Battle data saved - enhanced auto-sync will handle cloud updates immediately');
    
    // Force immediate sync for battle data
    await syncToCloud();
  }, [syncToCloud]);

  const loadBattleFromCloud = useCallback(async (generation: number): Promise<BattleData | null> => {
    if (!isHydrated) {
      return null;
    }
    
    // PHASE 2: Use enhanced smart sync
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
    
    // PHASE 3: Enhanced auto-sync for rankings
    console.log('🚨🚨🚨 [SYNC_AUDIT_PHASE3] Rankings saved - enhanced auto-sync will handle cloud updates immediately');

    // Force immediate sync for rankings
    await syncToCloud();

    toast({
      title: "Progress Saved",
      description: "Your rankings have been saved to the cloud with enhanced sync!",
    });
  }, [isHydrated, syncToCloud]);

  const saveSessionToCloud = useCallback(async (sessionId: string, sessionData: any) => {
    // PHASE 3: Enhanced auto-sync for session data
    await syncToCloud();
    return isHydrated;
  }, [isHydrated, syncToCloud]);

  const loadSessionFromCloud = useCallback(async (sessionId: string) => {
    if (!isHydrated) {
      return {};
    }
    
    // PHASE 2: Use enhanced smart sync
    await smartSync();
    return getAllRatings();
  }, [smartSync, getAllRatings, isHydrated]);

  return {
    saveBattleToCloud,
    loadBattleFromCloud,
    saveRankingsToCloud,
    saveSessionToCloud,
    loadSessionFromCloud,
    triggerManualSync, // Enhanced manual sync function
    isAuthenticated: !!(user || session?.user)
  };
};
