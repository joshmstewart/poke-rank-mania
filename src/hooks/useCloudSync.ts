
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
  const { loadFromCloud, syncToCloud, getAllRatings, isHydrated, restoreSessionFromCloud, forceCorrectSession } = useTrueSkillStore();

  // CRITICAL FIX: Force correct session BEFORE any other operations
  useEffect(() => {
    const ensureCorrectSession = async () => {
      if (user?.id && isHydrated) {
        console.log('🚨 [CLOUD_SYNC_SESSION_FIX] ===== ENSURING CORRECT SESSION =====');
        console.log('🚨 [CLOUD_SYNC_SESSION_FIX] User ID:', user.id);
        console.log('🚨 [CLOUD_SYNC_SESSION_FIX] Current sessionId before check:', useTrueSkillStore.getState().sessionId);
        
        // STEP 1: Force correct session first
        await forceCorrectSession(user.id);
        
        // STEP 2: Then restore any additional data
        await restoreSessionFromCloud(user.id);
        
        console.log('🚨 [CLOUD_SYNC_SESSION_FIX] Final sessionId after correction:', useTrueSkillStore.getState().sessionId);
        console.log('🚨 [CLOUD_SYNC_SESSION_FIX] Final ratings count:', Object.keys(useTrueSkillStore.getState().getAllRatings()).length);
      }
    };

    ensureCorrectSession();
  }, [user?.id, isHydrated, forceCorrectSession, restoreSessionFromCloud]);

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
