
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
  const lastGeneratedBattleRef = useRef<string>("");
  
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

  // CRITICAL DEBUG: Log the Pokemon array being used
  console.log(`🚨🚨🚨 [POKEMON_ARRAY_DEBUG] useBattleStateInitialization Pokemon array:`, {
    length: allPokemon.length,
    first5: allPokemon.slice(0, 5).map(p => ({ id: p.id, name: p.name })),
    last5: allPokemon.slice(-5).map(p => ({ id: p.id, name: p.name })),
    pokemonIds: allPokemon.map(p => p.id).slice(0, 20)
  });

  // CRITICAL FIX: Create a COMPLETELY new random battle generator with extensive logging
  const generateRandomBattle = useCallback((battleType: BattleType): Pokemon[] => {
    const battleSize = battleType === "pairs" ? 2 : 3;
    const timestamp = new Date().toISOString();
    const battleId = Math.random().toString(36).substring(7);
    
    console.log(`🎲🎲🎲 [RANDOM_BATTLE_MEGA_DEBUG] ===== generateRandomBattle START =====`);
    console.log(`🎲🎲🎲 [RANDOM_BATTLE_MEGA_DEBUG] Battle ID: ${battleId}`);
    console.log(`🎲🎲🎲 [RANDOM_BATTLE_MEGA_DEBUG] Timestamp: ${timestamp}`);
    console.log(`🎲🎲🎲 [RANDOM_BATTLE_MEGA_DEBUG] Battle size: ${battleSize}`);
    console.log(`🎲🎲🎲 [RANDOM_BATTLE_MEGA_DEBUG] Pokemon array length: ${allPokemon.length}`);
    console.log(`🎲🎲🎲 [RANDOM_BATTLE_MEGA_DEBUG] Last generated battle: ${lastGeneratedBattleRef.current}`);
    
    if (!allPokemon || allPokemon.length === 0) {
      console.error(`🎲🎲🎲 [RANDOM_BATTLE_MEGA_DEBUG] ❌ NO POKEMON AVAILABLE`);
      return [];
    }
    
    if (allPokemon.length < battleSize) {
      console.error(`🎲🎲🎲 [RANDOM_BATTLE_MEGA_DEBUG] ❌ Not enough Pokemon: need ${battleSize}, have ${allPokemon.length}`);
      return [];
    }
    
    // Use Math.random() with current timestamp as seed for true randomness
    const randomSeed = Date.now() + Math.random();
    console.log(`🎲🎲🎲 [RANDOM_BATTLE_MEGA_DEBUG] Random seed: ${randomSeed}`);
    
    // Create a completely new shuffled array each time
    const availablePokemon = [...allPokemon];
    console.log(`🎲🎲🎲 [RANDOM_BATTLE_MEGA_DEBUG] Created copy of Pokemon array: ${availablePokemon.length}`);
    
    // Fisher-Yates shuffle with logging
    for (let i = availablePokemon.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availablePokemon[i], availablePokemon[j]] = [availablePokemon[j], availablePokemon[i]];
      
      // Log every 100 swaps to see shuffling in action
      if (i % 100 === 0) {
        console.log(`🎲🎲🎲 [RANDOM_BATTLE_MEGA_DEBUG] Shuffle progress: ${i} remaining`);
      }
    }
    
    // Select the first battleSize Pokemon from shuffled array
    const selectedPokemon = availablePokemon.slice(0, battleSize);
    
    const battleKey = selectedPokemon.map(p => p.id).sort().join('-');
    console.log(`🎲🎲🎲 [RANDOM_BATTLE_MEGA_DEBUG] Generated battle key: ${battleKey}`);
    console.log(`🎲🎲🎲 [RANDOM_BATTLE_MEGA_DEBUG] Selected Pokemon:`, selectedPokemon.map(p => `${p.name}(${p.id})`));
    
    // Check if this is the same as last battle
    if (battleKey === lastGeneratedBattleRef.current) {
      console.warn(`🎲🎲🎲 [RANDOM_BATTLE_MEGA_DEBUG] ⚠️ DUPLICATE BATTLE DETECTED! Regenerating...`);
      // Force regeneration by recursing once
      lastGeneratedBattleRef.current = "";
      return generateRandomBattle(battleType);
    }
    
    lastGeneratedBattleRef.current = battleKey;
    
    console.log(`🎲🎲🎲 [RANDOM_BATTLE_MEGA_DEBUG] ✅ NEW UNIQUE BATTLE: ${selectedPokemon.map(p => p.name).join(' vs ')}`);
    console.log(`🎲🎲🎲 [RANDOM_BATTLE_MEGA_DEBUG] ===== generateRandomBattle END =====`);
    
    return selectedPokemon;
  }, [allPokemon]);

  const enhancedStartNewBattle = useCallback((battleType: BattleType) => {
    const callId = Math.random().toString(36).substring(7);
    console.log(`🧪🧪🧪 [ENHANCED_START_MEGA_DEBUG] ===== enhancedStartNewBattle START =====`);
    console.log(`🧪🧪🧪 [ENHANCED_START_MEGA_DEBUG] Call ID: ${callId}`);
    console.log(`🧪🧪🧪 [ENHANCED_START_MEGA_DEBUG] Battle type: ${battleType}`);
    
    const currentBattleCount = parseInt(localStorage.getItem('pokemon-battle-count') || '0', 10);
    console.log(`🧪🧪🧪 [ENHANCED_START_MEGA_DEBUG] Battle count: ${currentBattleCount}`);

    // ✅ Correctly use refinementQueue from providersData
    const refinementQueue = providersData.refinementQueue;
    console.log(`🧪🧪🧪 [ENHANCED_START_MEGA_DEBUG] refinementQueue exists: ${!!refinementQueue}`);
    console.log(`🧪🧪🧪 [ENHANCED_START_MEGA_DEBUG] refinementQueue hasRefinementBattles: ${refinementQueue?.hasRefinementBattles}`);
    console.log(`🧪🧪🧪 [ENHANCED_START_MEGA_DEBUG] refinementQueue count: ${refinementQueue?.refinementBattleCount}`);
    
    console.log("🧪🧪🧪 [ENHANCED_START_MEGA_DEBUG] Checking for refinement battle...");
    const refinementBattle = refinementQueue?.getNextRefinementBattle?.();
    console.log(`🧪🧪🧪 [ENHANCED_START_MEGA_DEBUG] refinementBattle result:`, refinementBattle);

    if (refinementBattle) {
      console.log(`🧪🧪🧪 [ENHANCED_START_MEGA_DEBUG] Found refinement battle, looking for Pokemon...`);
      const primary = allPokemon.find(p => p.id === refinementBattle.primaryPokemonId);
      const opponent = allPokemon.find(p => p.id === refinementBattle.opponentPokemonId);
      console.log(`🧪🧪🧪 [ENHANCED_START_MEGA_DEBUG] Primary found: ${!!primary} (${primary?.name}), Opponent found: ${!!opponent} (${opponent?.name})`);

      if (primary && opponent) {
        console.log(`✅ [REFINEMENT_USE] Using refinement battle: ${primary.name} vs ${opponent.name}`);
        refinementQueue?.popRefinementBattle?.();
        console.log(`🧪🧪🧪 [ENHANCED_START_MEGA_DEBUG] ===== RETURNING REFINEMENT BATTLE =====`);
        return [primary, opponent];
      } else {
        console.warn(`❌ [REFINEMENT_USE] Refinement battle referenced missing Pokémon:`, refinementBattle);
        console.warn(`❌ [REFINEMENT_USE] allPokemon contains IDs: ${allPokemon.slice(0, 5).map(p => p.id).join(', ')}... (showing first 5)`);
        refinementQueue?.popRefinementBattle?.(); // Remove broken entry to avoid infinite skip
      }
    } else {
      console.log(`🧪🧪🧪 [ENHANCED_START_MEGA_DEBUG] No refinement battle available, falling back to random`);
    }

    // 🧠 CRITICAL FIX: Use our new random battle generator
    console.log(`🧪🧪🧪 [ENHANCED_START_MEGA_DEBUG] Calling generateRandomBattle...`);
    const result = generateRandomBattle(battleType);
    if (result && result.length > 0) {
      console.log(`✅ [ENHANCED_START_MEGA_DEBUG] New random battle generated: ${result.map(p => p.name).join(', ')}`);
      console.log(`🧪🧪🧪 [ENHANCED_START_MEGA_DEBUG] ===== RETURNING RANDOM BATTLE =====`);
      return result;
    } else {
      console.warn(`❌ [ENHANCED_START_MEGA_DEBUG] No battle generated, result is:`, result);
      console.log(`🧪🧪🧪 [ENHANCED_START_MEGA_DEBUG] ===== RETURNING EMPTY ARRAY =====`);
      return [];
    }
  }, [allPokemon, providersData, generateRandomBattle]);

  return {
    stateManagerData,
    providersData,
    enhancedStartNewBattle
  };
};
