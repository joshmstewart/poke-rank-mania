
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
      // CHANGE: Get the RankedPokemon directly from rankedPokemon array
      const suggestedPokemonData = rankedPokemon.find(p => p.id === selectedId);
      
      if (suggestedPokemonData) {
        // CHANGE: Push the RankedPokemon object directly
        result.push(suggestedPokemonData);
        lastUsedSuggestion.set(selectedId, battleCounter);
        console.log(`🎯 Battle includes suggested Pokemon: ${suggestedPokemonData.name}`);
        
        // Find an appropriate opponent based on the suggestion direction
        const suggestion = suggestedPokemonData.suggestedAdjustment;
        
        if (suggestion) {
          const currentRank = rankedPokemon.findIndex(p => p.id === suggestedPokemonData.id);
          
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
            const potentialOpponents: {pokemon: RankedPokemon, rank: number}[] = [];
            
            // Look at Pokemon around the target rank
            const rangeStart = Math.max(0, targetRank - 5);
            const rangeEnd = Math.min(rankedPokemon.length - 1, targetRank + 5);
            
            for (let i = rangeStart; i <= rangeEnd; i++) {
              if (i === currentRank) continue; // Skip the suggested Pokemon itself
              
              const opponentData = rankedPokemon[i];
              
              if (opponentData) {
                const matchupKey = [suggestedPokemonData.id, opponentData.id].sort().join('-');
                const isRecentMatchup = previousMatchups.has(matchupKey);
                
                if (!isRecentMatchup) {
                  // CHANGE: Use the RankedPokemon object directly
                  potentialOpponents.push({pokemon: opponentData, rank: i});
                  foundUnusedOpponent = true;
                  break;
                } else {
                  // Still add it, but we'll prefer unused matchups
                  // CHANGE: Use the RankedPokemon object directly
                  potentialOpponents.push({pokemon: opponentData, rank: i});
                }
              }
            }
            
            // Select an opponent (prefer unused matchups)
            if (potentialOpponents.length > 0) {
              const selectedOpponent = foundUnusedOpponent 
                ? potentialOpponents.find(o => {
                    const matchupKey = [suggestedPokemonData.id, o.pokemon.id].sort().join('-');
                    return !previousMatchups.has(matchupKey);
                  }) 
                : potentialOpponents[0];
              
              if (selectedOpponent) {
                // CHANGE: Push the RankedPokemon opponent object directly
                result.push(selectedOpponent.pokemon);
                console.log(`🎮 Selected opponent ${selectedOpponent.pokemon.name} (rank #${selectedOpponent.rank+1}) for suggested Pokemon ${suggestedPokemonData.name} (rank #${currentRank+1}, direction: ${suggestion.direction})`);
                
                // Record this matchup
                const matchupKey = [suggestedPokemonData.id, selectedOpponent.pokemon.id].sort().join('-');
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
      // CHANGE: Prioritize getting Pokemon from rankedPokemon array first
      const eligibleRankedPokemon = rankedPokemon.filter(p => 
        !result.some(selected => selected.id === p.id) &&
        !recentlyUsed.has(p.id)
      );
      
      if (eligibleRankedPokemon.length > 0) {
        // Get a random ranked Pokemon
        const randomPokemon = eligibleRankedPokemon[Math.floor(Math.random() * eligibleRankedPokemon.length)];
        result.push(randomPokemon);
      } else {
        // Fall back to all Pokemon if needed
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
  // Add debug logs at the start
  console.log(`[DEBUG createBattleStarter - selectSuggestedPokemonForced ENTRY] forceSuggestionPriority trigger active. Reviewing rankedPokemon for suggestions.`);
  console.log(`[DEBUG createBattleStarter - selectSuggestedPokemonForced RAW rankedPokemon suggestions] Input rankedPokemon with suggestions:`, 
    JSON.stringify(rankedPokemon.filter(p => p.suggestedAdjustment).map(p => ({ id: p.id, name: p.name, used: p.suggestedAdjustment?.used })))
  );

  // Clearly get ALL Pokémon with pending suggestions (used or not)
  const forcedSuggestions = rankedPokemon.filter(p => 
    p.suggestedAdjustment && !p.suggestedAdjustment.used
  );

  console.log(`[DEBUG createBattleStarter - selectSuggestedPokemonForced FILTERED] Found ${forcedSuggestions.length} forced suggestions (must be !used):`, 
    JSON.stringify(forcedSuggestions.map(p => ({ id: p.id, name: p.name, used: p.suggestedAdjustment?.used })))
  );

  if (forcedSuggestions.length === 0) {
    console.log(`[DEBUG createBattleStarter - selectSuggestedPokemonForced] No forced suggestions found with !p.suggestedAdjustment.used. Returning null.`);
    return null;
  }

  const battleSize = battleType === "triplets" ? 3 : 2;
  const result: Pokemon[] = [];

  // Explicitly read suggestion usage counts from localStorage
  const rawSuggestionUsageCounts = localStorage.getItem('suggestionUsageCounts');
  console.log(`[DEBUG createBattleStarter - selectSuggestedPokemonForced LS_READ_RAW] Raw suggestionUsageCounts from localStorage: ${rawSuggestionUsageCounts}`);
  const suggestionUsageCounts = JSON.parse(localStorage.getItem('suggestionUsageCounts') || '{}');
  console.log(`[DEBUG createBattleStarter - selectSuggestedPokemonForced LS_READ_PARSED] Parsed suggestionUsageCounts:`, JSON.stringify(suggestionUsageCounts));

  // Sort suggested Pokémon explicitly by lowest usage count (default 0)
  const sortedSuggestions = forcedSuggestions.sort((a, b) => {
    const usageA = suggestionUsageCounts[a.id] || 0;
    const usageB = suggestionUsageCounts[b.id] || 0;
    return usageA - usageB;
  });

  // Select Pokémon with the lowest usage explicitly
  const selectedSuggestion = sortedSuggestions[0];
  console.log(`[DEBUG createBattleStarter - selectSuggestedPokemonForced SELECTED_PKMN] Selected Pokémon for forced battle: ${selectedSuggestion.name} (${selectedSuggestion.id}). Its current .used flag: ${selectedSuggestion.suggestedAdjustment.used}`);
  console.log(`[DEBUG createBattleStarter - selectSuggestedPokemonForced USAGE_COUNT_PRE_INC] Usage count for ${selectedSuggestion.id} BEFORE increment: ${suggestionUsageCounts[selectedSuggestion.id] || 0}`);

  // CHANGE: Use the RankedPokemon object directly instead of looking up in allPokemon
  result.push(selectedSuggestion);

  // Explicitly update usage count
  suggestionUsageCounts[selectedSuggestion.id] = (suggestionUsageCounts[selectedSuggestion.id] || 0) + 1;
  console.log(`[DEBUG createBattleStarter - selectSuggestedPokemonForced USAGE_COUNT_POST_INC] Usage count for ${selectedSuggestion.id} AFTER increment: ${suggestionUsageCounts[selectedSuggestion.id]}`);

  // After a Pokémon has been explicitly used TWICE, mark suggestion as fully used
  if (suggestionUsageCounts[selectedSuggestion.id] >= 2) {
    // Find the suggestedPokemon in the rankedPokemon array to directly modify it
    const rankedPokemonData = rankedPokemon.find(p => p.id === selectedSuggestion.id);
    if (rankedPokemonData && rankedPokemonData.suggestedAdjustment) {
      console.log(`[DEBUG createBattleStarter - selectSuggestedPokemonForced MARKING_USED] Attempting to mark ${selectedSuggestion.name} (${selectedSuggestion.id}) as fully used. Current .used flag on its rankedPokemonData: ${rankedPokemonData.suggestedAdjustment.used}`);
      rankedPokemonData.suggestedAdjustment.used = true;
      console.log(`[DEBUG createBattleStarter - selectSuggestedPokemonForced POST_MARKING_USED] ${selectedSuggestion.name} (${selectedSuggestion.id}) .used flag on its rankedPokemonData is now: ${rankedPokemonData.suggestedAdjustment.used}`);
      console.log(`✨ Suggestion for ${selectedSuggestion.name} (${selectedSuggestion.id}) now fully used after ${suggestionUsageCounts[selectedSuggestion.id]} appearances.`);
    }
  }

  // Save explicitly back to localStorage
  console.log(`[DEBUG createBattleStarter - selectSuggestedPokemonForced LS_WRITE] Saving to localStorage suggestionUsageCounts: ${JSON.stringify(suggestionUsageCounts)}`);
  localStorage.setItem('suggestionUsageCounts', JSON.stringify(suggestionUsageCounts));

  // Explicitly select opponent near suggested rank
  const currentRank = rankedPokemon.findIndex(p => p.id === selectedSuggestion.id);
  const direction = selectedSuggestion.suggestedAdjustment.direction;
  const rankOffset = direction === "up" ? -5 : 5;
  let opponentRank = currentRank + rankOffset;

  // Clamp explicitly to valid ranks
  opponentRank = Math.max(0, Math.min(rankedPokemon.length - 1, opponentRank));

  let opponentPokemonData = rankedPokemon[opponentRank];
  
  // CHANGE: Use the rankedPokemon object directly as the opponent
  if (opponentPokemonData && opponentPokemonData.id !== selectedSuggestion.id) {
    result.push(opponentPokemonData);
  } else {
    // Fallback opponent - explicitly use a RankedPokemon if possible
    const eligibleOpponents = rankedPokemon.filter(p => p.id !== selectedSuggestion.id);
    if (eligibleOpponents.length > 0) {
      const randomOpponent = eligibleOpponents[Math.floor(Math.random() * eligibleOpponents.length)];
      result.push(randomOpponent);
    } else {
      // Last resort - use a Pokemon from allPokemon
      const randomPokemon = shuffleArray(allPokemon).find(p => p.id !== selectedSuggestion.id);
      if (randomPokemon) {
        result.push(randomPokemon);
      }
    }
  }

  // Fill remaining slots explicitly if needed (triplets) with RankedPokemon if possible
  while (result.length < battleSize) {
    const eligibleRankedPokemon = rankedPokemon.filter(p => 
      !result.some(r => r.id === p.id) && !recentlyUsed.has(p.id)
    );
    
    if (eligibleRankedPokemon.length > 0) {
      const randomRankedPokemon = eligibleRankedPokemon[Math.floor(Math.random() * eligibleRankedPokemon.length)];
      result.push(randomRankedPokemon);
    } else {
      // Fall back to regular Pokemon if needed
      const randomPokemon = shuffleArray(allPokemon).find(p => 
        !result.some(r => r.id === p.id) && !recentlyUsed.has(p.id)
      );
      if (!randomPokemon) break;
      result.push(randomPokemon);
    }
  }

  // Mark as recently used explicitly
  result.forEach(p => recentlyUsed.add(p.id));

  // Clear old recentlyUsed explicitly
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
    
    // Log the decision process for forcing suggestions
    const suggestionProbability = forceSuggestionPriority ? 1.0 : 0.85;
    const isForcingSuggestions = (forceSuggestionPriority) || 
                             (suggested.size > 0 && Math.random() < suggestionProbability) || 
                             (consecutiveNonSuggestionBattles >= 3 && suggested.size > 0);
    console.log(`[DEBUG createBattleStarter - startNewBattle DECISION] forceSuggestionPriority: ${forceSuggestionPriority}, suggested.size: ${suggested.size}, Math.random() < prob: ${Math.random() < suggestionProbability}, consecutiveNonSuggestionBattles: ${consecutiveNonSuggestionBattles}. FINAL DECISION to force: ${isForcingSuggestions}`);

    if (isForcingSuggestions) {
      console.log(`[DEBUG createBattleStarter - startNewBattle] Trying selectSuggestedPokemonForced or selectSuggestedPokemon due to forcing conditions.`);
      
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
        
        // CHANGE: Prioritize using rankedPokemon objects
        const eligibleRankedPokemon = rankedPokemon.filter(p => !recentlyUsed.has(p.id));
        if (eligibleRankedPokemon.length >= battleSize) {
          selectedPokemon = shuffleArray(eligibleRankedPokemon).slice(0, battleSize);
        } else {
          selectedPokemon = shuffleArray(availablePokemon)
            .filter(p => !recentlyUsed.has(p.id))
            .slice(0, battleSize);
          
          // If we still don't have enough Pokemon, use any available
          if (selectedPokemon.length < battleSize) {
            selectedPokemon = shuffleArray(availablePokemon).slice(0, battleSize);
          }
        }
      }
    } else {
      // Otherwise, create a random battle
      consecutiveNonSuggestionBattles++;
      
      // CHANGE: Prefer rankedPokemon objects when available
      const eligibleRankedPokemon = rankedPokemon.filter(p => !recentlyUsed.has(p.id));
      if (eligibleRankedPokemon.length >= battleSize) {
        selectedPokemon = shuffleArray(eligibleRankedPokemon).slice(0, battleSize);
      } else {
        // Prefer Pokemon not used recently
        const notRecentlyUsed = availablePokemon.filter(p => !recentlyUsed.has(p.id));
        if (notRecentlyUsed.length >= battleSize) {
          selectedPokemon = shuffleArray(notRecentlyUsed).slice(0, battleSize);
        } else {
          selectedPokemon = shuffleArray(availablePokemon).slice(0, battleSize);
        }
      }
    }
    
    // Add these Pokemon to the recently used set
    selectedPokemon.forEach(p => recentlyUsed.add(p.id));
    
    // Limit the size of the recently used set
    if (recentlyUsed.size > 30) {
      const idsToRemove = Array.from(recentlyUsed).slice(0, 10);
      idsToRemove.forEach(id => recentlyUsed.delete(id));
    }
    
    // ADD NEW LOGGING BEFORE SETTING CURRENT BATTLE
    console.log(`[DEBUG createBattleStarter - PRE_SET_CURRENT_BATTLE] Preparing to call setCurrentBattle. Inspecting objects in 'selectedPokemon':`);
    if (selectedPokemon && selectedPokemon.length > 0) {
      selectedPokemon.forEach(p => {
        const pkmn = p as RankedPokemon; // Cast to check for RankedPokemon properties
        const suggestionDetails = pkmn.suggestedAdjustment
          ? `HAS suggestionAdjustment - Used: ${pkmn.suggestedAdjustment.used}, Direction: ${pkmn.suggestedAdjustment.direction}`
          : 'DOES NOT HAVE suggestionAdjustment property';
        // Check for another property that only RankedPokemon would have
        const isLikelyRankedPokemon = 'score' in pkmn || 'confidence' in pkmn || 'count' in pkmn;
        console.log(`[DEBUG createBattleStarter - PRE_SET_CURRENT_BATTLE] PKMN: ${pkmn.name} (${pkmn.id}). ${suggestionDetails}. IsLikelyRanked: ${isLikelyRankedPokemon}. Object keys: ${Object.keys(pkmn).join(', ')}`);
      });
    } else {
      console.log(`[DEBUG createBattleStarter - PRE_SET_CURRENT_BATTLE] 'selectedPokemon' is empty or undefined.`);
    }
    
    // Update current battle with selected Pokemon
    setCurrentBattle(selectedPokemon);
    console.log(`[DEBUG createBattleStarter - POST_SET_CURRENT_BATTLE] Called setCurrentBattle.`);
    
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

