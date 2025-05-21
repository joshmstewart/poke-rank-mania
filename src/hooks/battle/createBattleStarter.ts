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
  // Track consecutive non-suggestion battles to ensure we don't go too long without them
  let consecutiveNonSuggestionBattles = 0;
  
  // Initialize suggestion tracking
  if (suggestedPokemon.length > 0) {
    suggestedPokemon.forEach(p => suggested.set(p.id, p));
    console.log(`🎮 Battle Starter: Tracking ${suggested.size} Pokemon with suggestions`);
  }

  // Track wins/losses for lower tier Pokemon to identify potential promotions
  let lowerTierLosses = new Map<number, number>();
  
  /**
   * Strategy: Select Pokemon with pending suggestions
   * Specifically selects Pokemon with active suggestions and appropriate opponents
   */
  function selectSuggestedPokemon(battleType: BattleType): Pokemon[] | null {
    if (suggested.size === 0) return null;
    
    const battleSize = battleType === "triplets" ? 3 : 2;
    const result: Pokemon[] = [];
    
    // Get a random suggestion from the map
    const suggestedIds = Array.from(suggested.keys());
    // Shuffle the ids to ensure we don't always pick the same one
    const shuffledIds = [...suggestedIds].sort(() => Math.random() - 0.5);
    
    // Try to find a suggestion we haven't used too recently
    let selectedId = null;
    for (const id of shuffledIds) {
      if (!recentlyUsed.has(id)) {
        selectedId = id;
        break;
      }
    }
    
    // If all have been used recently, just pick one randomly
    if (selectedId === null && shuffledIds.length > 0) {
      selectedId = shuffledIds[0];
    }
    
    if (selectedId !== null) {
      const suggestedPokemon = allPokemon.find(p => p.id === selectedId);
      const suggestedData = rankedPokemon.find(p => p.id === selectedId);
      
      if (suggestedPokemon && suggestedData) {
        result.push(suggestedPokemon);
        console.log(`🎯 Battle includes suggested Pokemon: ${suggestedPokemon.name}`);
        
        // Find an appropriate opponent based on the suggestion direction
        const suggestion = suggestedData.suggestedAdjustment;
        
        if (suggestion) {
          const currentRank = rankedPokemon.findIndex(p => p.id === suggestedPokemon.id);
          
          if (currentRank >= 0) {
            // Determine target rank based on suggestion direction and strength
            const strengthFactor = suggestion.strength || 1;
            const rankOffset = 3 + (strengthFactor * 2); // 5, 7, or 9 positions
            
            let targetRank = suggestion.direction === "up" 
              ? Math.max(0, currentRank - rankOffset) // Move up
              : Math.min(rankedPokemon.length - 1, currentRank + rankOffset); // Move down
              
            // Ensure we don't pick the same Pokemon
            if (targetRank === currentRank) {
              targetRank = suggestion.direction === "up" ? targetRank - 1 : targetRank + 1;
            }
            
            if (targetRank >= 0 && targetRank < rankedPokemon.length) {
              const opponentData = rankedPokemon[targetRank];
              const opponent = allPokemon.find(p => p.id === opponentData.id);
              
              if (opponent && opponent.id !== suggestedPokemon.id) {
                result.push(opponent);
                console.log(`🎮 Selected opponent ${opponent.name} (rank #${targetRank+1}) for suggested Pokemon ${suggestedPokemon.name} (rank #${currentRank+1}, direction: ${suggestion.direction})`);
              }
            }
          }
        }
      }
    }
    
    // If we couldn't find a suitable opponent, or need more for triplets
    while (result.length < battleSize) {
      // Fill remaining spots with appropriate Pokemon
      const eligiblePokemon = allPokemon.filter(p => 
        !result.some(selected => selected.id === p.id)
      );
      
      if (eligiblePokemon.length === 0) break;
      
      const randomPokemon = eligiblePokemon[Math.floor(Math.random() * eligiblePokemon.length)];
      result.push(randomPokemon);
    }
    
    // Only return if we have a valid battle
    return result.length === battleSize ? result : null;
  }
  
  /**
   * Strategy: Select two Pokemon from similar tiers
   * If we have pending suggestions, prioritize those Pokemon
   */
  function selectSimilarTier(battleType: BattleType): Pokemon[] {
    const battleSize = battleType === "triplets" ? 3 : 2;
    const result: Pokemon[] = [];
    
    // First, try with suggestion priority
    const suggestedBattle = selectSuggestedPokemon(battleType);
    if (suggestedBattle) {
      consecutiveNonSuggestionBattles = 0;
      return suggestedBattle;
    }
    
    // If no suggestions, increment counter
    consecutiveNonSuggestionBattles++;
    
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
    
    // If we have active suggestions, give them a very high priority (90%)
    // or if we've gone too many battles without using suggestions
    if ((suggested.size > 0 && Math.random() < 0.9) || consecutiveNonSuggestionBattles >= 5) {
      // Try to create a suggestion-focused battle
      const suggestedBattle = selectSuggestedPokemon(battleType);
      
      if (suggestedBattle) {
        selectedPokemon = suggestedBattle;
        consecutiveNonSuggestionBattles = 0;
      } else {
        // If no suggestion battle could be created, fall back to regular selection
        selectedPokemon = selectSimilarTier(battleType);
      }
    } else {
      // Otherwise, use a mix of strategies
      const strategyRoll = Math.random();
      
      if (strategyRoll < 0.6) {
        // 60% chance: Select Pokemon from similar tiers
        selectedPokemon = selectSimilarTier(battleType);
      } else if (strategyRoll < 0.8) {
        // 20% chance: Select Pokemon from different tiers
        const differentTiersPokemon = selectDifferentTiers(battleType);
        selectedPokemon = differentTiersPokemon || selectSimilarTier(battleType);
      } else {
        // 20% chance: Select underrepresented Pokemon
        const underrepresentedPokemon = selectUnderrepresented(battleType);
        selectedPokemon = underrepresentedPokemon || selectSimilarTier(battleType);
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
