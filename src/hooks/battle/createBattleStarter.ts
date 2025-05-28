import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { validateBattlePokemon } from "@/services/pokemon/api/utils";

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

  const startNewBattle = (battleType: BattleType): Pokemon[] => {
    battleCount++;
    const battleSize = battleType === "pairs" ? 2 : 3;
    
    console.log(`🎮 [BATTLE_GENERATION] Starting battle ${battleCount} with ${availablePokemon.length} available Pokemon`);
    
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
    
    console.log(`✅ [BATTLE_GENERATION] Generated battle: ${validatedBattle.map(p => `${p.name} (${p.id})`).join(', ')}`);
    
    return validatedBattle;
  };

  const trackLowerTierLoss = (loserId: number) => {
    // Implementation for tracking losses
  };

  const resetSuggestionPriority = () => {
    // Implementation for resetting suggestion priority
  };

  return {
    startNewBattle,
    trackLowerTierLoss,
    resetSuggestionPriority
  };
};
