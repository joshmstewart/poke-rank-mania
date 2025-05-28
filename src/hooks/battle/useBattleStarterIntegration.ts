
import { useMemo } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { createBattleStarter } from "./createBattleStarter";
import { useRefinementQueue, RefinementBattle } from "./useRefinementQueue";

export const useBattleStarterIntegration = (
  allPokemon: Pokemon[],
  currentRankings: RankedPokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>,
  markSuggestionUsed?: (suggestion: any) => void,
  currentBattle?: Pokemon[]
) => {
  const battleStarter = useMemo(() => {
    if (!allPokemon || allPokemon.length === 0) return null;
    
    return createBattleStarter(allPokemon, currentRankings);
  }, [allPokemon, currentRankings]);

  const refinementQueue = useRefinementQueue();

  const startNewBattle = (battleType: any) => {
    if (!battleStarter) return [];
    
    // First, check if we have any refinement battles waiting
    const nextRefinement = refinementQueue.getNextRefinementBattle();
    
    if (nextRefinement) {
      console.log(`⚔️ [REFINEMENT_BATTLE] Starting refinement battle: ${nextRefinement.primaryPokemonId} vs ${nextRefinement.opponentPokemonId}`);
      console.log(`⚔️ [REFINEMENT_BATTLE] Reason: ${nextRefinement.reason}`);
      
      const primary = allPokemon.find(p => p.id === nextRefinement.primaryPokemonId);
      const opponent = allPokemon.find(p => p.id === nextRefinement.opponentPokemonId);

      if (primary && opponent) {
        const refinementBattle = [primary, opponent];
        setCurrentBattle(refinementBattle);
        setSelectedPokemon([]);
        
        // Mark this refinement battle as started (it will be popped when battle completes)
        console.log(`⚔️ [REFINEMENT_BATTLE] Successfully started: ${primary.name} vs ${opponent.name}`);
        return refinementBattle;
      } else {
        console.warn(`⚔️ [REFINEMENT_BATTLE] Could not find Pokemon for refinement battle:`, nextRefinement);
        // Pop the invalid battle and try again
        refinementQueue.popRefinementBattle();
        return startNewBattle(battleType);
      }
    }
    
    // No refinement battles, proceed with normal battle generation
    const result = battleStarter.startNewBattle(battleType);
    if (result && result.length > 0) {
      setCurrentBattle(result);
      setSelectedPokemon([]);
    }
    return result;
  };

  const resetSuggestionPriority = () => {
    if (battleStarter) {
      battleStarter.resetSuggestionPriority();
    }
  };

  return {
    battleStarter,
    startNewBattle,
    resetSuggestionPriority,
    refinementQueue // Export refinement queue for use in components
  };
};
