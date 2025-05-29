
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { validateBattlePokemon } from "@/services/pokemon/api/utils";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";

export const createBattleStarter = (allPokemon: Pokemon[], currentRankings: RankedPokemon[]) => {
  console.log(`🚀 [BATTLE_STARTER] Creating battle starter with ${allPokemon.length} Pokemon (already filtered)`);
  
  // Use the already-filtered Pokemon directly
  const availablePokemon = allPokemon;
  
  // Battle history tracking
  const recentBattleHistory = new Set<string>();
  const recentlySeenPokemon = new Set<number>();
  let battleCount = 0;
  
  const addToHistory = (pokemonIds: number[]) => {
    const sortedIds = pokemonIds.sort((a, b) => a - b);
    const battleKey = sortedIds.join('-');
    recentBattleHistory.add(battleKey);
    
    // Limit history size for memory efficiency
    if (recentBattleHistory.size > 50) {
      const oldestEntries = Array.from(recentBattleHistory).slice(0, 10);
      oldestEntries.forEach(entry => recentBattleHistory.delete(entry));
    }
    
    pokemonIds.forEach(id => {
      recentlySeenPokemon.add(id);
      if (recentlySeenPokemon.size > 100) {
        const oldestSeen = Array.from(recentlySeenPokemon).slice(0, 20);
        oldestSeen.forEach(seenId => recentlySeenPokemon.delete(seenId));
      }
    });
  };

  const isRecentBattle = (pokemonIds: number[]): boolean => {
    const sortedIds = pokemonIds.sort((a, b) => a - b);
    const battleKey = sortedIds.join('-');
    return recentBattleHistory.has(battleKey);
  };

  const startNewBattle = (battleType: BattleType, refinementQueue?: any): Pokemon[] => {
    battleCount++;
    console.log(`🎮 [BATTLE_GENERATION] Starting battle ${battleCount} with ${availablePokemon.length} available Pokemon`);
    
    // CRITICAL FIX: Check refinement queue FIRST before generating random battles
    if (refinementQueue) {
      console.log(`🔍 [REFINEMENT_CHECK] Checking refinement queue...`);
      console.log(`🔍 [REFINEMENT_CHECK] - hasRefinementBattles: ${refinementQueue.hasRefinementBattles}`);
      console.log(`🔍 [REFINEMENT_CHECK] - refinementBattleCount: ${refinementQueue.refinementBattleCount}`);
      
      const refinementBattle = refinementQueue.getNextRefinementBattle?.();
      console.log(`🔍 [REFINEMENT_CHECK] - getNextRefinementBattle result:`, refinementBattle);
      
      if (refinementBattle) {
        const primary = availablePokemon.find(p => p.id === refinementBattle.primaryPokemonId);
        const opponent = availablePokemon.find(p => p.id === refinementBattle.opponentPokemonId);
        
        console.log(`🔍 [REFINEMENT_CHECK] - Primary Pokemon found: ${!!primary} (${primary?.name})`);
        console.log(`🔍 [REFINEMENT_CHECK] - Opponent Pokemon found: ${!!opponent} (${opponent?.name})`);

        if (primary && opponent) {
          console.log(`✅ [REFINEMENT_BATTLE] Using refinement battle: ${primary.name} vs ${opponent.name}`);
          console.log(`✅ [REFINEMENT_BATTLE] Reason: ${refinementBattle.reason}`);
          
          // Remove the battle from the queue
          refinementQueue.popRefinementBattle?.();
          console.log(`✅ [REFINEMENT_BATTLE] Battle removed from queue`);
          
          // Add to history and validate
          const refinementResult = [primary, opponent];
          addToHistory(refinementResult.map(p => p.id));
          const validatedBattle = validateBattlePokemon(refinementResult);
          
          console.log(`✅ [REFINEMENT_BATTLE] Returning refinement battle: ${validatedBattle.map(p => `${p.name} (${p.id})`).join(', ')}`);
          return validatedBattle;
        } else {
          console.warn(`❌ [REFINEMENT_BATTLE] Refinement battle had missing Pokémon:`, refinementBattle);
          console.warn(`❌ [REFINEMENT_BATTLE] Removing invalid battle from queue...`);
          refinementQueue.popRefinementBattle?.();
          // Fall through to normal battle generation
        }
      } else {
        console.log(`🔍 [REFINEMENT_CHECK] No refinement battles available, proceeding with normal generation`);
      }
    } else {
      console.log(`🔍 [REFINEMENT_CHECK] No refinement queue provided`);
    }

    // NORMAL BATTLE GENERATION (only if no refinement battle was used)
    const battleSize = battleType === "pairs" ? 2 : 3;
    console.log(`🎮 [NORMAL_BATTLE] Generating normal ${battleType} battle`);
    
    let selectedBattle: Pokemon[] = [];
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts && selectedBattle.length < battleSize) {
      // Get candidates excluding recently seen
      const candidates = availablePokemon.filter(p => !recentlySeenPokemon.has(p.id));
      const candidatePool = candidates.length >= battleSize ? candidates : availablePokemon;
      
      // Simple random selection
      const shuffled = [...candidatePool].sort(() => Math.random() - 0.5);
      const testBattle = shuffled.slice(0, battleSize);
      const testIds = testBattle.map(p => p.id);
      
      if (!isRecentBattle(testIds) || attempts >= maxAttempts - 1) {
        selectedBattle = testBattle;
        break;
      }
      
      attempts++;
    }

    // Fallback if no valid battle found
    if (selectedBattle.length < battleSize) {
      const fallback = [...availablePokemon].sort(() => Math.random() - 0.5);
      selectedBattle = fallback.slice(0, battleSize);
    }

    // Add to history and validate
    addToHistory(selectedBattle.map(p => p.id));
    const validatedBattle = validateBattlePokemon(selectedBattle);
    
    console.log(`✅ [NORMAL_BATTLE] Generated normal battle: ${validatedBattle.map(p => `${p.name} (${p.id})`).join(', ')}`);
    
    return validatedBattle;
  };

  const trackLowerTierLoss = (loserId: number) => {
    // Implementation for tracking losses
  };

  const resetSuggestionPriority = () => {
    // Implementation for resetting suggestion priority
  };

  // CRITICAL FIX: Add getAllPokemon method for refinement queue access
  const getAllPokemon = () => {
    return availablePokemon;
  };

  return {
    startNewBattle,
    trackLowerTierLoss,
    resetSuggestionPriority,
    getAllPokemon
  };
};
