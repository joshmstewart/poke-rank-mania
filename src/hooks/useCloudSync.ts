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

  // CRITICAL INVESTIGATION: Enhanced debugging to track sessionId changes
  useEffect(() => {
    const ensureCorrectSessionImmediately = async () => {
      console.log('🔍🔍🔍 [CLOUD_SYNC_INVESTIGATION] ===== CLOUD SYNC SESSION CHECK =====');
      console.log('🔍🔍🔍 [CLOUD_SYNC_INVESTIGATION] user?.id:', user?.id?.substring(0, 8) || 'NONE');
      console.log('🔍🔍🔍 [CLOUD_SYNC_INVESTIGATION] isHydrated:', isHydrated);
      
      if (user?.id && isHydrated) {
        const currentSessionId = useTrueSkillStore.getState().sessionId;
        console.log('🔍🔍🔍 [CLOUD_SYNC_INVESTIGATION] Current TrueSkill sessionId BEFORE any action:', currentSessionId);
        
        // STEP 1: Check what the profile says FIRST
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('trueskill_session_id')
            .eq('id', user.id)
            .maybeSingle();
            
          if (profile?.trueskill_session_id) {
            console.log('🔍🔍🔍 [CLOUD_SYNC_INVESTIGATION] ⚠️ Profile says sessionId should be:', profile.trueskill_session_id);
            console.log('🔍🔍🔍 [CLOUD_SYNC_INVESTIGATION] ⚠️ TrueSkill store currently has:', currentSessionId);
            
            if (profile.trueskill_session_id !== currentSessionId) {
              console.log('🔍🔍🔍 [CLOUD_SYNC_INVESTIGATION] 🚨 DETECTED MISMATCH IN CLOUD SYNC! 🚨');
              console.log('🔍🔍🔍 [CLOUD_SYNC_INVESTIGATION] 🚨 This is likely where the problem happens!');
              
              // Force correct session
              await forceCorrectSession(user.id);
              
              // Then restore data
              await restoreSessionFromCloud(user.id);
              
              const finalSessionId = useTrueSkillStore.getState().sessionId;
              const finalRatingsCount = Object.keys(useTrueSkillStore.getState().getAllRatings()).length;
              console.log('🔍🔍🔍 [CLOUD_SYNC_INVESTIGATION] ✅ Final sessionId:', finalSessionId);
              console.log('🔍🔍🔍 [CLOUD_SYNC_INVESTIGATION] ✅ Final ratings count:', finalRatingsCount);
            } else {
              console.log('🔍🔍🔍 [CLOUD_SYNC_INVESTIGATION] ✅ SessionIds match - no issue here');
            }
          } else {
            console.log('🔍🔍🔍 [CLOUD_SYNC_INVESTIGATION] No profile sessionId found');
          }
        } catch (error) {
          console.error('🔍🔍🔍 [CLOUD_SYNC_INVESTIGATION] Error checking profile:', error);
        }
      } else {
        console.log('🔍🔍🔍 [CLOUD_SYNC_INVESTIGATION] Conditions not met for session check');
        console.log('🔍🔍🔍 [CLOUD_SYNC_INVESTIGATION] - user?.id:', !!user?.id);
        console.log('🔍🔍🔍 [CLOUD_SYNC_INVESTIGATION] - isHydrated:', isHydrated);
      }
      
      console.log('🔍🔍🔍 [CLOUD_SYNC_INVESTIGATION] ===== CLOUD SYNC CHECK COMPLETE =====');
    };

    ensureCorrectSessionImmediately();
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
