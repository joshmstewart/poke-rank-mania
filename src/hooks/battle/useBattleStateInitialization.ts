
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
    console.log("🧪 [ENHANCED_START] enhancedStartNewBattle function is initialized and ready.");
    
    const currentBattleCount = parseInt(localStorage.getItem('pokemon-battle-count') || '0', 10);
    console.log(`🔄 [FLASH_FIX] enhancedStartNewBattle called for ${battleType} - Battle ${String(currentBattleCount)}`);

    // ✅ Correctly use refinementQueue from providersData
    const refinementQueue = providersData.refinementQueue;
    console.log(`🧪 [ENHANCED_START] refinementQueue exists: ${!!refinementQueue}`);
    console.log(`🧪 [ENHANCED_START] refinementQueue hasRefinementBattles: ${refinementQueue?.hasRefinementBattles}`);
    console.log(`🧪 [ENHANCED_START] refinementQueue count: ${refinementQueue?.refinementBattleCount}`);
    
    console.log("🧪 [ENHANCED_START] Checking for refinement battle...");
    const refinementBattle = refinementQueue?.getNextRefinementBattle?.();
    console.log(`🧪 [ENHANCED_START] refinementBattle result:`, refinementBattle);

    if (refinementBattle) {
      console.log(`🧪 [ENHANCED_START] Found refinement battle, looking for Pokemon...`);
      const primary = allPokemon.find(p => p.id === refinementBattle.primaryPokemonId);
      const opponent = allPokemon.find(p => p.id === refinementBattle.opponentPokemonId);
      console.log(`🧪 [ENHANCED_START] Primary found: ${!!primary} (${primary?.name}), Opponent found: ${!!opponent} (${opponent?.name})`);

      if (primary && opponent) {
        console.log(`✅ [REFINEMENT_USE] Using refinement battle: ${primary.name} vs ${opponent.name}`);
        refinementQueue?.popRefinementBattle?.();
        return [primary, opponent];
      } else {
        console.warn(`❌ [REFINEMENT_USE] Refinement battle referenced missing Pokémon:`, refinementBattle);
        console.warn(`❌ [REFINEMENT_USE] allPokemon contains IDs: ${allPokemon.slice(0, 5).map(p => p.id).join(', ')}... (showing first 5)`);
        refinementQueue?.popRefinementBattle?.(); // Remove broken entry to avoid infinite skip
      }
    } else {
      console.log(`🧪 [ENHANCED_START] No refinement battle available, falling back to random`);
    }

    // 🧠 Fallback to random
    console.log(`🧪 [ENHANCED_START] Calling providersData.startNewBattle for fallback...`);
    const result = providersData.startNewBattle(battleType);
    if (result && result.length > 0) {
      console.log(`✅ [FLASH_FIX] New battle generated, setting immediately: ${result.map(p => p.name).join(', ')}`);
      return result;
    } else {
      console.warn(`❌ [FLASH_FIX] No battle generated, result is:`, result);
      return [];
    }
  }, [allPokemon, providersData]);

  return {
    stateManagerData,
    providersData,
    enhancedStartNewBattle
  };
};
