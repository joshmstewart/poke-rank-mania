import { useState, useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { validateBattlePokemon } from "@/services/pokemon/api/utils";

export const useBattleGeneration = (allPokemon: Pokemon[]) => {
  const [recentlyUsedPokemon, setRecentlyUsedPokemon] = useState<Set<number>>(new Set());

  const generateNewBattle = useCallback((battleType: BattleType, battlesCompleted: number, refinementQueue?: any): Pokemon[] => {
    const battleSize = battleType === "pairs" ? 2 : 3;
    const battleNumber = battlesCompleted + 1;
    
    console.log(`🎲🎲🎲 [BATTLE_GENERATION_DEBUG] ===== Battle #${battleNumber} Generation =====`);
    console.log(`🎲🎲🎲 [BATTLE_GENERATION_DEBUG] Battle size: ${battleSize}`);
    console.log(`🎲🎲🎲 [BATTLE_GENERATION_DEBUG] Total Pokemon received: ${allPokemon.length}`);
    
    // COMPREHENSIVE DEBUGGING: Analyze the input Pokemon dataset
    if (allPokemon.length > 0) {
      const pokemonIds = allPokemon.map(p => p.id);
      const minId = Math.min(...pokemonIds);
      const maxId = Math.max(...pokemonIds);
      console.log(`🎲🎲🎲 [INPUT_ANALYSIS] Pokemon ID range: ${minId} - ${maxId}`);
      
      // Detailed distribution analysis
      const distributions = {
        '1-150': pokemonIds.filter(id => id >= 1 && id <= 150).length,
        '151-300': pokemonIds.filter(id => id >= 151 && id <= 300).length,
        '301-450': pokemonIds.filter(id => id >= 301 && id <= 450).length,
        '451-600': pokemonIds.filter(id => id >= 451 && id <= 600).length,
        '601-750': pokemonIds.filter(id => id >= 601 && id <= 750).length,
        '751-900': pokemonIds.filter(id => id >= 751 && id <= 900).length,
        '901-1025': pokemonIds.filter(id => id >= 901 && id <= 1025).length,
        '1026+': pokemonIds.filter(id => id >= 1026).length,
      };
      console.log(`🎲🎲🎲 [INPUT_ANALYSIS] Pokemon distribution by ID ranges:`, distributions);
      
      // Sample Pokemon from different ranges
      const sampleLow = allPokemon.filter(p => p.id <= 150).slice(0, 3).map(p => `${p.name}(${p.id})`);
      const sampleMid = allPokemon.filter(p => p.id >= 400 && p.id <= 600).slice(0, 3).map(p => `${p.name}(${p.id})`);
      const sampleHigh = allPokemon.filter(p => p.id >= 800).slice(0, 3).map(p => `${p.name}(${p.id})`);
      
      console.log(`🎲🎲🎲 [INPUT_ANALYSIS] Sample low ID Pokemon: [${sampleLow.join(', ')}]`);
      console.log(`🎲🎲🎲 [INPUT_ANALYSIS] Sample mid ID Pokemon: [${sampleMid.join(', ')}]`);
      console.log(`🎲🎲🎲 [INPUT_ANALYSIS] Sample high ID Pokemon: [${sampleHigh.join(', ')}]`);
    }
    
    console.log(`🎲🎲🎲 [BATTLE_GENERATION_DEBUG] Recently used Pokemon count: ${recentlyUsedPokemon.size}`);
    console.log(`🎲🎲🎲 [BATTLE_GENERATION_DEBUG] Recently used IDs: [${Array.from(recentlyUsedPokemon).slice(0, 10).join(', ')}${recentlyUsedPokemon.size > 10 ? '...' : ''}]`);
    
    // CRITICAL FIX: Check for refinement battles FIRST and consume them properly
    if (refinementQueue && refinementQueue.hasRefinementBattles && refinementQueue.refinementBattleCount > 0) {
      console.log(`🎯 [REFINEMENT_PRIORITY] ===== REFINEMENT BATTLE DETECTED =====`);
      console.log(`🎯 [REFINEMENT_PRIORITY] Refinement queue has ${refinementQueue.refinementBattleCount} battles`);
      
      const nextRefinement = refinementQueue.getNextRefinementBattle();
      console.log(`🎯 [REFINEMENT_PRIORITY] Next refinement:`, nextRefinement);
      
      if (nextRefinement) {
        const primary = allPokemon.find(p => p.id === nextRefinement.primaryPokemonId);
        const opponent = allPokemon.find(p => p.id === nextRefinement.opponentPokemonId);
        
        console.log(`🎯 [REFINEMENT_PRIORITY] Primary Pokemon: ${primary?.name} (${primary?.id})`);
        console.log(`🎯 [REFINEMENT_PRIORITY] Opponent Pokemon: ${opponent?.name} (${opponent?.id})`);
        
        if (primary && opponent) {
          const refinementBattle = [primary, opponent];
          const validated = validateBattlePokemon(refinementBattle);
          
          console.log(`🎯 [REFINEMENT_PRIORITY] ✅ RETURNING REFINEMENT BATTLE: ${validated.map(p => p.name).join(' vs ')}`);
          console.log(`🎯 [REFINEMENT_PRIORITY] Reason: ${nextRefinement.reason}`);
          
          setTimeout(() => {
            console.log(`🎯 [REFINEMENT_CONSUMPTION] Consuming refinement battle from queue`);
            refinementQueue.popRefinementBattle();
            console.log(`🎯 [REFINEMENT_CONSUMPTION] Refinement consumed, remaining: ${refinementQueue.refinementBattleCount}`);
          }, 100);
          
          return validated;
        } else {
          console.error(`🎯 [REFINEMENT_PRIORITY] ❌ Could not find Pokemon for refinement - removing from queue`);
          refinementQueue.popRefinementBattle();
          return generateNewBattle(battleType, battlesCompleted, refinementQueue);
        }
      }
    } else {
      console.log(`🎯 [REFINEMENT_PRIORITY] No refinement battles available - proceeding with regular generation`);
    }
    
    if (!allPokemon || allPokemon.length < battleSize) {
      console.error(`🎲🎲🎲 [BATTLE_GENERATION_DEBUG] Not enough Pokemon: need ${battleSize}, have ${allPokemon.length}`);
      return [];
    }
    
    // Step 1: Filter out recently used Pokemon
    let availablePokemon = allPokemon.filter(pokemon => !recentlyUsedPokemon.has(pokemon.id));
    console.log(`🎲🎲🎲 [FILTERING_TRACE] Available after filtering recent: ${availablePokemon.length}`);
    
    // CRITICAL DEBUG: Analyze the available Pokemon distribution after recent filtering
    if (availablePokemon.length > 0) {
      const availableIds = availablePokemon.map(p => p.id);
      const availableMinId = Math.min(...availableIds);
      const availableMaxId = Math.max(...availableIds);
      console.log(`🎲🎲🎲 [FILTERING_TRACE] Available Pokemon ID range: ${availableMinId} - ${availableMaxId}`);
      
      const availableDistributions = {
        '1-150': availableIds.filter(id => id >= 1 && id <= 150).length,
        '151-300': availableIds.filter(id => id >= 151 && id <= 300).length,
        '301-450': availableIds.filter(id => id >= 301 && id <= 450).length,
        '451-600': availableIds.filter(id => id >= 451 && id <= 600).length,
        '601-750': availableIds.filter(id => id >= 601 && id <= 750).length,
        '751-900': availableIds.filter(id => id >= 751 && id <= 900).length,
        '901-1025': availableIds.filter(id => id >= 901 && id <= 1025).length,
        '1026+': availableIds.filter(id => id >= 1026).length,
      };
      console.log(`🎲🎲🎲 [FILTERING_TRACE] Available distribution after recent filter:`, availableDistributions);
    }
    
    // Step 2: Handle insufficient available Pokemon
    if (availablePokemon.length < battleSize) {
      console.log(`🎲🎲🎲 [FILTERING_TRACE] Not enough non-recent Pokemon, reducing recent list`);
      
      const recentArray = Array.from(recentlyUsedPokemon);
      const reducedRecent = new Set(recentArray.slice(-10));
      setRecentlyUsedPokemon(reducedRecent);
      
      availablePokemon = allPokemon.filter(pokemon => !reducedRecent.has(pokemon.id));
      console.log(`🎲🎲🎲 [FILTERING_TRACE] Available after reducing recent list: ${availablePokemon.length}`);
      
      if (availablePokemon.length < battleSize) {
        console.log(`🎲🎲🎲 [FILTERING_TRACE] Still not enough, clearing recent list completely`);
        setRecentlyUsedPokemon(new Set());
        availablePokemon = [...allPokemon];
      }
    }
    
    // ENHANCED RANDOMIZATION: Test multiple randomization approaches
    console.log(`🎲🎲🎲 [RANDOMIZATION_TRACE] Starting randomization with ${availablePokemon.length} Pokemon`);
    
    // Method 1: Simple crypto-random selection
    const cryptoSelected: Pokemon[] = [];
    const availableCopy = [...availablePokemon];
    
    for (let i = 0; i < battleSize && availableCopy.length > 0; i++) {
      const randomArray = new Uint32Array(1);
      crypto.getRandomValues(randomArray);
      const randomIndex = Math.floor((randomArray[0] / (0xFFFFFFFF + 1)) * availableCopy.length);
      
      console.log(`🎲🎲🎲 [RANDOMIZATION_TRACE] Selection ${i + 1}: randomIndex=${randomIndex}, poolSize=${availableCopy.length}`);
      
      const selected = availableCopy.splice(randomIndex, 1)[0];
      cryptoSelected.push(selected);
      
      console.log(`🎲🎲🎲 [RANDOMIZATION_TRACE] Selected: ${selected.name} (ID: ${selected.id})`);
    }
    
    const validated = validateBattlePokemon(cryptoSelected);
    
    console.log(`🎲🎲🎲 [FINAL_SELECTION] Final battle composition:`);
    validated.forEach((pokemon, index) => {
      console.log(`🎲🎲🎲 [FINAL_SELECTION] #${index + 1}: ${pokemon.name} (ID: ${pokemon.id})`);
    });
    
    // Calculate selection statistics
    const selectedIds = validated.map(p => p.id);
    const selectionStats = {
      min: Math.min(...selectedIds),
      max: Math.max(...selectedIds),
      average: Math.round(selectedIds.reduce((sum, id) => sum + id, 0) / selectedIds.length),
      range: Math.max(...selectedIds) - Math.min(...selectedIds)
    };
    console.log(`🎲🎲🎲 [SELECTION_STATS] Selection statistics:`, selectionStats);
    
    // Test if selection is biased towards low numbers
    const lowBias = selectedIds.filter(id => id <= 200).length;
    const midRange = selectedIds.filter(id => id > 200 && id <= 600).length;
    const highRange = selectedIds.filter(id => id > 600).length;
    console.log(`🎲🎲🎲 [BIAS_ANALYSIS] Selection bias: low(≤200)=${lowBias}, mid(201-600)=${midRange}, high(>600)=${highRange}`);
    
    console.log(`🎲🎲🎲 [BATTLE_GENERATION_DEBUG] ===== Generation Complete =====`);
    
    return validated;
  }, [allPokemon, recentlyUsedPokemon]);

  const addToRecentlyUsed = useCallback((pokemon: Pokemon[]) => {
    setRecentlyUsedPokemon(prev => {
      const newRecent = new Set(prev);
      pokemon.forEach(p => {
        newRecent.add(p.id);
        console.log(`📝 [RECENT_TRACKING] Added ${p.name}(${p.id}) to recent list`);
      });
      
      // Keep only the last 20 Pokemon
      if (newRecent.size > 20) {
        const recentArray = Array.from(newRecent);
        const toKeep = recentArray.slice(-20);
        console.log(`📝 [RECENT_TRACKING] Trimmed recent list to last 20: [${toKeep.join(', ')}]`);
        return new Set(toKeep);
      }
      
      console.log(`📝 [RECENT_TRACKING] Recent list now has ${newRecent.size} Pokemon: [${Array.from(newRecent).join(', ')}]`);
      return newRecent;
    });
  }, []);

  const resetRecentlyUsed = useCallback(() => {
    setRecentlyUsedPokemon(new Set());
  }, []);

  return {
    generateNewBattle,
    addToRecentlyUsed,
    resetRecentlyUsed
  };
};
