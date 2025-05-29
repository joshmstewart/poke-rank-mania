
import { useCallback, useRef, useEffect, useMemo } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleStateManager } from "./useBattleStateManager";
import { useBattleStateProviders } from "./useBattleStateProviders";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";

export const useBattleStateInitialization = (
  allPokemon: Pokemon[] = [],
  initialBattleType: BattleType,
  initialSelectedGeneration: number
) => {
  const initializationRef = useRef(false);
  const hookInstanceRef = useRef(`core-${Date.now()}`);
  
  if (!initializationRef.current) {
    console.log(`[DEBUG useBattleStateInitialization] INIT - Instance: ${hookInstanceRef.current} - Using context for Pokemon data`);
    initializationRef.current = true;
  }
  
  const stableInitialBattleType = useMemo(() => initialBattleType, []);
  const stableInitialGeneration = useMemo(() => initialSelectedGeneration, []);
  
  // Use the state manager hook
  const stateManagerData = useBattleStateManager(stableInitialBattleType, stableInitialGeneration);

  // Use the providers hook
  const providersData = useBattleStateProviders(
    stateManagerData.selectedGeneration,
    stateManagerData.battleResults,
    stateManagerData.currentBattle,
    stateManagerData.stableSetCurrentBattle,
    stateManagerData.stableSetSelectedPokemon,
    typeof stateManagerData.activeTier === 'string' ? stateManagerData.activeTier : String(stateManagerData.activeTier)
  );

  // CRITICAL FIX: Access refinement queue directly
  const refinementQueue = useSharedRefinementQueue();

  const enhancedStartNewBattle = useCallback((battleType: BattleType) => {
    const currentBattleCount = parseInt(localStorage.getItem('pokemon-battle-count') || '0', 10);
    console.log(`🔄 [FLASH_FIX] enhancedStartNewBattle called for ${battleType} - Battle ${String(currentBattleCount)}`);

    // ✅ Use refinement queue if available
    const refinementBattle = refinementQueue?.getNextRefinementBattle?.();
    if (refinementBattle) {
      const primary = allPokemon.find(p => p.id === refinementBattle.primaryPokemonId);
      const opponent = allPokemon.find(p => p.id === refinementBattle.opponentPokemonId);

      if (primary && opponent) {
        console.log(`✅ [REFINEMENT_USE] Using refinement battle: ${primary.name} vs ${opponent.name}`);
        refinementQueue?.popRefinementBattle?.();
        return [primary, opponent];
      } else {
        console.warn(`❌ [REFINEMENT_USE] Refinement battle referenced missing Pokémon:`, refinementBattle);
        refinementQueue?.popRefinementBattle?.(); // Remove invalid battle
      }
    }

    // Fallback to normal random battle
    const result = providersData.startNewBattle(battleType);

    if (result && result.length > 0) {
      console.log(`✅ [FLASH_FIX] New battle generated, setting immediately: ${result.map(p => p.name).join(', ')}`);
      return result;
    } else {
      console.warn(`❌ [FLASH_FIX] No battle generated, result is:`, result);
      return [];
    }
  }, [allPokemon, providersData, refinementQueue]);

  return {
    stateManagerData,
    providersData,
    enhancedStartNewBattle
  };
};
