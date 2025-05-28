
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { validateBattlePokemon } from "@/services/pokemon/api/utils";

export const createBattleGenerator = (
  allPokemonForGeneration: Pokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>
) => {
  // PERFORMANCE FIX: Use more efficient data structures
  const recentlySeenSet = new Set<number>();
  const recentPairsSet = new Set<string>();
  let battleCountRef = 0;
  const maxRecentSize = 50; // Reduced from 100
  const maxPairsSize = 25; // Reduced from 50

  console.log(`⚡ [PERFORMANCE_FIX] Battle generator optimized with ${allPokemonForGeneration.length} Pokemon`);

  // PERFORMANCE FIX: Pre-compute weighted pools for faster selection
  const createWeightedPool = (excludeIds: Set<number>, size: number): Pokemon[] => {
    const available = allPokemonForGeneration.filter(p => !excludeIds.has(p.id));
    
    // Simple random selection for better performance
    const selected: Pokemon[] = [];
    const indices = new Set<number>();
    
    while (selected.length < size && indices.size < available.length) {
      const randomIndex = Math.floor(Math.random() * available.length);
      if (!indices.has(randomIndex)) {
        indices.add(randomIndex);
        selected.push(available[randomIndex]);
      }
    }
    
    return selected;
  };

  const getTierBattlePair = (battleType: BattleType): Pokemon[] => {
    const battleSize = battleType === "pairs" ? 2 : 3;

    // PERFORMANCE FIX: Simpler battle generation
    let selectedBattle: Pokemon[] = [];
    let attempts = 0;
    const maxAttempts = 3; // Reduced from 5
    
    while (attempts < maxAttempts && selectedBattle.length < battleSize) {
      // Get candidates excluding recently seen
      const candidates = createWeightedPool(recentlySeenSet, battleSize * 3);
      
      if (candidates.length >= battleSize) {
        selectedBattle = candidates.slice(0, battleSize);
        
        // Check for recent pairs (simplified)
        const battleIds = selectedBattle.map(p => p.id).sort().join('-');
        if (!recentPairsSet.has(battleIds) || attempts >= maxAttempts - 1) {
          break;
        }
      }
      
      attempts++;
    }

    // Fallback to pure random if needed
    if (selectedBattle.length < battleSize) {
      const shuffled = [...allPokemonForGeneration].sort(() => Math.random() - 0.5);
      selectedBattle = shuffled.slice(0, battleSize);
    }

    // PERFORMANCE FIX: Efficient memory management
    selectedBattle.forEach(p => {
      recentlySeenSet.add(p.id);
      if (recentlySeenSet.size > maxRecentSize) {
        const oldestEntries = Array.from(recentlySeenSet).slice(0, 10);
        oldestEntries.forEach(id => recentlySeenSet.delete(id));
      }
    });

    const battleIds = selectedBattle.map(p => p.id).sort().join('-');
    recentPairsSet.add(battleIds);
    if (recentPairsSet.size > maxPairsSize) {
      const oldestPairs = Array.from(recentPairsSet).slice(0, 5);
      oldestPairs.forEach(pair => recentPairsSet.delete(pair));
    }

    const validatedBattle = validateBattlePokemon(selectedBattle);
    console.log("⚡ [PERFORMANCE_FIX] Fast battle generated:", validatedBattle.map(p => `${p.name} (${p.id})`).join(', '));
    
    return validatedBattle;
  };

  const startNewBattle = (battleType: BattleType): Pokemon[] => {
    battleCountRef++;
    const battleSize = battleType === "pairs" ? 2 : 3;
    
    console.log(`⚡ [PERFORMANCE_FIX] Quick battle ${battleCountRef} generation`);
    const result = getTierBattlePair(battleType);
    
    if (result.length < battleSize) {
      console.log("⚠️ Fallback to simple random selection");
      const fallback = [...allPokemonForGeneration]
        .sort(() => Math.random() - 0.5)
        .slice(0, battleSize);
      const validatedFallback = validateBattlePokemon(fallback);
      setCurrentBattle(validatedFallback);
      return validatedFallback;
    }

    // PERFORMANCE FIX: Dispatch events asynchronously to avoid blocking
    setTimeout(() => {
      const battleCreatedEvent = new CustomEvent('battle-created', {
        detail: { 
          pokemonIds: result.map(p => p.id),
          pokemonNames: result.map(p => p.name)
        }
      });
      document.dispatchEvent(battleCreatedEvent);
    }, 0);
    
    setCurrentBattle(result);
    return result;
  };

  return { startNewBattle };
};
