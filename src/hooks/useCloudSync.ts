
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
  const { loadFromCloud, syncToCloud, getAllRatings, isHydrated, restoreSessionFromCloud } = useTrueSkillStore();

  // Simple session restoration when user is authenticated and hydrated
  useEffect(() => {
    if (user?.id && isHydrated) {
      console.log('[CLOUD_SYNC] User authenticated and hydrated, restoring session');
      restoreSessionFromCloud(user.id);
    }
  }, [user?.id, isHydrated, restoreSessionFromCloud]);

  // Auto-sync when authenticated and hydrated
  useEffect(() => {
    if (user && session && isHydrated) {
      syncToCloud();
    }
  }, [user, session, syncToCloud, isHydrated]);

  const saveBattleToCloud = useCallback(async (battleData: BattleData) => {
    if (isHydrated) {
      await syncToCloud();
    }
  }, [syncToCloud, isHydrated]);

  const loadBattleFromCloud = useCallback(async (generation: number): Promise<BattleData | null> => {
    if (!isHydrated) {
      return null;
    }
    
    await loadFromCloud();
    
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
  }, [loadFromCloud, getAllRatings, isHydrated]);

  const saveRankingsToCloud = useCallback(async (rankings: any[], generation: number) => {
    if (!isHydrated) {
      return;
    }
    
    await syncToCloud();

    toast({
      title: "Progress Saved",
      description: "Your rankings have been saved to the cloud!",
    });
  }, [syncToCloud, isHydrated]);

  const saveSessionToCloud = useCallback(async (sessionId: string, sessionData: any) => {
    if (isHydrated) {
      await syncToCloud();
      return true;
    }
    return false;
  }, [syncToCloud, isHydrated]);

  const loadSessionFromCloud = useCallback(async (sessionId: string) => {
    if (!isHydrated) {
      return {};
    }
    
    await loadFromCloud();
    return getAllRatings();
  }, [loadFromCloud, getAllRatings, isHydrated]);

  return {
    saveBattleToCloud,
    loadBattleFromCloud,
    saveRankingsToCloud,
    saveSessionToCloud,
    loadSessionFromCloud,
    isAuthenticated: !!user
  };
};
