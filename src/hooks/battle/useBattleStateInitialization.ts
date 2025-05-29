
import { useCallback, useRef, useEffect, useMemo } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleStateManager } from "./useBattleStateManager";
import { useBattleStateProviders } from "./useBattleStateProviders";

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

  const enhancedStartNewBattle = useCallback((battleType: BattleType) => {
    const currentBattleCount = parseInt(localStorage.getItem('pokemon-battle-count') || '0', 10);
    console.log(`🔄 [FLASH_FIX] enhancedStartNewBattle called for ${battleType} - Battle ${String(currentBattleCount)}`);

    // ✅ CRITICAL FIX: Check refinement queue FIRST before generating random battles
    console.log(`🔍 [REFINEMENT_PRIORITY] Checking refinement queue before random generation...`);
    const refinementBattle = providersData.refinementQueue?.getNextRefinementBattle?.();
    
    if (refinementBattle) {
      console.log(`🎯 [REFINEMENT_PRIORITY] Found refinement battle:`, refinementBattle);
      const primary = allPokemon.find(p => p.id === refinementBattle.primaryPokemonId);
      const opponent = allPokemon.find(p => p.id === refinementBattle.opponentPokemonId);

      console.log(`🔍 [REFINEMENT_PRIORITY] Primary Pokemon found: ${!!primary} (${primary?.name})`);
      console.log(`🔍 [REFINEMENT_PRIORITY] Opponent Pokemon found: ${!!opponent} (${opponent?.name})`);

      if (primary && opponent) {
        console.log(`✅ [REFINEMENT_USE] Using refinement battle: ${primary.name} vs ${opponent.name}`);
        console.log(`✅ [REFINEMENT_USE] Reason: ${refinement.reason}`);
        
        // Remove the battle from the queue
        providersData.refinementQueue?.popRefinementBattle?.();
        console.log(`✅ [REFINEMENT_USE] Battle removed from queue`);
        
        const refinementResult = [primary, opponent];
        console.log(`✅ [REFINEMENT_USE] Returning refinement battle: ${refinementResult.map(p => `${p.name} (${p.id})`).join(', ')}`);
        return refinementResult;
      } else {
        console.warn(`❌ [REFINEMENT_USE] Refinement battle referenced missing Pokémon:`, refinementBattle);
        console.warn(`❌ [REFINEMENT_USE] Removing invalid battle from queue...`);
        providersData.refinementQueue?.popRefinementBattle?.();
        // Fall through to normal battle generation
      }
    } else {
      console.log(`🔍 [REFINEMENT_PRIORITY] No refinement battles available, proceeding with normal generation`);
    }

    // 🧠 Fallback to normal random battle generation
    console.log(`🎮 [NORMAL_BATTLE] Generating normal ${battleType} battle`);
    const result = providersData.startNewBattle(battleType);
    
    if (result && result.length > 0) {
      console.log(`✅ [FLASH_FIX] New battle generated, setting immediately: ${result.map(p => p.name).join(', ')}`);
      return result;
    } else {
      console.log(`⚠️ [FLASH_FIX] Failed to generate new battle`);
    }
    
    return result || [];
  }, [allPokemon, providersData]);

  return {
    stateManagerData,
    providersData,
    enhancedStartNewBattle
  };
};
