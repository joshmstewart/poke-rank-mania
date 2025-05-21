import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { Rating } from "ts-trueskill";
import { BattleType } from "./types";

interface RankedPokemonWithTier extends RankedPokemon {
  tier?: number;
}

/**
 * Creates a battle starter with various strategies for Pokemon selection
 */
export function createBattleStarter(
  allPokemon: Pokemon[],
  availablePokemon: Pokemon[],
  rankedPokemon: RankedPokemon[] = [],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  suggestedPokemon: RankedPokemon[] = []
) {
  // Keep track of recently used Pokemon to avoid repeats
  const recentlyUsed = new Set<number>();
  // Track Pokemon that have been suggested for ranking adjustments
  const suggested = new Map<number, RankedPokemon>();
  
  // Initialize suggestion tracking
  if (suggestedPokemon.length > 0) {
    suggestedPokemon.forEach(p => suggested.set(p.id, p));
    console.log(`🎮 Battle Starter: Tracking ${suggested.size} Pokemon with suggestions`);
  }

  // Track wins/losses for lower tier Pokemon to identify potential promotions
  let lowerTierLosses = new Map<number, number>();
  
  /**
   * Strategy: Select two Pokemon from similar tiers
   * If we have pending suggestions, prioritize those Pokemon
   */
  function selectSimilarTier(battleType: BattleType): Pokemon[] {
    const battleSize = battleType === "triplets" ? 3 : 2;
    const result: Pokemon[] = [];
    
    // First, prioritize Pokemon with pending suggestions
    if (suggested.size > 0 && Math.random() < 0.8) { // 80% chance to use a suggested Pokemon if available
      const suggestedIds = Array.from(suggested.keys());
      const randomSuggestedId = suggestedIds[Math.floor(Math.random() * suggestedIds.length)];
      const suggestedPokemon = allPokemon.find(p => p.id === randomSuggestedId);
      
      if (suggestedPokemon) {
        result.push(suggestedPokemon);
        console.log(`🎯 Battle includes suggested Pokemon: ${suggestedPokemon.name}`);
        
        // Find a suitable opponent based on the suggestion direction
        const suggestion = (suggestedPokemon as RankedPokemon).suggestedAdjustment;
        if (suggestion) {
          const currentRank = rankedPokemon.findIndex(p => p.id === suggestedPokemon.id);
          if (currentRank >= 0) {
            let targetRank: number;
            
            // Choose opponent based on suggestion direction (up or down)
            if (suggestion.direction === "up") {
              // For upward movement, battle against higher ranked Pokemon
              targetRank = Math.max(0, currentRank - (5 + suggestion.strength * 3));
            } else {
              // For downward movement, battle against lower ranked Pokemon
              targetRank = Math.min(rankedPokemon.length - 1, currentRank + (5 + suggestion.strength * 3));
            }
            
            if (targetRank >= 0 && targetRank < rankedPokemon.length) {
              const opponent = allPokemon.find(p => p.id === rankedPokemon[targetRank].id);
              if (opponent && opponent.id !== suggestedPokemon.id) {
                result.push(opponent);
                console.log(`🎮 Selected appropriate opponent ${opponent.name} for suggestion`);
              }
            }
          }
        }
      }
    }
    
    // If we still need more Pokemon, select normally
    while (result.length < battleSize) {
      // Use standard selection logic to fill remaining spots
      const eligiblePokemon = allPokemon.filter(p => 
        !recentlyUsed.has(p.id) && !result.some(selected => selected.id === p.id)
      );
      
      if (eligiblePokemon.length === 0) {
        // If no eligible Pokemon, reset recently used and try again
        recentlyUsed.clear();
        continue;
      }
      
      const randomPokemon = eligiblePokemon[Math.floor(Math.random() * eligiblePokemon.length)];
      result.push(randomPokemon);
    }

    // Record these Pokemon as recently used
    result.forEach(p => recentlyUsed.add(p.id));
    
    // Limit the recently used set to avoid memory issues
    if (recentlyUsed.size > 30) {
      const idsToRemove = Array.from(recentlyUsed).slice(0, 10);
      idsToRemove.forEach(id => recentlyUsed.delete(id));
    }

    return result;
  }
  
  /**
   * Strategy: Select Pokemon from different tiers for more varied battles
   */
  function selectDifferentTiers(battleType: BattleType): Pokemon[] {
    const battleSize = battleType === "triplets" ? 3 : 2;
    const result: Pokemon[] = [];
    
    // Divide Pokemon into tiers based on their ratings
    const tieredPokemon: RankedPokemonWithTier[] = [];
    
    // If we have rankings, use them to create tiers
    if (rankedPokemon.length > 0) {
      // Create a copy with tier information
      tieredPokemon.push(...rankedPokemon.map((p, idx) => ({
        ...p,
        tier: Math.floor(idx / 10) // Every 10 Pokemon is a new tier
      })));
    } else {
      // Without rankings, just use random selection
      return selectSimilarTier(battleType);
    }
    
    // Try to select Pokemon from different tiers
    const tiers = Array.from(new Set(tieredPokemon.map(p => p.tier)));
    
    if (tiers.length < 2) {
      // Not enough tiers, fall back to similar tier selection
      return selectSimilarTier(battleType);
    }
    
    // Select Pokemon from different tiers
    const selectedTiers = tiers.sort(() => Math.random() - 0.5).slice(0, battleSize);
    
    for (const tier of selectedTiers) {
      const tierPokemon = tieredPokemon.filter(p => 
        p.tier === tier && 
        !recentlyUsed.has(p.id) && 
        !result.some(selected => selected.id === p.id)
      );
      
      if (tierPokemon.length === 0) continue;
      
      const randomPokemon = tierPokemon[Math.floor(Math.random() * tierPokemon.length)];
      const originalPokemon = allPokemon.find(p => p.id === randomPokemon.id);
      
      if (originalPokemon) {
        result.push(originalPokemon);
      }
      
      if (result.length >= battleSize) break;
    }
    
    // If we couldn't get enough Pokemon, fill with random ones
    while (result.length < battleSize) {
      const eligiblePokemon = allPokemon.filter(p => 
        !recentlyUsed.has(p.id) && !result.some(selected => selected.id === p.id)
      );
      
      if (eligiblePokemon.length === 0) {
        recentlyUsed.clear();
        continue;
      }
      
      const randomPokemon = eligiblePokemon[Math.floor(Math.random() * eligiblePokemon.length)];
      result.push(randomPokemon);
    }
    
    // Record these Pokemon as recently used
    result.forEach(p => recentlyUsed.add(p.id));
    
    return result;
  }
  
  /**
   * Strategy: Select Pokemon that haven't been in many battles
   */
  function selectUnderrepresented(battleType: BattleType): Pokemon[] {
    const battleSize = battleType === "triplets" ? 3 : 2;
    const result: Pokemon[] = [];
    
    // Count battle participation for each Pokemon
    const battleCounts = new Map<number, number>();
    
    rankedPokemon.forEach(p => {
      battleCounts.set(p.id, p.count || 0);
    });
    
    // Sort Pokemon by battle count (ascending)
    const sortedByCount = [...allPokemon].sort((a, b) => {
      const countA = battleCounts.get(a.id) || 0;
      const countB = battleCounts.get(b.id) || 0;
      return countA - countB;
    });
    
    // Select Pokemon with fewest battles that haven't been recently used
    for (const pokemon of sortedByCount) {
      if (!recentlyUsed.has(pokemon.id) && !result.some(p => p.id === pokemon.id)) {
        result.push(pokemon);
        
        if (result.length >= battleSize) break;
      }
    }
    
    // If we couldn't get enough Pokemon, fill with random ones
    while (result.length < battleSize) {
      const eligiblePokemon = allPokemon.filter(p => 
        !recentlyUsed.has(p.id) && !result.some(selected => selected.id === p.id)
      );
      
      if (eligiblePokemon.length === 0) {
        recentlyUsed.clear();
        continue;
      }
      
      const randomPokemon = eligiblePokemon[Math.floor(Math.random() * eligiblePokemon.length)];
      result.push(randomPokemon);
    }
    
    // Record these Pokemon as recently used
    result.forEach(p => recentlyUsed.add(p.id));
    
    return result;
  }

  /**
   * Start a new battle using selection strategies
   */
  function startNewBattle(battleType: BattleType = "pairs"): Pokemon[] {
    // Ensure we have available Pokemon
    if (!allPokemon || allPokemon.length < 2) {
      console.error("Not enough Pokemon available for battle");
      return [];
    }
    
    // Choose a strategy based on various factors
    let selectedPokemon: Pokemon[] = [];
    
    // If we have suggestions, prioritize those Pokemon
    if (suggested.size > 0 && Math.random() < 0.8) {
      selectedPokemon = selectSimilarTier(battleType);
    } else {
      // Otherwise, use a mix of strategies
      const strategyRoll = Math.random();
      
      if (strategyRoll < 0.6) {
        // 60% chance: Select Pokemon from similar tiers
        selectedPokemon = selectSimilarTier(battleType);
      } else if (strategyRoll < 0.8) {
        // 20% chance: Select Pokemon from different tiers
        selectedPokemon = selectDifferentTiers(battleType);
      } else {
        // 20% chance: Select underrepresented Pokemon
        selectedPokemon = selectUnderrepresented(battleType);
      }
    }
    
    // Update current battle with selected Pokemon
    setCurrentBattle(selectedPokemon);
    
    return selectedPokemon;
  }
  
  // Track when lower-tier Pokemon lose to higher-tier ones
  // This helps identify misplaced Pokemon
  function trackLowerTierLoss(pokemonId: number) {
    const count = (lowerTierLosses.get(pokemonId) || 0) + 1;
    lowerTierLosses.set(pokemonId, count);
    return count;
  }

  return {
    startNewBattle,
    trackLowerTierLoss
  };
}
