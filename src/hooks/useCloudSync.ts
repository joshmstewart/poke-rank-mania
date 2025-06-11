
import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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

  // Simple session restoration when user is authenticated and hydrated
  useEffect(() => {
    if (user?.id && isHydrated) {
      console.log('[CLOUD_SYNC] User authenticated and hydrated, restoring session with smart sync');
      restoreSessionFromCloud(user.id);
    }
  }, [user?.id, isHydrated, restoreSessionFromCloud]);

  // REMOVED: Auto-sync that was competing with the store's own sync logic
  // The TrueSkill store now handles all syncing internally

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
    isAuthenticated: !!user
  };
};
