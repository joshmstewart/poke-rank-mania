import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { BattleType } from "./types";
import { validateBattlePokemon } from "@/services/pokemon/api/utils";

export const createBattleStarter = (
  pokemonList: Pokemon[],
  allPokemonForGeneration: Pokemon[],
  currentFinalRankings: RankedPokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  suggestedPokemon: RankedPokemon[] = [],
  activeTier: TopNOption = "All",
  isPokemonFrozenForTier?: (pokemonId: number, tier: TopNOption) => boolean
) => {
  // Use plain objects instead of hooks
  const recentlySeenPokemon = new Set<number>();
  let battleCountRef = 0;
  let initialSubsetRef: Pokemon[] | null = null;
  let lowerTierLosersMap = new Map<number, number>(); // Track Pokemon that lost to lower tier opponents
  let previousBattlePokemonIds = new Set<number>(); // Track the previous battle's Pokemon IDs
  let consecutiveIdenticalBattles = 0; // Track how many identical battles in a row

  const shuffleArray = (array: Pokemon[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const pickDistinctPair = (pool: Pokemon[], seen: Set<number>, size: number, previousBattle: Set<number>) => {
    // First, ensure we don't pick exactly the same Pokemon as the previous battle
    const filteredPool = pool.filter(p => !previousBattle.has(p.id));
    
    // If we have enough Pokemon that weren't in the previous battle, use those
    if (filteredPool.length >= size) {
      // Further filter by Pokemon that haven't been seen recently
      const unseenPool = filteredPool.filter(p => !seen.has(p.id));
      
      // If we have enough unseen Pokemon, use those
      if (unseenPool.length >= size) {
        return shuffleArray(unseenPool).slice(0, size);
      }
      
      // Otherwise use the filtered pool (different from previous battle)
      return shuffleArray(filteredPool).slice(0, size);
    }
    
    // If we can't avoid using some Pokemon from the previous battle, 
    // at least make sure we don't use the exact same combination
    // Shuffle to introduce randomness
    const shuffledPool = shuffleArray(pool);
    const result: Pokemon[] = [];
    
    // Keep track of which Pokemon we've selected to ensure uniqueness
    const selectedIds = new Set<number>();
    
    // First add Pokemon that weren't in the previous battle and weren't recently seen
    for (const pokemon of shuffledPool) {
      if (!previousBattle.has(pokemon.id) && !seen.has(pokemon.id) && !selectedIds.has(pokemon.id) && result.length < size) {
        result.push(pokemon);
        selectedIds.add(pokemon.id);
      }
      
      if (result.length >= size) break;
    }
    
    // If we still need more, add Pokemon that weren't in the previous battle
    if (result.length < size) {
      for (const pokemon of shuffledPool) {
        if (!previousBattle.has(pokemon.id) && !selectedIds.has(pokemon.id) && result.length < size) {
          result.push(pokemon);
          selectedIds.add(pokemon.id);
        }
        
        if (result.length >= size) break;
      }
    }
    
    // If we STILL need more (very unlikely), just pick any Pokemon
    if (result.length < size) {
      for (const pokemon of shuffledPool) {
        if (!selectedIds.has(pokemon.id) && result.length < size) {
          result.push(pokemon);
          selectedIds.add(pokemon.id);
        }
        
        if (result.length >= size) break;
      }
    }
    
    return result;
  };

  // Helper function to check if two battles have the same Pokemon
  const isSameBattle = (newBattle: Pokemon[], previousBattleIds: Set<number>): boolean => {
    if (newBattle.length !== previousBattleIds.size) return false;
    
    return newBattle.every(pokemon => previousBattleIds.has(pokemon.id));
  };

  // Helper function to convert Pokemon to RankedPokemon
  const ensureRankedPokemon = (pokemon: Pokemon): RankedPokemon => {
    if ('score' in pokemon && 'count' in pokemon && 'confidence' in pokemon) {
      return pokemon as RankedPokemon;
    }
    return {
      ...pokemon,
      score: 0,
      count: 0,
      confidence: 0
    } as RankedPokemon;
  };

  // Helper function to convert array of Pokemon to array of RankedPokemon
  const ensureRankedPokemonArray = (pokemonArray: Pokemon[]): RankedPokemon[] => {
    return pokemonArray.map(ensureRankedPokemon);
  };

  // Function to explicitly select Pokemon for suggestion-based battles
  const selectSuggestedPokemonForced = (battleSize: number, forcePriority: boolean, forceUnranked: boolean): Pokemon[] => {
    // Strategy: Combine suggested Pokemon with either high-ranked or unranked Pokemon
    
    // Filter suggestions to only include those not marked as used
    const availableSuggestions = suggestedPokemon.filter(p => !p.suggestedAdjustment?.used);
    
    // If no suggestions available, fall back to regular selection
    if (availableSuggestions.length === 0) {
      console.log("🔄 No available suggestions found, falling back to standard selection");
      return [];
    }
    
    // Choose a random suggestion
    const selectedSuggestion = availableSuggestions[Math.floor(Math.random() * availableSuggestions.length)];
    console.log(`🔎 Selected suggestion: ${selectedSuggestion.name} (${selectedSuggestion.id})`);
    
    // Mark this suggestion as used
    if (selectedSuggestion.suggestedAdjustment && !selectedSuggestion.suggestedAdjustment.used) {
      selectedSuggestion.suggestedAdjustment.count = (selectedSuggestion.suggestedAdjustment.count || 0) + 1;
      
      // Mark as fully used if we've seen it multiple times
      if (selectedSuggestion.suggestedAdjustment.count >= 2) {
        console.log(`✅ Marking suggestion for ${selectedSuggestion.name} as fully used after ${selectedSuggestion.suggestedAdjustment.count} battles`);
        selectedSuggestion.suggestedAdjustment.used = true;
      }
    }
    
    const result: Pokemon[] = [selectedSuggestion];
    
    // Determine pool for the remaining Pokemon
    let remainingPool: Pokemon[];
    
    // Either prioritize unranked Pokemon or use standard pool
    if (forceUnranked) {
      // Get unranked Pokemon (not in currentFinalRankings)
      const rankedIds = new Set(currentFinalRankings.map(p => p.id));
      remainingPool = allPokemonForGeneration.filter(p => !rankedIds.has(p.id) && p.id !== selectedSuggestion.id);
      
      // If not enough unranked, fall back to general pool
      if (remainingPool.length < (battleSize - 1)) {
        remainingPool = allPokemonForGeneration.filter(p => p.id !== selectedSuggestion.id);
      }
    } else {
      // Standard pool - exclude the already selected suggestion
      remainingPool = allPokemonForGeneration.filter(p => p.id !== selectedSuggestion.id);
    }
    
    // Filter out Pokemon that were in the previous battle
    const filteredPool = remainingPool.filter(p => !previousBattlePokemonIds.has(p.id));
    
    // If filtered pool is too small, use the original pool
    const poolToUse = filteredPool.length >= (battleSize - 1) ? filteredPool : remainingPool;
    
    // Add remaining Pokemon
    const remainingNeeded = battleSize - result.length;
    result.push(...shuffleArray(poolToUse).slice(0, remainingNeeded));
    
    return result;
  };
  
  const getTierBattlePair = (battleType: BattleType, forceSuggestionPriority: boolean = false, forceUnrankedSelection: boolean = false): Pokemon[] => {
    console.log("🌟 Battle generation started. Battle type:", battleType, 
                "Force suggestion priority:", forceSuggestionPriority,
                "Force unranked selection:", forceUnrankedSelection);
    console.log("📋 All Pokémon count:", allPokemonForGeneration.length, "Ranked Pokémon count:", currentFinalRankings.length);

    const battleSize = battleType === "pairs" ? 2 : 3;
    console.log("🎯 [createBattleStarter] battleSize determined:", battleSize, "battleType:", battleType);

    // If we need to force suggestion priority and have suggestions, use that approach
    if (forceSuggestionPriority && suggestedPokemon && suggestedPokemon.length > 0) {
      const suggestedBattle = selectSuggestedPokemonForced(battleSize, forceSuggestionPriority, forceUnrankedSelection);
      if (suggestedBattle.length === battleSize) {
        return suggestedBattle;
      }
      // If suggestion selection failed, continue with normal selection
      console.log("🔄 Suggestion-forced selection failed, falling back to standard selection");
    }

    // Different strategy based on tier
    const tierSize = activeTier === "All" ? 
      currentFinalRankings.length : 
      Math.min(Number(activeTier), currentFinalRankings.length);

    // Get the current top N Pokémon based on the tier
    const topCandidates = currentFinalRankings
      .slice(0, tierSize)
      .filter(p => !isPokemonFrozenForTier || !isPokemonFrozenForTier(p.id, activeTier))
      .filter(p => !recentlySeenPokemon.has(p.id));

    // Get Pokémon just below the cutoff (challenger pool)
    const nearCandidates = currentFinalRankings
      .slice(tierSize, tierSize + 25)
      .filter(p => !isPokemonFrozenForTier || !isPokemonFrozenForTier(p.id, activeTier))
      .filter(p => !recentlySeenPokemon.has(p.id));

    // Get lower-tier candidates (50% lower than cutoff)
    const lowerTierIndex = Math.floor(tierSize + (tierSize * 0.5));
    const lowerTierCandidates = currentFinalRankings
      .slice(lowerTierIndex, lowerTierIndex + 30)
      .filter(p => !isPokemonFrozenForTier || !isPokemonFrozenForTier(p.id, activeTier))
      .filter(p => !recentlySeenPokemon.has(p.id));

    // Get Pokémon with few battles (discovery pool)
    const unrankedPokemonIds = allPokemonForGeneration
      .filter(p => {
        const rankedData = currentFinalRankings.find(rp => rp.id === p.id);
        return !rankedData || rankedData.count < 3;
      })
      .filter(p => !recentlySeenPokemon.has(p.id))
      .map(p => p.id);
    
    // Create a mix of RankedPokemon objects and regular Pokemon objects as needed
    const unrankedCandidates: RankedPokemon[] = unrankedPokemonIds
      .map(id => {
        // Try to find in rankings first to preserve RankedPokemon properties
        const rankedVersion = currentFinalRankings.find(rp => rp.id === id);
        if (rankedVersion) return rankedVersion;
        
        // Fall back to regular Pokemon
        const basePokemon = allPokemonForGeneration.find(p => p.id === id);
        if (!basePokemon) return null;
        
        // Create a minimal RankedPokemon from a Pokemon
        return {
          ...basePokemon,
          score: 0,
          count: 0,
          confidence: 0
        } as RankedPokemon;
      })
      .filter(Boolean) as RankedPokemon[];

    // Get Pokémon that lost to lower tier opponents - try to get RankedPokemon versions
    const demotionCandidates = Array.from(lowerTierLosersMap.keys())
      .filter(id => !recentlySeenPokemon.has(id))
      .map(id => {
        // Try to find in rankings first
        const rankedVersion = currentFinalRankings.find(p => p.id === id);
        if (rankedVersion) return rankedVersion;
        
        // Fall back to regular Pokemon with minimal RankedPokemon properties
        const basePokemon = allPokemonForGeneration.find(p => p.id === id);
        if (!basePokemon) return null;
        
        return {
          ...basePokemon,
          score: 0,
          count: 0,
          confidence: 0
        } as RankedPokemon;
      })
      .filter(Boolean) as RankedPokemon[];

    // Generate a completely random value to determine battle selection strategy
    let randomValue = Math.random();
    console.log("🎲 Random strategy selection value:", randomValue.toFixed(2));
    
    // If we're forcing unranked selection, adjust the random value to favor unranked Pokemon
    if (forceUnrankedSelection) {
      randomValue = 0.85;  // Force the unranked selection path
      console.log("⚙️ Forcing unranked selection, setting strategy value to:", randomValue.toFixed(2));
    }

    // Log candidate pool sizes
    console.log(`📊 Candidate pools: Top=${topCandidates.length}, Near=${nearCandidates.length}, Lower=${lowerTierCandidates.length}, Unranked=${unrankedCandidates.length}, Demotion=${demotionCandidates.length}`);

    // If we've had too many identical battles in a row, force using completely different Pokemon
    let selectedBattle: Pokemon[] = [];
    if (consecutiveIdenticalBattles >= 2) {
      console.log("⚠️ Detected multiple identical battles in a row, forcing diversity");
      // Clear the recently seen set to allow more options
      recentlySeenPokemon.clear();
      
      // Use pickDistinctPair with an emphasis on avoiding previous battle Pokemon
      selectedBattle = pickDistinctPair(
        allPokemonForGeneration, 
        new Set<number>(), // Empty set to not filter by recently seen
        battleSize,
        previousBattlePokemonIds
      );
      
      console.log("🔄 Forced diversity battle created:", selectedBattle.map(p => `${p.name} (${p.id})`));
    }
    else {
      // Normal battle selection logic with improved variety
      if (randomValue < 0.3 && topCandidates.length >= battleSize) {
        // Top tier battle
        selectedBattle = shuffleArray(topCandidates as unknown as Pokemon[]).slice(0, battleSize);
        console.log("⚖️ Selected battle strategy: Top tier");
      } 
      else if (randomValue < 0.55 && topCandidates.length > 0 && nearCandidates.length > 0) {
        // Top vs Challenger battle
        const result = [
          topCandidates[Math.floor(Math.random() * topCandidates.length)] as unknown as Pokemon
        ];
        const neededMore = battleSize - result.length;
        result.push(...shuffleArray(nearCandidates as unknown as Pokemon[]).slice(0, neededMore));
        selectedBattle = result;
        console.log("⚖️ Selected battle strategy: Top vs Challenger");
      } 
      else if (randomValue < 0.7 && demotionCandidates.length > 0 && lowerTierCandidates.length > 0) {
        // Demotion candidate test
        const demotionCandidate = shuffleArray(demotionCandidates as unknown as Pokemon[])[0];
        const result = [demotionCandidate];
        const neededMore = battleSize - result.length;
        result.push(...shuffleArray(lowerTierCandidates as unknown as Pokemon[]).slice(0, neededMore));
        console.log(`⚖️ Selected battle strategy: Testing ${demotionCandidate.name} for demotion`);
        selectedBattle = result;
      } 
      else if (randomValue < 0.85 && unrankedCandidates.length > 0) {
        // Discovery battle - completely unranked or low count Pokemon
        selectedBattle = shuffleArray(unrankedCandidates as unknown as Pokemon[]).slice(0, battleSize);
        console.log("⚖️ Selected battle strategy: Discovery (unranked Pokemon)");
      } 
      else if (randomValue < 0.95 && topCandidates.length > 0 && unrankedCandidates.length > 0) {
        // Top vs Unranked
        const result = [
          topCandidates[Math.floor(Math.random() * topCandidates.length)] as unknown as Pokemon
        ];
        const neededMore = battleSize - result.length;
        const shuffledUnrankedSlice = shuffleArray(unrankedCandidates as unknown as Pokemon[]).slice(0, neededMore);
        result.push(...shuffledUnrankedSlice);
        selectedBattle = result;
        console.log("⚖️ Selected battle strategy: Top vs Unranked");
      } 
      else {
        // Completely random battle from all available Pokemon
        // Prioritize Pokemon that haven't been seen recently
        selectedBattle = pickDistinctPair(
          allPokemonForGeneration, 
          recentlySeenPokemon,
          battleSize,
          previousBattlePokemonIds
        );
        console.log("⚖️ Selected battle strategy: Completely random");
      }
    }

    // If we somehow failed to select enough Pokemon, fall back to a completely random selection
    if (selectedBattle.length < battleSize) {
      console.log("⚠️ Failed to select enough Pokemon with strategy, using fallback random selection");
      selectedBattle = pickDistinctPair(
        allPokemonForGeneration,
        recentlySeenPokemon,
        battleSize,
        previousBattlePokemonIds
      );
    }

    // Check if this is identical to the previous battle
    if (isSameBattle(selectedBattle, previousBattlePokemonIds)) {
      console.log("⚠️ Generated identical battle to previous. Trying again with forced diversity...");
      consecutiveIdenticalBattles++;
      
      // Try one more time with emphasis on diversity
      selectedBattle = pickDistinctPair(
        allPokemonForGeneration, 
        recentlySeenPokemon,
        battleSize,
        previousBattlePokemonIds
      );
      
      // If we STILL got the same battle (very unlikely), force a completely different approach
      if (isSameBattle(selectedBattle, previousBattlePokemonIds)) {
        console.log("🚨 STILL generated identical battle! Forcing completely random selection...");
        
        // Just get ANY Pokemon that weren't in the previous battle
        const notInPreviousBattle = allPokemonForGeneration.filter(p => !previousBattlePokemonIds.has(p.id));
        
        if (notInPreviousBattle.length >= battleSize) {
          selectedBattle = shuffleArray(notInPreviousBattle).slice(0, battleSize);
          console.log("✅ Found completely different Pokemon for battle");
        } else {
          // If we somehow can't get enough different Pokemon (should be impossible), 
          // just get ANY random Pokemon at this point
          selectedBattle = shuffleArray(allPokemonForGeneration).slice(0, battleSize);
          console.log("⚠️ Forced completely random selection as last resort");
        }
      }
    } else {
      // Reset the counter when we successfully generate a different battle
      consecutiveIdenticalBattles = 0;
    }

    // Update the previous battle tracking
    previousBattlePokemonIds.clear();
    selectedBattle.forEach(p => {
      previousBattlePokemonIds.add(p.id);
    });

    // Ensure all selected Pokemon IDs are tracked as recently seen
    selectedBattle.forEach(p => {
      recentlySeenPokemon.add(p.id);
    });

    // Maintain a maximum size for the recently seen set to eventually allow Pokemon to be reselected
    if (recentlySeenPokemon.size > Math.min(50, Math.floor(allPokemonForGeneration.length * 0.3))) {
      const oldestEntries = Array.from(recentlySeenPokemon).slice(0, 10);
      oldestEntries.forEach(id => recentlySeenPokemon.delete(id));
    }

    // IMPORTANT: Validate battle Pokemon to ensure images and names match
    const validatedBattle = validateBattlePokemon(selectedBattle);

    console.log("⚖️ Final selected battle pair IDs:", validatedBattle.map(p => p.id));
    console.log("⚖️ Final selected battle names:", validatedBattle.map(p => p.name));
    return validatedBattle;
  };

  const trackLowerTierLoss = (loserId: number) => {
    const lossCount = lowerTierLosersMap.get(loserId) || 0;
    lowerTierLosersMap.set(loserId, lossCount + 1);
    console.log(`Pokemon ID ${loserId} lost to lower tier (loss count: ${lossCount + 1})`);
    if (lossCount + 1 >= 3) {
      console.log(`Pokemon ID ${loserId} has lost ${lossCount + 1} times to lower tier opponents - candidate for freezing`);
    }
  };

  const startNewBattle = (battleType: BattleType, forceSuggestionPriority: boolean = false, forceUnrankedSelection: boolean = false): Pokemon[] => {
    battleCountRef++;
    const battleSize = battleType === "pairs" ? 2 : 3;
    let result: Pokemon[] = [];

    // For the first 25 battles, use a small subset to establish initial rankings
    if (battleCountRef <= 25) {
      const INITIAL_SUBSET_SIZE = 15;
      if (!initialSubsetRef) {
        initialSubsetRef = shuffleArray(pokemonList).slice(0, INITIAL_SUBSET_SIZE);
        console.log("🏁 Created initial subset of", INITIAL_SUBSET_SIZE, "Pokemon for early battles");
      }
      result = pickDistinctPair(
        initialSubsetRef, 
        recentlySeenPokemon, 
        battleSize,
        previousBattlePokemonIds
      );
      console.log("🔄 Early battle using initial subset:", result.map(p => p.name).join(", "));
    } else {
      result = getTierBattlePair(battleType, forceSuggestionPriority, forceUnrankedSelection);
      if (result.length < battleSize) {
        console.log("⚠️ getTierBattlePair returned insufficient Pokemon, using fallback random selection");
        result = pickDistinctPair(
          pokemonList, 
          recentlySeenPokemon, 
          battleSize,
          previousBattlePokemonIds
        );
      }
    }

    // IMPORTANT: Validate battle Pokemon to ensure images and names match before setting
    const validatedResult = validateBattlePokemon(result);

    // Log what objects we're passing to setCurrentBattle
    console.log(`[DEBUG createBattleStarter] About to set current battle with:`, 
      validatedResult.map(p => ({
        id: p.id, 
        name: p.name
      }))
    );

    // Check if this would be an identical battle to the previous one
    if (isSameBattle(validatedResult, previousBattlePokemonIds) && validatedResult.length > 0) {
      console.log("⚠️ Prevented setting identical battle!");
      
      // Force a completely different battle
      const forcedDifferentBattle = pickDistinctPair(
        allPokemonForGeneration,
        new Set<number>(), // Empty set to allow any Pokemon
        battleSize,
        previousBattlePokemonIds
      );
      
      // Validate the forced different battle
      const validatedForcedBattle = validateBattlePokemon(forcedDifferentBattle);
      
      // Update the previous battle tracking for next time
      previousBattlePokemonIds.clear();
      validatedForcedBattle.forEach(p => {
        previousBattlePokemonIds.add(p.id);
      });
      
      console.log("🔄 Forced completely different battle:", validatedForcedBattle.map(p => `${p.name} (${p.id})`));
      
      // Create and dispatch an event with the new battle info
      const battleCreatedEvent = new CustomEvent('battle-created', {
        detail: { 
          pokemonIds: validatedForcedBattle.map(p => p.id),
          pokemonNames: validatedForcedBattle.map(p => p.name)
        }
      });
      document.dispatchEvent(battleCreatedEvent);
      
      setCurrentBattle(validatedForcedBattle);
      return validatedForcedBattle;
    }
    
    // Update the previous battle tracking for next time
    previousBattlePokemonIds.clear();
    validatedResult.forEach(p => {
      previousBattlePokemonIds.add(p.id);
    });

    // Create and dispatch an event with the new battle info
    const battleCreatedEvent = new CustomEvent('battle-created', {
      detail: { 
        pokemonIds: validatedResult.map(p => p.id),
        pokemonNames: validatedResult.map(p => p.name)
      }
    });
    document.dispatchEvent(battleCreatedEvent);
    
    setCurrentBattle(validatedResult);
    console.log(`[DEBUG createBattleStarter] Current battle set.`);
    return validatedResult;
  };

  return { 
    startNewBattle, 
    trackLowerTierLoss
  };
};
