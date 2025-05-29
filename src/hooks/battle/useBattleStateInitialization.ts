
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

  // CRITICAL FIX: Create a proper random battle generator that uses the full Pokemon list
  const generateRandomBattle = useCallback((battleType: BattleType): Pokemon[] => {
    const battleSize = battleType === "pairs" ? 2 : 3;
    
    console.log(`🎲 [RANDOM_BATTLE_FIX] Generating truly random battle with ${allPokemon.length} Pokemon`);
    
    if (!allPokemon || allPokemon.length === 0) {
      console.error(`🎲 [RANDOM_BATTLE_FIX] No Pokemon available for battle generation`);
      return [];
    }
    
    // Create a copy of the Pokemon array and shuffle it
    const shuffledPokemon = [...allPokemon].sort(() => Math.random() - 0.5);
    
    // Take the first battleSize Pokemon from the shuffled array
    const selectedPokemon = shuffledPokemon.slice(0, battleSize);
    
    console.log(`🎲 [RANDOM_BATTLE_FIX] Generated random battle: ${selectedPokemon.map(p => p.name).join(' vs ')}`);
    
    return selectedPokemon;
  }, [allPokemon]);

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

    // 🧠 CRITICAL FIX: Use our new random battle generator instead of providersData.startNewBattle
    console.log(`🧪 [ENHANCED_START] Calling generateRandomBattle for truly random selection...`);
    const result = generateRandomBattle(battleType);
    if (result && result.length > 0) {
      console.log(`✅ [FLASH_FIX] New random battle generated: ${result.map(p => p.name).join(', ')}`);
      return result;
    } else {
      console.warn(`❌ [FLASH_FIX] No battle generated, result is:`, result);
      return [];
    }
  }, [allPokemon, providersData, generateRandomBattle]);

  return {
    stateManagerData,
    providersData,
    enhancedStartNewBattle
  };
};
