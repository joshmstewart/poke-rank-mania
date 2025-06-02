
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

  // Auto-load from cloud when component mounts
  useEffect(() => {
    loadFromCloud();
  }, [loadFromCloud]);

  // Auto-sync when user authenticates
  useEffect(() => {
    if (user && session) {
      syncToCloud();
    }
  }, [user, session, syncToCloud]);

  // Save battle data to cloud via TrueSkill store
  const saveBattleToCloud = useCallback(async (battleData: BattleData) => {
    await syncToCloud();
  }, [syncToCloud]);

  // Load battle data from cloud via TrueSkill store
  const loadBattleFromCloud = useCallback(async (generation: number): Promise<BattleData | null> => {
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
  }, [loadFromCloud, getAllRatings]);

  // Save rankings to cloud via TrueSkill store
  const saveRankingsToCloud = useCallback(async (rankings: any[], generation: number) => {
    await syncToCloud();

    toast({
      title: "Progress Saved",
      description: "Your rankings have been saved to the cloud!",
    });
  }, [syncToCloud]);

  // Session management via TrueSkill store
  const saveSessionToCloud = useCallback(async (sessionId: string, sessionData: any) => {
    await syncToCloud();
    return true;
  }, [syncToCloud]);

  const loadSessionFromCloud = useCallback(async (sessionId: string) => {
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
