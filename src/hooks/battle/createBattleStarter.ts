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
  // Keep track of the number of unranked Pokémon selections to ensure variety
  let unrankedSelectionCounter = 0;
  // Track the number of battles since we last introduced a new Pokémon
  let battlesSinceNewPokemon = 0;
  
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
   * CRITICAL CHANGE: Now respects forceUnrankedSelection flag for opponent selection
   */
  function selectSuggestedPokemonForced(battleType: BattleType, forceUnrankedSelection: boolean = false): Pokemon[] | null {
    // Add debug logs at the start
    console.log(`[DEBUG createBattleStarter - selectSuggestedPokemonForced ENTRY] forceSuggestionPriority trigger active, forceUnrankedSelection: ${forceUnrankedSelection}`);
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
      console.log(`[DEBUG createBattleStarter - selectSuggestedPokemonForced] No forced suggestions found with !p.suggestedAdjustment.used. Falling back to unranked.`);
      // IMPORTANT: When we have no forced suggestions, fall back to selecting unranked Pokemon
      return selectUnrankedPokemon(battleType);
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

    // CRITICAL FIX: Opponent selection with respect to forceUnrankedSelection
    if (forceUnrankedSelection) {
      // If forceUnrankedSelection is true, we MUST select an unranked opponent
      console.log(`[DEBUG createBattleStarter - selectSuggestedPokemonForced] forceUnrankedSelection is true, MUST choose unranked opponent`);
      
      // Get truly unranked Pokémon (in allPokemon but not in rankedPokemon)
      const rankedIds = new Set(rankedPokemon.map(p => p.id));
      const unrankedPokemon = allPokemon.filter(p => 
        !rankedIds.has(p.id) && 
        !recentlyUsed.has(p.id) &&
        p.id !== selectedSuggestion.id
      );
      
      console.log(`[DEBUG createBattleStarter - selectSuggestedPokemonForced] Found ${unrankedPokemon.length} eligible unranked Pokemon for opponent selection`);
      
      if (unrankedPokemon.length > 0) {
        // Select a random unranked Pokemon as opponent for variety
        const randomUnrankedPokemon = unrankedPokemon[Math.floor(Math.random() * unrankedPokemon.length)];
        result.push(randomUnrankedPokemon);
        console.log(`[DEBUG createBattleStarter - selectSuggestedPokemonForced] Selected unranked Pokemon as opponent: ${randomUnrankedPokemon.name} (${randomUnrankedPokemon.id})`);
        
        // Reset the counter for battles since new Pokemon
        battlesSinceNewPokemon = 0;
      } else {
        // If no unranked Pokemon available despite forcing it, still try to get a varied opponent
        console.log(`[DEBUG createBattleStarter - selectSuggestedPokemonForced] No eligible unranked Pokemon available despite forcing it!`);
        
        // Try to get a ranked Pokemon that hasn't been used recently
        const eligibleRanked = rankedPokemon.filter(p => 
          p.id !== selectedSuggestion.id && 
          !recentlyUsed.has(p.id)
        );
        
        if (eligibleRanked.length > 0) {
          const randomRanked = eligibleRanked[Math.floor(Math.random() * eligibleRanked.length)];
          result.push(randomRanked);
          console.log(`[DEBUG createBattleStarter - selectSuggestedPokemonForced] Fallback to ranked but not recently used: ${randomRanked.name}`);
        } else {
          // Last resort - use any Pokemon that isn't the suggestion itself
          const anyEligible = allPokemon.filter(p => p.id !== selectedSuggestion.id);
          if (anyEligible.length > 0) {
            const randomPokemon = anyEligible[Math.floor(Math.random() * anyEligible.length)];
            result.push(randomPokemon);
            console.log(`[DEBUG createBattleStarter - selectSuggestedPokemonForced] Last resort opponent: ${randomPokemon.name}`);
          }
        }
        // We couldn't introduce new Pokémon, so increment counter
        battlesSinceNewPokemon++;
      }
    } else {
      // If not forcing unranked selection, use standard opponent selection logic
      // Try to get an opponent from the unranked pool first for variety
      const rankedIds = new Set(rankedPokemon.map(p => p.id));
      const unrankedPokemon = allPokemon.filter(p => !rankedIds.has(p.id) && !recentlyUsed.has(p.id));
      
      console.log(`[DEBUG createBattleStarter - selectSuggestedPokemonForced] Found ${unrankedPokemon.length} eligible unranked Pokemon for opponent selection (standard mode)`);
      
      // CRITICAL FIX: Even without forced unranked selection, we should prioritize unranked Pokémon
      // especially if we haven't introduced new Pokémon in a while
      const shouldPreferUnranked = unrankedPokemon.length > 0 && 
                                  (battlesSinceNewPokemon > 2 || Math.random() < 0.7);
      
      if (shouldPreferUnranked) {
        // Select a random unranked Pokemon as opponent for variety
        const randomUnrankedPokemon = unrankedPokemon[Math.floor(Math.random() * unrankedPokemon.length)];
        result.push(randomUnrankedPokemon);
        console.log(`[DEBUG createBattleStarter - selectSuggestedPokemonForced] Preferred unranked Pokemon as opponent: ${randomUnrankedPokemon.name} (${randomUnrankedPokemon.id})`);
        
        // Reset the counter for battles since new Pokemon
        battlesSinceNewPokemon = 0;
      } else {
        // Standard selection logic from original function
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
          // This doesn't add variety, increment counter
          battlesSinceNewPokemon++;
        } else {
          // Fallback opponent - explicitly use a RankedPokemon if possible
          const eligibleOpponents = rankedPokemon.filter(p => p.id !== selectedSuggestion.id);
          if (eligibleOpponents.length > 0) {
            const randomOpponent = eligibleOpponents[Math.floor(Math.random() * eligibleOpponents.length)];
            result.push(randomOpponent);
            // This doesn't add variety, increment counter
            battlesSinceNewPokemon++;
          } else {
            // Last resort - use a Pokemon from allPokemon
            const randomPokemon = shuffleArray(allPokemon).find(p => p.id !== selectedSuggestion.id);
            if (randomPokemon) {
              result.push(randomPokemon);
              // This doesn't add variety, increment counter
              battlesSinceNewPokemon++;
            }
          }
        }
      }
    }

    // Fill remaining slots explicitly if needed (triplets) with RankedPokemon if possible
    while (result.length < battleSize) {
      // IMPROVED: Even for remaining slots, we should consider unranked Pokémon
      const rankedIds = new Set(rankedPokemon.map(p => p.id));
      const unrankedPokemonForRemaining = allPokemon.filter(p => 
        !rankedIds.has(p.id) && 
        !recentlyUsed.has(p.id) && 
        !result.some(r => r.id === p.id)
      );
      
      // Decide whether to use unranked or ranked for the remaining slots
      // Higher chance to use unranked if we haven't introduced new Pokémon in a while
      const useUnrankedForRemaining = unrankedPokemonForRemaining.length > 0 && 
                                     (battlesSinceNewPokemon > 2 || Math.random() < 0.5);
                                     
      if (useUnrankedForRemaining) {
        const randomUnranked = unrankedPokemonForRemaining[Math.floor(Math.random() * unrankedPokemonForRemaining.length)];
        result.push(randomUnranked);
        console.log(`[DEBUG createBattleStarter] Using unranked Pokémon for remaining slot: ${randomUnranked.name}`);
        // We're introducing a new Pokémon, so reset the counter
        battlesSinceNewPokemon = 0;
      } else {
        // Original logic for remaining slots
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
        // This case doesn't add variety, increment counter
        battlesSinceNewPokemon++;
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
   * Explicitly selects unranked Pokémon to ensure variety in battles
   * This is the key function to fix the milestone-related variety problem
   */
  function selectUnrankedPokemon(battleType: BattleType): Pokemon[] | null {
    console.log(`[CREATE_BATTLE_STARTER] selectUnrankedPokemon: Explicitly selecting unranked Pokémon`);
    
    const battleSize = battleType === "triplets" ? 3 : 2;
    const result: Pokemon[] = [];
    
    // CRITICAL FIX: Calculate truly unranked Pokémon (available in allPokemon but not in rankedPokemon)
    const unrankedPokemonIds = new Set<number>();
    allPokemon.forEach(p => {
      if (!rankedPokemon.some(rp => rp.id === p.id)) {
        unrankedPokemonIds.add(p.id);
      }
    });
    
    const unrankedPokemon = allPokemon.filter(p => unrankedPokemonIds.has(p.id));
    
    console.log(`[CREATE_BATTLE_STARTER] Found ${unrankedPokemon.length} unranked Pokémon out of ${allPokemon.length} total Pokémon. Ranked count: ${rankedPokemon.length}`);
    
    // If we have no unranked Pokémon, return null to try other strategies
    if (unrankedPokemon.length === 0) {
      console.log(`[CREATE_BATTLE_STARTER] No unranked Pokémon available. Skipping unranked selection.`);
      return null;
    }
    
    // Filter out recently used Pokémon
    const eligibleUnranked = unrankedPokemon.filter(p => !recentlyUsed.has(p.id));
    
    console.log(`[CREATE_BATTLE_STARTER] Found ${eligibleUnranked.length} eligible unranked Pokémon (excluding recently used)`);
    
    // If we have enough eligible unranked Pokémon, select from them
    if (eligibleUnranked.length >= battleSize) {
      // Shuffle and select
      const selectedUnranked = shuffleArray(eligibleUnranked).slice(0, battleSize);
      result.push(...selectedUnranked);
      
      // Mark as recently used
      result.forEach(p => recentlyUsed.add(p.id));
      
      console.log(`[CREATE_BATTLE_STARTER] Successfully created battle with ${battleSize} unranked Pokémon:`, result.map(p => p.name).join(", "));
      unrankedSelectionCounter++;
      
      // Reset counter since we successfully introduced new Pokemon
      battlesSinceNewPokemon = 0;
      
      console.log(`[CREATE_BATTLE_STARTER] Unranked selection counter: ${unrankedSelectionCounter}`);
      return result;
    } 
    // If we need to mix with ranked Pokémon
    else if (eligibleUnranked.length > 0) {
      // Use all available eligible unranked
      result.push(...eligibleUnranked);
      
      // Get the rest from ranked Pokémon
      const neededMore = battleSize - result.length;
      const eligibleRanked = rankedPokemon.filter(p => 
        !recentlyUsed.has(p.id) && !result.some(selected => selected.id === p.id)
      );
      
      if (eligibleRanked.length >= neededMore) {
        result.push(...shuffleArray(eligibleRanked).slice(0, neededMore));
      } else {
        // Fallback to any Pokémon
        const remainingEligible = allPokemon.filter(p => 
          !recentlyUsed.has(p.id) && !result.some(selected => selected.id === p.id)
        );
        
        if (remainingEligible.length >= neededMore) {
          result.push(...shuffleArray(remainingEligible).slice(0, neededMore));
        } else {
          // Absolute fallback - just get any Pokémon not already selected
          const anyNotSelected = allPokemon.filter(p => !result.some(selected => selected.id === p.id));
          result.push(...shuffleArray(anyNotSelected).slice(0, neededMore));
        }
      }
      
      // Mark as recently used
      result.forEach(p => recentlyUsed.add(p.id));
      
      // Reset counter since we successfully introduced new Pokemon
      battlesSinceNewPokemon = 0;
      
      console.log(`[CREATE_BATTLE_STARTER] Created mixed battle with ${eligibleUnranked.length} unranked and ${result.length - eligibleUnranked.length} ranked Pokémon`);
      console.log(`[CREATE_BATTLE_STARTER] Battle Pokémon:`, result.map(p => p.name).join(", "));
      unrankedSelectionCounter++;
      return result;
    }
    
    // If we couldn't create a battle, return null
    console.log(`[CREATE_BATTLE_STARTER] Failed to create unranked battle`);
    return null;
  }

  /**
   * Start a new battle using selection strategies
   * CRITICAL FIX: Now properly respects forceUnrankedSelection even during suggestion priority mode
   */
  function startNewBattle(battleType: BattleType = "pairs", forceSuggestionPriority: boolean = false, forceUnrankedSelection: boolean = false): Pokemon[] {
    // Ensure we have available Pokemon
    if (!allPokemon || allPokemon.length < 2) {
      console.error("Not enough Pokemon available for battle");
      return [];
    }

    // DETAILED DIAGNOSTIC LOGS
    console.log(`[CREATE_BATTLE_STARTER] Called startNewBattle. rankedPokemon size: ${rankedPokemon.length}, allPokemon size: ${allPokemon.length}, availablePokemon size: ${availablePokemon.length}`);
    console.log(`[CREATE_BATTLE_STARTER] Suggestion count: ${suggested.size}, unrankedSelectionCounter: ${unrankedSelectionCounter}, battlesSinceNewPokemon: ${battlesSinceNewPokemon}`);
    console.log(`[CREATE_BATTLE_STARTER] recentlyUsed size: ${recentlyUsed.size}, battleCounter: ${battleCounter}`);
    console.log(`[CREATE_BATTLE_STARTER] forceSuggestionPriority: ${forceSuggestionPriority}, forceUnrankedSelection: ${forceUnrankedSelection}`);

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
    const shouldForceSuggestions = (forceSuggestionPriority) || 
                             (suggested.size > 0 && Math.random() < suggestionProbability) || 
                             (consecutiveNonSuggestionBattles >= 3 && suggested.size > 0);
    console.log(`[DEBUG createBattleStarter - startNewBattle DECISION] forceSuggestionPriority: ${forceSuggestionPriority}, suggested.size: ${suggested.size}, Math.random() < prob: ${Math.random() < suggestionProbability}, consecutiveNonSuggestionBattles: ${consecutiveNonSuggestionBattles}. FINAL DECISION to force: ${shouldForceSuggestions}`);

    // CRITICAL FIX: Force unranked selection after too many battles without new Pokemon
    // This ensures we don't get stuck in a small pool
    const MAX_BATTLES_WITHOUT_NEW_POKEMON = 3; // Force new selection after 3 battles without new Pokemon
    const shouldForceUnrankedForVariety = battlesSinceNewPokemon >= MAX_BATTLES_WITHOUT_NEW_POKEMON || forceUnrankedSelection;
    console.log(`[CREATE_BATTLE_STARTER] battlesSinceNewPokemon: ${battlesSinceNewPokemon}, shouldForceUnrankedForVariety: ${shouldForceUnrankedForVariety}`);

    // CRITICAL FIX: After every 3 battles (or configured number), force selection of unranked Pokémon
    // This ensures we continuously introduce new Pokémon into the ranking system
    const FORCE_UNRANKED_FREQUENCY = 3; // Force unranked selection every X battles
    const shouldForceUnranked = shouldForceUnrankedForVariety || 
                               battleCounter % FORCE_UNRANKED_FREQUENCY === 0 || 
                               unrankedSelectionCounter < 3;

    // Try different selection strategies in order of priority
    let battleSelected = false;

    // 1. HIGHEST PRIORITY: If we need to force unranked
    if (shouldForceUnranked && !shouldForceSuggestions) {
      console.log(`[CREATE_BATTLE_STARTER] 📊 PRIORITY 1: Trying FORCED unranked selection`);
      const unrankedBattle = selectUnrankedPokemon(battleType);
      if (unrankedBattle) {
        selectedPokemon = unrankedBattle;
        battleSelected = true;
        console.log("✅ Successfully created a FORCED UNRANKED battle for variety");
        // Reset battles since new Pokémon counter
        battlesSinceNewPokemon = 0;
      } else {
        console.log("⚠️ Could not create forced unranked battle, will try other selection methods");
      }
    }
    
    // 2. SECOND PRIORITY: If we need to force suggestions and have suggestions available
    if (!battleSelected && shouldForceSuggestions && suggested.size > 0) {
      console.log(`[CREATE_BATTLE_STARTER] 📊 PRIORITY 2: Trying suggestion-focused battle selection`);
      
      // CRITICAL FIX: Pass forceUnrankedSelection to selectSuggestedPokemonForced
      // This allows us to ensure variety even during suggestion priority mode
      const suggestedBattle = forceSuggestionPriority 
        ? selectSuggestedPokemonForced(battleType, forceUnrankedSelection)
        : selectSuggestedPokemon(battleType);
      
      if (suggestedBattle) {
        selectedPokemon = suggestedBattle;
        consecutiveNonSuggestionBattles = 0;
        battleSelected = true;
        
        // Check if the battle introduces new Pokemon to help with variety tracking
        const newPokemonCount = suggestedBattle.filter(p => !rankedPokemon.some(rp => rp.id === p.id)).length;
        if (newPokemonCount > 0) {
          console.log(`✅ Suggestion battle introduces ${newPokemonCount} new Pokemon`);
          battlesSinceNewPokemon = 0;
        } else {
          // If no new Pokemon introduced, increment the counter
          battlesSinceNewPokemon++;
          console.log(`⚠️ Suggestion battle did not introduce new Pokemon. battlesSinceNewPokemon: ${battlesSinceNewPokemon}`);
        }
        
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
        console.log("⚠️ Could not create suggestion battle, will try other selection methods");
        consecutiveNonSuggestionBattles++;
      }
    }
    
    // 3. THIRD PRIORITY: Standard unranked selection (not forced)
    if (!battleSelected) {
      console.log(`[CREATE_BATTLE_STARTER] 📊 PRIORITY 3: Trying standard unranked Pokémon selection`);
      
      const unrankedBattle = selectUnrankedPokemon(battleType);
      if (unrankedBattle) {
        selectedPokemon = unrankedBattle;
        battleSelected = true;
        console.log("✅ Successfully created a battle with unranked Pokemon (standard)");
        // Reset battles since new Pokémon counter
        battlesSinceNewPokemon = 0;
      } else {
        console.log("⚠️ Could not create unranked battle, will try final fallback selection");
      }
    }
    
    // 4. FOURTH PRIORITY: If we still haven't selected a battle, use standard random selection
    if (!battleSelected) {
      console.log(`[CREATE_BATTLE_STARTER] 📊 PRIORITY 4: Using standard random battle selection`);
      consecutiveNonSuggestionBattles++;
      
      // IMPROVED APPROACH: Balanced selection between ranked and unranked
      const rankedIds = new Set(rankedPokemon.map(p => p.id));
      const unrankedPokemonIds = new Set<number>();
      allPokemon.forEach(p => {
        if (!rankedIds.has(p.id)) {
          unrankedPokemonIds.add(p.id);
        }
      });
      
      // If rankedPokemon is growing too large compared to unranked, prioritize unranked
      const unrankedPercentage = (unrankedPokemonIds.size / allPokemon.length) * 100;
      console.log(`[CREATE_BATTLE_STARTER] ${unrankedPokemonIds.size} unranked Pokémon remaining (${unrankedPercentage.toFixed(1)}% of total)`);
      
      // CRITICAL FIX: After a certain point in ranked growth, we MUST introduce new Pokémon
      // The fewer unranked Pokémon remain proportionally, the more we prioritize them
      // Also prioritize unranked if we haven't seen new Pokémon in a while
      const prioritizeUnranked = Math.random() < (1 - (unrankedPercentage / 100)) || 
                                battlesSinceNewPokemon > 0 || 
                                forceUnrankedSelection;
      
      if (prioritizeUnranked && unrankedPokemonIds.size > 0) {
        // Select from unranked
        console.log(`[CREATE_BATTLE_STARTER] Prioritizing selection from unranked pool (${unrankedPokemonIds.size} Pokémon)`);
        const unrankedPool = allPokemon.filter(p => unrankedPokemonIds.has(p.id) && !recentlyUsed.has(p.id));
        
        if (unrankedPool.length >= battleSize) {
          selectedPokemon = shuffleArray(unrankedPool).slice(0, battleSize);
          console.log(`[CREATE_BATTLE_STARTER] Selected ${battleSize} unranked Pokémon`);
          unrankedSelectionCounter++;
          battlesSinceNewPokemon = 0;
        } else if (unrankedPool.length > 0) {
          // Select available unranked and fill with ranked
          selectedPokemon = [...unrankedPool];
          const neededMore = battleSize - selectedPokemon.length;
          
          console.log(`[CREATE_BATTLE_STARTER] Selected ${unrankedPool.length} unranked Pokémon, need ${neededMore} more`);
          
          // Get the rest from eligible ranked Pokémon
          const eligibleRanked = rankedPokemon.filter(p => 
            !recentlyUsed.has(p.id) && !selectedPokemon.some(s => s.id === p.id)
          );
          
          if (eligibleRanked.length >= neededMore) {
            const additionalPokemon = shuffleArray(eligibleRanked).slice(0, neededMore);
            selectedPokemon.push(...additionalPokemon);
            console.log(`[CREATE_BATTLE_STARTER] Added ${neededMore} ranked Pokémon to complete battle`);
            unrankedSelectionCounter++;
            battlesSinceNewPokemon = 0;
          } else {
            // Fall back to any Pokémon not already selected
            const anyRemaining = allPokemon.filter(p => 
              !recentlyUsed.has(p.id) && !selectedPokemon.some(s => s.id === p.id)
            );
            
            if (anyRemaining.length >= neededMore) {
              const additionalPokemon = shuffleArray(anyRemaining).slice(0, neededMore);
              selectedPokemon.push(...additionalPokemon);
              console.log(`[CREATE_BATTLE_STARTER] Added ${neededMore} other Pokémon to complete battle`);
            } else {
              // Last resort - use any Pokémon not already in the battle
              const completelyRandom = allPokemon.filter(p => !selectedPokemon.some(s => s.id === p.id));
              const additionalPokemon = shuffleArray(completelyRandom).slice(0, neededMore);
              selectedPokemon.push(...additionalPokemon);
              console.log(`[CREATE_BATTLE_STARTER] Added ${additionalPokemon.length} random Pokémon to complete battle`);
            }
          }
        } else {
          // If no unranked available, fall back to random selection
          console.log(`[CREATE_BATTLE_STARTER] No eligible unranked Pokémon available, using mixed selection`);
          const notRecentlyUsed = allPokemon.filter(p => !recentlyUsed.has(p.id));
          if (notRecentlyUsed.length >= battleSize) {
            selectedPokemon = shuffleArray(notRecentlyUsed).slice(0, battleSize);
          } else {
            selectedPokemon = shuffleArray(allPokemon).slice(0, battleSize);
          }
          // This is a fallback, so increment counter since we likely didn't introduce new Pokemon
          battlesSinceNewPokemon++;
        }
      } else {
        // Standard random selection
        console.log(`[CREATE_BATTLE_STARTER] Using mixed random selection`);
        const notRecentlyUsed = allPokemon.filter(p => !recentlyUsed.has(p.id));
        if (notRecentlyUsed.length >= battleSize) {
          selectedPokemon = shuffleArray(notRecentlyUsed).slice(0, battleSize);
        } else {
          selectedPokemon = shuffleArray(allPokemon).slice(0, battleSize);
        }
        // Standard selection usually doesn't introduce new Pokemon, so increment counter
        battlesSinceNewPokemon++;
      }
    }
    
    // Increment battle counter and update recently used
    battleCounter++;
    selectedPokemon.forEach(p => recentlyUsed.add(p.id));
    
    // Limit the size of the recently used set
    if (recentlyUsed.size > 30) {
      const idsToRemove = Array.from(recentlyUsed).slice(0, 10);
      idsToRemove.forEach(id => recentlyUsed.delete(id));
    }
    
    // Log the types of Pokémon selected (ranked vs unranked)
    const rankedIds = new Set(rankedPokemon.map(p => p.id));
    const numRanked = selectedPokemon.filter(p => rankedIds.has(p.id)).length;
    const numUnranked = selectedPokemon.length - numRanked;
    
    console.log(`[CREATE_BATTLE_STARTER] Final battle: ${numRanked} ranked Pokémon and ${numUnranked} unranked Pokémon`);
    console.log(`[CREATE_BATTLE_STARTER] Selected Pokémon IDs:`, selectedPokemon.map(p => p.id).join(", "));
    console.log(`[CREATE_BATTLE_STARTER] Selected Pokémon names:`, selectedPokemon.map(p => p.name).join(", "));
    
    // Update battlesSinceNewPokemon counter if we didn't introduce any new Pokemon
    if (numUnranked === 0) {
      console.log(`[CREATE_BATTLE_STARTER] No new Pokémon in this battle. Increment battlesSinceNewPokemon to: ${battlesSinceNewPokemon}`);
    } else {
      // Reset counter if we did introduce new Pokemon
      battlesSinceNewPokemon = 0;
      console.log(`[CREATE_BATTLE_STARTER] Introduced ${numUnranked} new Pokémon! Reset battlesSinceNewPokemon to 0.`);
    }
    
    // Log detailed info about each selected Pokémon
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
