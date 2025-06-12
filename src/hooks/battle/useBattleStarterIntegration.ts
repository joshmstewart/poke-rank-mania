
import { useCallback, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleStarterCore } from "./useBattleStarterCore";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";

export const useBattleStarterIntegration = (
  allPokemon: Pokemon[],
  finalRankings: any[],
  setCurrentBattle: (battle: Pokemon[]) => void,
  setSelectedPokemon: (pokemon: number[]) => void,
  markSuggestionUsed: (pokemonId: number) => void,
  currentBattle: Pokemon[],
  initialBattleStartedRef: React.MutableRefObject<boolean>
) => {
  console.log(`🔧 [INTEGRATION_FIX] Setting up battle starter integration with ${allPokemon.length} Pokemon`);
  
  // Get current rankings function
  const getCurrentRankings = useCallback(() => {
    console.log(`🔧 [INTEGRATION_FIX] getCurrentRankings called - finalRankings length: ${finalRankings.length}`);
    return finalRankings;
  }, [finalRankings]);
  
  // Initialize battle starter core
  const { startNewBattle: startNewBattleCore } = useBattleStarterCore(allPokemon, getCurrentRankings);
  const refinementQueue = useSharedRefinementQueue();

  // SIMPLIFIED: Create synchronous battle starter that doesn't compete with events
  const startNewBattle = useCallback((battleType: BattleType): Pokemon[] => {
    console.log(`🚀 [INTEGRATION_FIX] startNewBattle called for type: ${battleType}`);
    
    if (!allPokemon || allPokemon.length === 0) {
      console.log(`🚀 [INTEGRATION_FIX] No Pokemon available`);
      return [];
    }
    
    if (allPokemon.length < 2) {
      console.log(`🚀 [INTEGRATION_FIX] Not enough Pokemon: ${allPokemon.length}`);
      return [];
    }
    
    // FIXED: Pass proper BattleType instead of string
    const result = startNewBattleCore(battleType);
    console.log(`🚀 [INTEGRATION_FIX] Generated battle:`, result?.map(p => `${p.name}(${p.id})`).join(' vs ') || 'empty');
    
    return result || [];
  }, [allPokemon, startNewBattleCore]);

  const resetSuggestionPriority = useCallback(() => {
    console.log(`🔧 [INTEGRATION_FIX] Suggestion priority reset`);
  }, []);

  return {
    battleStarter: { startNewBattle },
    startNewBattle,
    resetSuggestionPriority,
    refinementQueue
  };
};
