
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

  // UPDATED: Create proper battle starter that accepts N and ratings parameters
  const startNewBattle = useCallback((battleType: BattleType, N: number = 25, ratings: any = {}): Pokemon[] => {
    console.log(`🚀 [INTEGRATION_FIX] startNewBattle called for type: ${battleType}, N: ${N}`);
    console.log(`🚀 [INTEGRATION_FIX] Ratings provided: ${Object.keys(ratings).length} Pokemon`);
    
    if (!allPokemon || allPokemon.length === 0) {
      console.log(`🚀 [INTEGRATION_FIX] No Pokemon available`);
      return [];
    }
    
    if (allPokemon.length < 2) {
      console.log(`🚀 [INTEGRATION_FIX] Not enough Pokemon: ${allPokemon.length}`);
      return [];
    }
    
    // UPDATED: Construct proper BattleStarterConfig object with new parameters
    const config = {
      allPokemon,
      currentRankings: finalRankings,
      battleType,
      selectedGeneration: 0, // Default to all generations
      freezeList: [], // Default to no frozen Pokemon
      N, // Add Top N parameter
      ratings // Add ratings parameter
    };
    
    const result = startNewBattleCore(config);
    console.log(`🚀 [INTEGRATION_FIX] Generated Top N battle:`, result?.map(p => `${p.name}(${p.id})`).join(' vs ') || 'empty');
    
    return result || [];
  }, [allPokemon, finalRankings, startNewBattleCore]);

  const resetSuggestionPriority = useCallback(() => {
    console.log(`🔧 [INTEGRATION_FIX] Suggestion priority reset`);
  }, []);

  return {
    battleStarter: { 
      startNewBattle,
      getAllPokemon: () => allPokemon // Add this method for refinement queue access
    },
    startNewBattle,
    resetSuggestionPriority,
    refinementQueue
  };
};
