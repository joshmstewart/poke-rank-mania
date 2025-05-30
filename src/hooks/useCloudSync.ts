
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
  const { loadFromCloud, syncToCloud, getAllRatings } = useTrueSkillStore();

  // Auto-load from cloud when user authenticates
  useEffect(() => {
    if (user && session) {
      console.log('[CLOUD_SYNC] User authenticated, loading data from cloud...');
      loadFromCloud();
    }
  }, [user, session, loadFromCloud]);

  // Save battle data to cloud via TrueSkill store
  const saveBattleToCloud = useCallback(async (battleData: BattleData) => {
    if (!user || !session) {
      console.log('[CLOUD_SYNC] No authenticated user, cannot save to cloud');
      return;
    }

    console.log('[CLOUD_SYNC] Saving battle data via TrueSkill store...');
    await syncToCloud();
  }, [user, session, syncToCloud]);

  // Load battle data from cloud via TrueSkill store
  const loadBattleFromCloud = useCallback(async (generation: number): Promise<BattleData | null> => {
    if (!user || !session) {
      console.log('[CLOUD_SYNC] No authenticated user, cannot load from cloud');
      return null;
    }

    console.log('[CLOUD_SYNC] Loading battle data via TrueSkill store...');
    await loadFromCloud();
    
    // Return reconstructed battle data
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
  }, [user, session, loadFromCloud, getAllRatings]);

  // Save rankings to cloud via TrueSkill store
  const saveRankingsToCloud = useCallback(async (rankings: any[], generation: number) => {
    if (!user || !session) {
      console.log('[CLOUD_SYNC] No authenticated user, cannot save rankings to cloud');
      return;
    }

    console.log('[CLOUD_SYNC] Saving rankings via TrueSkill store...');
    await syncToCloud();

    toast({
      title: "Rankings Saved",
      description: "Your rankings have been saved to the cloud!",
    });
  }, [user, session, syncToCloud]);

  // Session management via TrueSkill store
  const saveSessionToCloud = useCallback(async (sessionId: string, sessionData: any) => {
    console.log('[CLOUD_SYNC] Session data saved via TrueSkill store');
    await syncToCloud();
    return true;
  }, [syncToCloud]);

  const loadSessionFromCloud = useCallback(async (sessionId: string) => {
    console.log('[CLOUD_SYNC] Session data loaded via TrueSkill store');
    await loadFromCloud();
    return getAllRatings();
  }, [loadFromCloud, getAllRatings]);

  return {
    saveBattleToCloud,
    loadBattleFromCloud,
    saveRankingsToCloud,
    saveSessionToCloud,
    loadSessionFromCloud,
    isAuthenticated: !!user
  };
};
