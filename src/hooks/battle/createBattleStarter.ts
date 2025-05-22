import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "./types";

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
  // Track the last time we used each suggestion to avoid repeating the same one
  const lastUsedSuggestion = new Map<number, number>();
  // Count battles to use as a reference for when suggestions were last used
  let battleCounter = 0;
  // Keep track of pairs that have fought before to avoid repetitive matchups
  const previousMatchups = new Set<string>();
  
  // Initialize suggestion tracking
  if (suggestedPokemon.length > 0) {
    suggestedPokemon.forEach(p => suggested.set(p.id, p));
    console.log(`🎮 Battle Starter: Tracking ${suggested.size} Pokemon with suggestions`);
  }

  /**
   * Strategy: Select Pokemon with pending suggestions
   * Specifically selects Pokemon with active suggestions and appropriate opponents
   */
  function selectSuggestedPokemon(battleType: BattleType): Pokemon[] | null {
    if (suggested.size === 0) return null;
    
    const battleSize = battleType === "triplets" ? 3 : 2;
    const result: Pokemon[] = [];
    
    // Get all suggestions from the map
    const suggestedIds = Array.from(suggested.keys());
    if (suggestedIds.length === 0) return null;
    
    // Sort suggestions to prioritize those we haven't used recently
    battleCounter++;
    const sortedIds = suggestedIds.sort((a, b) => {
      const lastUsedA = lastUsedSuggestion.get(a) || 0;
      const lastUsedB = lastUsedSuggestion.get(b) || 0;
      return lastUsedA - lastUsedB; // Prioritize suggestions we haven't used in a while
    });
    
    // Try to find a suggestion we haven't used recently
    let selectedId = null;
    for (const id of sortedIds) {
      // Check if we've used this suggestion recently
      const lastUsed = lastUsedSuggestion.get(id) || 0;
      const notUsedRecently = (battleCounter - lastUsed) > 3;
      
      if (notUsedRecently || !lastUsedSuggestion.has(id)) {
        selectedId = id;
        break;
      }
    }
    
    // If all have been used recently, just pick one randomly
    if (selectedId === null && sortedIds.length > 0) {
      // Use weighted random selection - prefer ones used less recently
      const weights = sortedIds.map(id => {
        const lastUsed = lastUsedSuggestion.get(id) || 0;
        return Math.max(1, battleCounter - lastUsed); // Higher weight for less recently used
      });
      
      // Weighted random selection
      selectedId = weightedRandomChoice(sortedIds, weights);
    }
    
    if (selectedId !== null) {
      const suggestedPokemon = allPokemon.find(p => p.id === selectedId);
      const suggestedData = rankedPokemon.find(p => p.id === selectedId);
      
      if (suggestedPokemon && suggestedData) {
        result.push(suggestedPokemon);
        lastUsedSuggestion.set(selectedId, battleCounter);
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
            
            // Find an opponent that hasn't been in a matchup with this Pokemon recently
            let foundUnusedOpponent = false;
            const potentialOpponents: {pokemon: Pokemon, rank: number}[] = [];
            
            // Look at Pokemon around the target rank
            const rangeStart = Math.max(0, targetRank - 5);
            const rangeEnd = Math.min(rankedPokemon.length - 1, targetRank + 5);
            
            for (let i = rangeStart; i <= rangeEnd; i++) {
              if (i === currentRank) continue; // Skip the suggested Pokemon itself
              
              const opponentData = rankedPokemon[i];
              const opponent = allPokemon.find(p => p.id === opponentData.id);
              
              if (opponent) {
                const matchupKey = [suggestedPokemon.id, opponent.id].sort().join('-');
                const isRecentMatchup = previousMatchups.has(matchupKey);
                
                if (!isRecentMatchup) {
                  potentialOpponents.push({pokemon: opponent, rank: i});
                  foundUnusedOpponent = true;
                  break;
                } else {
                  // Still add it, but we'll prefer unused matchups
                  potentialOpponents.push({pokemon: opponent, rank: i});
                }
              }
            }
            
            // Select an opponent (prefer unused matchups)
            if (potentialOpponents.length > 0) {
              const selectedOpponent = foundUnusedOpponent 
                ? potentialOpponents.find(o => {
                    const matchupKey = [suggestedPokemon.id, o.pokemon.id].sort().join('-');
                    return !previousMatchups.has(matchupKey);
                  }) 
                : potentialOpponents[0];
              
              if (selectedOpponent) {
                result.push(selectedOpponent.pokemon);
                console.log(`🎮 Selected opponent ${selectedOpponent.pokemon.name} (rank #${selectedOpponent.rank+1}) for suggested Pokemon ${suggestedPokemon.name} (rank #${currentRank+1}, direction: ${suggestion.direction})`);
                
                // Record this matchup
                const matchupKey = [suggestedPokemon.id, selectedOpponent.pokemon.id].sort().join('-');
                previousMatchups.add(matchupKey);
                
                // Limit the size of previous matchups set
                if (previousMatchups.size > 50) {
                  const matchupArray = Array.from(previousMatchups);
                  const toRemove = matchupArray.slice(0, 20);
                  toRemove.forEach(m => previousMatchups.delete(m));
                }
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
        !result.some(selected => selected.id === p.id) &&
        !recentlyUsed.has(p.id)
      );
      
      if (eligiblePokemon.length === 0) {
        // If no eligible Pokemon without recent use, just use any that aren't in the current battle
        const anyEligible = allPokemon.filter(p => 
          !result.some(selected => selected.id === p.id)
        );
        
        if (anyEligible.length === 0) break;
        
        const randomPokemon = anyEligible[Math.floor(Math.random() * anyEligible.length)];
        result.push(randomPokemon);
      } else {
        // Randomly select from eligible Pokemon
        const randomPokemon = eligiblePokemon[Math.floor(Math.random() * eligiblePokemon.length)];
        result.push(randomPokemon);
      }
    }
    
    // Record these Pokemon as recently used
    result.forEach(p => recentlyUsed.add(p.id));
    
    // Only return if we have a valid battle
    return result.length === battleSize ? result : null;
  }

/**
 * Explicitly forces a battle with suggested Pokémon ONLY.
 */
function selectSuggestedPokemonForced(battleType: BattleType): Pokemon[] | null {
  const forcedSuggestions = rankedPokemon.filter(p => 
    p.suggestedAdjustment && !p.suggestedAdjustment.used
  );

  if (forcedSuggestions.length === 0) return null;

  const battleSize = battleType === "triplets" ? 3 : 2;
  const result: Pokemon[] = [];

  // Explicitly pick a suggested Pokémon that has appeared least recently
  const sortedSuggestions = forcedSuggestions.sort((a, b) => {
    const lastUsedA = lastUsedSuggestion.get(a.id) || 0;
    const lastUsedB = lastUsedSuggestion.get(b.id) || 0;
    return lastUsedA - lastUsedB; // Prioritize least recently used
  });

  const selectedSuggestion = sortedSuggestions[0];
  const suggestedPokemon = allPokemon.find(p => p.id === selectedSuggestion.id);
  if (!suggestedPokemon) return null;

  result.push(suggestedPokemon);
  lastUsedSuggestion.set(selectedSuggestion.id, battleCounter++);

  // Determine rank offset clearly based on suggestion direction
  const currentRank = rankedPokemon.findIndex(p => p.id === suggestedPokemon.id);
  const direction = selectedSuggestion.suggestedAdjustment.direction;
  const rankOffset = direction === "up" ? -5 : 5; // clearly moving rank
  let opponentRank = currentRank + rankOffset;

  // Explicitly clamp rank to valid range
  opponentRank = Math.max(0, Math.min(rankedPokemon.length - 1, opponentRank));
  
  // Explicitly pick a suitable opponent
  let opponentPokemonData = rankedPokemon[opponentRank];
  let opponentPokemon = allPokemon.find(p => p.id === opponentPokemonData.id);

  // Explicitly verify opponent is valid and not the suggested Pokémon itself
  if (!opponentPokemon || opponentPokemon.id === suggestedPokemon.id) {
    opponentPokemon = shuffleArray(allPokemon).find(p => p.id !== suggestedPokemon.id);
  }

  if (!opponentPokemon) return null;

  result.push(opponentPokemon);

  // Fill in extra slots randomly if triplet battle
  while (result.length < battleSize) {
    const randomPokemon = shuffleArray(allPokemon).find(p => 
      !result.includes(p) && !recentlyUsed.has(p.id)
    );
    if (!randomPokemon) break;
    result.push(randomPokemon);
  }

  // Mark used recently
  result.forEach(p => recentlyUsed.add(p.id));

  // Clear old recently used if exceeding size explicitly
  if (recentlyUsed.size > 30) {
    Array.from(recentlyUsed).slice(0, 10).forEach(id => recentlyUsed.delete(id));
  }

  console.log("✅ Forced explicit suggestion battle created:", result.map(p => p.name));
  return result;
}


  
  /**
   * Start a new battle using selection strategies
   */
  function startNewBattle(battleType: BattleType = "pairs", forceSuggestionPriority: boolean = false): Pokemon[] {
    // Ensure we have available Pokemon
    if (!allPokemon || allPokemon.length < 2) {
      console.error("Not enough Pokemon available for battle");
      return [];
    }

    const battleSize = battleType === "triplets" ? 3 : 2;
    let selectedPokemon: Pokemon[] = [];
    
    // Update our suggestion list based on the latest ranking data
    suggested.clear();
    rankedPokemon
      .filter(p => p.suggestedAdjustment && !p.suggestedAdjustment.used)
      .forEach(p => suggested.set(p.id, p));
      
    if (suggested.size > 0) {
      console.log(`🎮 Battle Starter: Updated suggestion tracking with ${suggested.size} Pokemon`);
    }
    
    // If forcing suggestion priority OR we have active suggestions with high priority (95%)
    // OR if we've gone too many battles without using suggestions
    const suggestionProbability = forceSuggestionPriority ? 1.0 : 0.85;
    
    if ((forceSuggestionPriority) || 
        (suggested.size > 0 && Math.random() < suggestionProbability) || 
        (consecutiveNonSuggestionBattles >= 3 && suggested.size > 0)) {
      
      if (forceSuggestionPriority) {
        console.log("🚨 FORCING suggestion priority battle");
      }
      
      // Try to create a suggestion-focused battle
      const suggestedBattle = forceSuggestionPriority 
  ? selectSuggestedPokemonForced(battleType)
  : selectSuggestedPokemon(battleType);

      
      if (suggestedBattle) {
        selectedPokemon = suggestedBattle;
        consecutiveNonSuggestionBattles = 0;
        
        // Verify if the battle contains a suggestion
        const hasSuggestion = suggestedBattle.some(p => {
          return rankedPokemon.some(rp => 
            rp.id === p.id && 
            rp.suggestedAdjustment && 
            !rp.suggestedAdjustment.used
          );
        });
        
        if (hasSuggestion) {
          console.log("✅ Successfully created a battle with suggested Pokemon");
        }
      } else {
        // If no suggestion battle could be created, create a random battle
        consecutiveNonSuggestionBattles++;
        console.log("⚠️ Could not create suggestion battle, using random selection");
        selectedPokemon = shuffleArray(availablePokemon)
          .filter(p => !recentlyUsed.has(p.id))
          .slice(0, battleSize);
        
        // If we don't have enough Pokemon, use any available
        if (selectedPokemon.length < battleSize) {
          selectedPokemon = shuffleArray(availablePokemon).slice(0, battleSize);
        }
      }
    } else {
      // Otherwise, create a random battle
      consecutiveNonSuggestionBattles++;
      
      // Prefer Pokemon not used recently
      const notRecentlyUsed = availablePokemon.filter(p => !recentlyUsed.has(p.id));
      if (notRecentlyUsed.length >= battleSize) {
        selectedPokemon = shuffleArray(notRecentlyUsed).slice(0, battleSize);
      } else {
        selectedPokemon = shuffleArray(availablePokemon).slice(0, battleSize);
      }
    }
    
    // Add these Pokemon to the recently used set
    selectedPokemon.forEach(p => recentlyUsed.add(p.id));
    
    // Limit the size of the recently used set
    if (recentlyUsed.size > 30) {
      const idsToRemove = Array.from(recentlyUsed).slice(0, 10);
      idsToRemove.forEach(id => recentlyUsed.delete(id));
    }
    
    // Update current battle with selected Pokemon
    setCurrentBattle(selectedPokemon);
    
    return selectedPokemon;
  }
  
  // Helper function to shuffle an array
  function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  // Helper function for weighted random selection
  function weightedRandomChoice<T>(items: T[], weights: number[]): T {
    if (items.length !== weights.length || items.length === 0) {
      throw new Error('Items and weights must be non-empty arrays of the same length');
    }
    
    // Calculate sum of weights
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    // Generate a random value between 0 and the sum of weights
    const randomValue = Math.random() * totalWeight;
    
    // Find the item corresponding to the random value
    let weightSum = 0;
    for (let i = 0; i < items.length; i++) {
      weightSum += weights[i];
      if (randomValue <= weightSum) {
        return items[i];
      }
    }
    
    // Fallback
    return items[items.length - 1];
  }

  return { startNewBattle, selectSuggestedPokemonForced };

}
