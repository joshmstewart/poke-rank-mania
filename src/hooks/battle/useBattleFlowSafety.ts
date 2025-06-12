
import { useCallback } from "react";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { useCloudPendingBattles } from "./useCloudPendingBattles";

export const useBattleFlowSafety = () => {
  const { syncToCloud } = useTrueSkillStore();
  const { removePendingPokemon, getAllPendingIds } = useCloudPendingBattles();

  // CRITICAL: Remove ALL participating Pokemon from pending after battle
  const safelyRemovePendingAfterBattle = useCallback(async (participatingPokemonIds: number[]) => {
    const removeId = `REMOVE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🔒🔒🔒 [${removeId}] ===== SAFELY REMOVING PENDING AFTER BATTLE =====`);
    console.log(`🔒🔒🔒 [${removeId}] Participating Pokemon:`, participatingPokemonIds);
    
    const pendingBeforeRemoval = getAllPendingIds();
    console.log(`🔒🔒🔒 [${removeId}] Pending before removal:`, pendingBeforeRemoval);
    
    // Remove each participating Pokemon from pending
    for (const pokemonId of participatingPokemonIds) {
      if (pendingBeforeRemoval.includes(pokemonId)) {
        console.log(`🔒🔒🔒 [${removeId}] Removing Pokemon ${pokemonId} from pending`);
        removePendingPokemon(pokemonId);
      } else {
        console.log(`🔒🔒🔒 [${removeId}] Pokemon ${pokemonId} was not pending, skipping`);
      }
    }
    
    const pendingAfterRemoval = getAllPendingIds();
    console.log(`🔒🔒🔒 [${removeId}] Pending after removal:`, pendingAfterRemoval);
    
    // Verify removal was successful
    const stillPending = participatingPokemonIds.filter(id => pendingAfterRemoval.includes(id));
    if (stillPending.length > 0) {
      console.error(`🔒🔒🔒 [${removeId}] ❌ FAILED TO REMOVE: ${stillPending} still pending`);
    } else {
      console.log(`🔒🔒🔒 [${removeId}] ✅ Successfully removed all participating Pokemon from pending`);
    }
    
    // Force immediate cloud sync to persist changes
    try {
      await syncToCloud();
      console.log(`🔒🔒🔒 [${removeId}] ✅ Cloud sync completed after pending removal`);
    } catch (error) {
      console.error(`🔒🔒🔒 [${removeId}] ❌ Cloud sync failed:`, error);
    }
    
    console.log(`🔒🔒🔒 [${removeId}] ===== PENDING REMOVAL COMPLETE =====`);
  }, [removePendingPokemon, getAllPendingIds, syncToCloud]);

  return {
    safelyRemovePendingAfterBattle
  };
};
