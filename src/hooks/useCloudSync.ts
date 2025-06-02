
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

  console.log('🔮 [CHAT_MESSAGE_INVESTIGATION] ===== useCloudSync HOOK CALLED =====');
  console.log('🔮 [CHAT_MESSAGE_INVESTIGATION] Hook render - Auth state:', {
    hasUser: !!user,
    hasSession: !!session,
    userEmail: user?.email
  });

  // Auto-load from cloud when component mounts
  useEffect(() => {
    console.log('🔮 [CHAT_MESSAGE_INVESTIGATION] ===== useCloudSync MOUNT EFFECT =====');
    console.log('[CLOUD_SYNC] Initializing cloud sync...');
    console.log('🔮 [CHAT_MESSAGE_INVESTIGATION] About to call loadFromCloud...');
    loadFromCloud();
  }, [loadFromCloud]);

  // Auto-sync when user authenticates
  useEffect(() => {
    console.log('🔮 [CHAT_MESSAGE_INVESTIGATION] ===== AUTH CHANGE EFFECT =====');
    console.log('🔮 [CHAT_MESSAGE_INVESTIGATION] User/session changed:', { hasUser: !!user, hasSession: !!session });
    
    if (user && session) {
      console.log('[CLOUD_SYNC] User authenticated, syncing to cloud...');
      console.log('🔮 [CHAT_MESSAGE_INVESTIGATION] About to call syncToCloud...');
      syncToCloud();
    }
  }, [user, session, syncToCloud]);

  // Save battle data to cloud via TrueSkill store
  const saveBattleToCloud = useCallback(async (battleData: BattleData) => {
    console.log('🔮 [CHAT_MESSAGE_INVESTIGATION] ===== saveBattleToCloud CALLED =====');
    console.log('[CLOUD_SYNC] Saving battle data via TrueSkill store...');
    await syncToCloud();
  }, [syncToCloud]);

  // Load battle data from cloud via TrueSkill store
  const loadBattleFromCloud = useCallback(async (generation: number): Promise<BattleData | null> => {
    console.log('🔮 [CHAT_MESSAGE_INVESTIGATION] ===== loadBattleFromCloud CALLED =====');
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
  }, [loadFromCloud, getAllRatings]);

  // Save rankings to cloud via TrueSkill store
  const saveRankingsToCloud = useCallback(async (rankings: any[], generation: number) => {
    console.log('🔮 [CHAT_MESSAGE_INVESTIGATION] ===== saveRankingsToCloud CALLED =====');
    console.log('[CLOUD_SYNC] Saving rankings via TrueSkill store...');
    await syncToCloud();

    toast({
      title: "Progress Saved",
      description: "Your rankings have been saved to the cloud!",
    });
  }, [syncToCloud]);

  // Session management via TrueSkill store
  const saveSessionToCloud = useCallback(async (sessionId: string, sessionData: any) => {
    console.log('🔮 [CHAT_MESSAGE_INVESTIGATION] ===== saveSessionToCloud CALLED =====');
    console.log('[CLOUD_SYNC] Session data saved via TrueSkill store');
    await syncToCloud();
    return true;
  }, [syncToCloud]);

  const loadSessionFromCloud = useCallback(async (sessionId: string) => {
    console.log('🔮 [CHAT_MESSAGE_INVESTIGATION] ===== loadSessionFromCloud CALLED =====');
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
