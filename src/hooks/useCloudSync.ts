
import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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

  // Save battle data to cloud
  const saveBattleToCloud = useCallback(async (battleData: BattleData) => {
    if (!user || !session) return;

    try {
      const { error } = await supabase
        .from('user_rankings')
        .upsert({
          user_id: user.id,
          generation: battleData.selectedGeneration,
          pokemon_rankings: [], // Will be populated when rankings are generated
          battle_results: battleData.battleResults,
          completion_percentage: battleData.completionPercentage,
          battles_completed: battleData.battlesCompleted,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving battle data:', error);
        return;
      }

      // Save individual battle history entries
      if (battleData.battleHistory.length > 0) {
        const battleHistoryData = battleData.battleHistory.map(battle => ({
          user_id: user.id,
          pokemon_ids: battle.battle.map(p => p.id),
          selected_pokemon_ids: battle.selected,
          battle_type: battleData.battleType,
          generation: battleData.selectedGeneration
        }));

        const { error: historyError } = await supabase
          .from('battle_history')
          .insert(battleHistoryData);

        if (historyError) {
          console.error('Error saving battle history:', historyError);
        }
      }
    } catch (error) {
      console.error('Error syncing to cloud:', error);
    }
  }, [user, session]);

  // Load battle data from cloud
  const loadBattleFromCloud = useCallback(async (generation: number): Promise<BattleData | null> => {
    if (!user || !session) return null;

    try {
      const { data, error } = await supabase
        .from('user_rankings')
        .select('*')
        .eq('user_id', user.id)
        .eq('generation', generation)
        .maybeSingle();

      if (error) {
        console.error('Error loading battle data:', error);
        return null;
      }

      if (!data) return null;

      // Load battle history
      const { data: historyData, error: historyError } = await supabase
        .from('battle_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('generation', generation)
        .order('created_at', { ascending: true });

      if (historyError) {
        console.error('Error loading battle history:', historyError);
      }

      return {
        selectedGeneration: data.generation,
        battleType: "pairs" as const, // Default, will be overridden
        battleResults: Array.isArray(data.battle_results) ? data.battle_results : [],
        battlesCompleted: data.battles_completed || 0,
        battleHistory: historyData?.map(h => ({
          battle: [], // Would need to reconstruct Pokemon objects
          selected: h.selected_pokemon_ids
        })) || [],
        completionPercentage: Number(data.completion_percentage) || 0,
        fullRankingMode: false // Default
      };
    } catch (error) {
      console.error('Error loading from cloud:', error);
      return null;
    }
  }, [user, session]);

  // Save rankings to cloud
  const saveRankingsToCloud = useCallback(async (rankings: any[], generation: number) => {
    if (!user || !session) return;

    try {
      const { error } = await supabase
        .from('user_rankings')
        .upsert({
          user_id: user.id,
          generation,
          pokemon_rankings: rankings,
          battle_results: [], // Keep existing battle results
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving rankings:', error);
        return;
      }

      toast({
        title: "Rankings Saved",
        description: "Your rankings have been saved to the cloud!",
      });
    } catch (error) {
      console.error('Error saving rankings to cloud:', error);
    }
  }, [user, session]);

  // Save session data to cloud (for cross-device session sharing)
  const saveSessionToCloud = useCallback(async (sessionId: string, sessionData: any) => {
    try {
      const { error } = await supabase
        .from('user_rankings')
        .upsert({
          user_id: sessionId, // Use session ID as user ID for anonymous sessions
          generation: 0, // Use generation 0 for session data
          pokemon_rankings: [],
          battle_results: sessionData,
          completion_percentage: 0,
          battles_completed: 0,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving session to cloud:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error saving session to cloud:', error);
      return false;
    }
  }, []);

  // Load session data from cloud
  const loadSessionFromCloud = useCallback(async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_rankings')
        .select('*')
        .eq('user_id', sessionId)
        .eq('generation', 0)
        .maybeSingle();

      if (error) {
        console.error('Error loading session from cloud:', error);
        return null;
      }

      return data?.battle_results || null;
    } catch (error) {
      console.error('Error loading session from cloud:', error);
      return null;
    }
  }, []);

  return {
    saveBattleToCloud,
    loadBattleFromCloud,
    saveRankingsToCloud,
    saveSessionToCloud,
    loadSessionFromCloud,
    isAuthenticated: !!user
  };
};
