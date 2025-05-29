
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";

export const useBattleStateRefinement = (
  allPokemon: Pokemon[],
  enhancedStartNewBattle: (battleType: BattleType) => Pokemon[]
) => {
  const refinementQueue = useSharedRefinementQueue();

  // Enhanced start new battle with refinement queue integration
  const enhancedStartNewBattleWithRefinement = useCallback((battleType: BattleType) => {
    console.log(`🔄 [REFINEMENT_INTEGRATION] Starting new battle, checking refinement queue first`);
    console.log(`🔄 [REFINEMENT_INTEGRATION] Refinement queue has ${refinementQueue.refinementBattleCount} battles`);
    
    // Check for refinement battles first - this is the key integration point
    const nextRefinement = refinementQueue.getNextRefinementBattle();
    
    if (nextRefinement) {
      console.log(`⚔️ [REFINEMENT_INTEGRATION] Found pending refinement battle: ${nextRefinement.primaryPokemonId} vs ${nextRefinement.opponentPokemonId}`);
      console.log(`⚔️ [REFINEMENT_INTEGRATION] Reason: ${nextRefinement.reason}`);
      
      const primary = allPokemon.find(p => p.id === nextRefinement.primaryPokemonId);
      const opponent = allPokemon.find(p => p.id === nextRefinement.opponentPokemonId);

      if (primary && opponent) {
        const refinementBattle = [primary, opponent];
        console.log(`⚔️ [REFINEMENT_INTEGRATION] Successfully created refinement battle: ${primary.name} vs ${opponent.name}`);
        return refinementBattle;
      } else {
        console.warn(`⚔️ [REFINEMENT_INTEGRATION] Could not find Pokemon for refinement battle:`, nextRefinement);
        // Pop the invalid battle and try regular battle generation
        refinementQueue.popRefinementBattle();
      }
    }
    
    // No refinement battles or invalid battle, proceed with normal generation
    console.log(`🎮 [REFINEMENT_INTEGRATION] No valid refinement battles, proceeding with regular generation`);
    return enhancedStartNewBattle(battleType);
  }, [allPokemon, refinementQueue, enhancedStartNewBattle]);

  // CRITICAL FIX: Add function to mark refinement battle as completed
  const completeRefinementBattle = useCallback((primaryPokemonId: number, opponentPokemonId: number, primaryWon: boolean) => {
    console.log(`⚔️ [REFINEMENT_COMPLETION] Completing refinement battle: ${primaryPokemonId} vs ${opponentPokemonId}, primaryWon: ${primaryWon}`);
    
    // Remove the completed battle from the queue
    refinementQueue.popRefinementBattle();
    
    console.log(`⚔️ [REFINEMENT_COMPLETION] Refinement battle completed and removed from queue`);
    console.log(`⚔️ [REFINEMENT_COMPLETION] Remaining battles in queue: ${refinementQueue.refinementBattleCount}`);
  }, [refinementQueue]);

  return {
    refinementQueue,
    enhancedStartNewBattleWithRefinement,
    completeRefinementBattle
  };
};
