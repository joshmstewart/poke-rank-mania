import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { BattleType } from "./types";
import { validateBattlePokemon } from "@/services/pokemon/api/utils";

// Helper to check if two battle sets contain the same Pokemon
const areBattlesIdentical = (battle1: Pokemon[], previousBattleIds: Set<number>) => {
  if (battle1.length === 0 || previousBattleIds.size === 0) return false;
  
  // Check if every Pokemon in battle1 is in previousBattleIds
  return battle1.every(p => previousBattleIds.has(p.id));
};

export const createBattleStarter = (
  pokemonList: Pokemon[],
  allPokemonForGeneration: Pokemon[],
  currentFinalRankings: RankedPokemon[],
  setCurrentBattle: (battle: Pokemon[]) => void,
  activeTier: TopNOption = "All",
  isPokemonFrozenForTier?: (pokemonId: number, tier: TopNOption) => boolean
) => {
  console.log('[DEBUG createBattleStarter] INSTANCE: New createBattleStarter instance created.');

  // Use plain objects instead of hooks
  const recentlySeenPokemon = new Set<number>();
  const previousBattleIds = new Set<number>(); // Track IDs of previous battle for duplicate detection
  let battleCountRef = 0;
  let initialSubsetRef: Pokemon[] | null = null;
  let lowerTierLosersMap = new Map<number, number>(); // Track Pokemon that lost to lower tier opponents
  let lastBattleTimestamp = 0; // Track when we last started a battle to prevent rapid fire

  // Debug timestamps
  const getTimestamp = () => new Date().toISOString();
  const logWithTime = (message: string) => {
    console.log(`[${getTimestamp()}] ${message}`);
  };

  const shuffleArray = (array: Pokemon[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const pickDistinctPair = (pool: Pokemon[], seen: Set<number>, size: number) => {
    logWithTime(`pickDistinctPair called with pool size ${pool.length}, seen size ${seen.size}, target size ${size}`);
    
    // First try to pick from Pokemon that haven't been seen recently
    const filteredPool = pool.filter(p => !seen.has(p.id));
    logWithTime(`filteredPool (unseen Pokemon) size: ${filteredPool.length}`);
    
    // If we have enough unseen Pokemon, use those
    if (filteredPool.length >= size) {
      const result = shuffleArray(filteredPool).slice(0, size);
      logWithTime(`Using unseen Pokemon for battle: ${result.map(p => `${p.name} (${p.id})`).join(', ')}`);
      return result;
    }
    
    // Otherwise, shuffle the entire pool to ensure some randomness
    // This ensures we don't keep seeing the same Pokemon over and over
    const shuffledPool = shuffleArray(pool);
    
    // Make sure we prioritize Pokemon we haven't seen recently
    const result = [];
    const tempSeen = new Set([...seen]);
    
    // First add any unseen Pokemon
    for (const pokemon of shuffledPool) {
      if (!tempSeen.has(pokemon.id) && result.length < size) {
        result.push(pokemon);
        tempSeen.add(pokemon.id);
      }
      
      if (result.length >= size) break;
    }
    
    // If we still need more, add from any Pokemon
    if (result.length < size) {
      logWithTime(`Not enough unseen Pokemon, adding from the entire pool`);
      for (const pokemon of shuffledPool) {
        if (!result.some(p => p.id === pokemon.id) && result.length < size) {
          result.push(pokemon);
        }
        
        if (result.length >= size) break;
      }
    }
    
    logWithTime(`Final battle selection: ${result.map(p => `${p.name} (${p.id})`).join(', ')}`);
    return result;
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

  const getTierBattlePair = (battleType: BattleType): Pokemon[] => {
    logWithTime(`🌟 Battle generation started. Battle type: ${battleType}`);
    logWithTime(`📋 All Pokémon count: ${allPokemonForGeneration.length}, Ranked Pokémon count: ${currentFinalRankings.length}`);

    const battleSize = battleType === "pairs" ? 2 : 3;
    logWithTime(`🎯 [createBattleStarter] battleSize determined: ${battleSize}, battleType: ${battleType}`);

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
    const randomValue = Math.random();
    logWithTime(`🎲 Random strategy selection value: ${randomValue.toFixed(2)}`);

    // Battle selection logic with improved variety
    let selectedBattle: Pokemon[] = [];
    
    // Log candidate pool sizes
    logWithTime(`📊 Candidate pools: Top=${topCandidates.length}, Near=${nearCandidates.length}, Lower=${lowerTierCandidates.length}, Unranked=${unrankedCandidates.length}, Demotion=${demotionCandidates.length}`);

    if (randomValue < 0.3 && topCandidates.length >= battleSize) {
      // Top tier battle
      selectedBattle = shuffleArray(topCandidates as unknown as Pokemon[]).slice(0, battleSize);
      logWithTime(`⚖️ Selected battle strategy: Top tier`);
    } 
    else if (randomValue < 0.55 && topCandidates.length > 0 && nearCandidates.length > 0) {
      // Top vs Challenger battle
      const result = [
        topCandidates[Math.floor(Math.random() * topCandidates.length)] as unknown as Pokemon
      ];
      const neededMore = battleSize - result.length;
      result.push(...shuffleArray(nearCandidates as unknown as Pokemon[]).slice(0, neededMore));
      selectedBattle = result;
      logWithTime(`⚖️ Selected battle strategy: Top vs Challenger`);
    } 
    else if (randomValue < 0.7 && demotionCandidates.length > 0 && lowerTierCandidates.length > 0) {
      // Demotion candidate test
      const demotionCandidate = shuffleArray(demotionCandidates as unknown as Pokemon[])[0];
      const result = [demotionCandidate];
      const neededMore = battleSize - result.length;
      result.push(...shuffleArray(lowerTierCandidates as unknown as Pokemon[]).slice(0, neededMore));
      logWithTime(`⚖️ Selected battle strategy: Testing ${demotionCandidate.name} for demotion`);
      selectedBattle = result;
    } 
    else if (randomValue < 0.85 && unrankedCandidates.length > 0) {
      // Discovery battle - completely unranked or low count Pokemon
      selectedBattle = shuffleArray(unrankedCandidates as unknown as Pokemon[]).slice(0, battleSize);
      logWithTime(`⚖️ Selected battle strategy: Discovery (unranked Pokemon)`);
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
      logWithTime(`⚖️ Selected battle strategy: Top vs Unranked`);
    } 
    else {
      // Completely random battle from all available Pokemon
      // Prioritize Pokemon that haven't been seen recently
      const filteredPool = allPokemonForGeneration.filter(p => !recentlySeenPokemon.has(p.id));
      
      if (filteredPool.length >= battleSize) {
        selectedBattle = shuffleArray(filteredPool).slice(0, battleSize);
        logWithTime(`⚖️ Selected battle strategy: Random from filtered pool`);
      } else {
        selectedBattle = shuffleArray(allPokemonForGeneration).slice(0, battleSize);
        logWithTime(`⚖️ Selected battle strategy: Completely random from all Pokemon`);
      }
    }

    // If we somehow failed to select enough Pokemon, fall back to a completely random selection
    if (selectedBattle.length < battleSize) {
      logWithTime(`⚠️ Failed to select enough Pokemon with strategy, using fallback random selection`);
      selectedBattle = shuffleArray(allPokemonForGeneration).slice(0, battleSize);
    }

    // Ensure all selected Pokemon IDs are tracked as recently seen
    selectedBattle.forEach(p => {
      recentlySeenPokemon.add(p.id);
    });

    // Maintain a maximum size for the recently seen set to eventually allow Pokemon to be reselected
    if (recentlySeenPokemon.size > Math.min(50, Math.floor(allPokemonForGeneration.length * 0.3))) {
      const oldestEntries = Array.from(recentlySeenPokemon).slice(0, 10);
      oldestEntries.forEach(id => recentlySeenPokemon.delete(id));
      logWithTime(`🔄 Removed ${oldestEntries.length} oldest entries from recently seen Pokemon`);
    }

    // IMPORTANT: Validate battle Pokemon to ensure images and names match
    const validatedBattle = validateBattlePokemon(selectedBattle);

    // Check if this battle is identical to the previously generated one
    if (previousBattleIds.size > 0 && areBattlesIdentical(validatedBattle, previousBattleIds)) {
      logWithTime(`⚠️ Generated identical battle to previous! [${validatedBattle.map(p => p.id).join(',')}]`);
      logWithTime(`⚠️ Forcing a completely different selection`);
      
      // Clear the previous battle ids set to prevent comparison issues
      previousBattleIds.clear();
      
      // Force a completely different selection using Pokemon far from the current selection
      const completeDifferentPool = allPokemonForGeneration.filter(p => 
        !validatedBattle.some(vp => vp.id === p.id) && !recentlySeenPokemon.has(p.id));
      
      if (completeDifferentPool.length >= battleSize) {
        const newBattle = shuffleArray(completeDifferentPool).slice(0, battleSize);
        logWithTime(`🔄 Forced new battle with completely different Pokemon: [${newBattle.map(p => `${p.name} (${p.id})`).join(', ')}]`);
        
        // Update recently seen with new Pokemon
        newBattle.forEach(p => recentlySeenPokemon.add(p.id));
        
        // IMPORTANT: Validate the new battle
        const validatedNewBattle = validateBattlePokemon(newBattle);
        
        // Remember these Pokemon for next check
        validatedNewBattle.forEach(p => previousBattleIds.add(p.id));
        
        logWithTime(`⚖️ Final selected battle pair IDs after duplicate prevention: [${validatedNewBattle.map(p => p.id).join(',')}]`);
        logWithTime(`⚖️ Final selected battle names: [${validatedNewBattle.map(p => p.name).join(', ')}]`);
        
        return validatedNewBattle;
      }
    }

    // Remember this battle for next duplicate check
    previousBattleIds.clear();
    validatedBattle.forEach(p => previousBattleIds.add(p.id));
    
    logWithTime(`⚖️ Final selected battle pair IDs: [${validatedBattle.map(p => p.id).join(',')}]`);
    logWithTime(`⚖️ Final selected battle names: [${validatedBattle.map(p => p.name).join(', ')}]`);
    return validatedBattle;
  };

  const trackLowerTierLoss = (loserId: number) => {
    const lossCount = lowerTierLosersMap.get(loserId) || 0;
    lowerTierLosersMap.set(loserId, lossCount + 1);
    logWithTime(`Pokemon ID ${loserId} lost to lower tier (loss count: ${lossCount + 1})`);
    if (lossCount + 1 >= 3) {
      logWithTime(`Pokemon ID ${loserId} has lost ${lossCount + 1} times to lower tier opponents - candidate for freezing`);
    }
  };

  const startNewBattle = (battleType: BattleType, forceSuggestion: boolean = false, forceUnranked: boolean = false): Pokemon[] => {
    // Log at the very beginning
    console.log('[DEBUG createBattleStarter] startNewBattle_INTERNAL: Called. Internal battleCountRef:', battleCountRef, 
                'Internal previousBattleIds:', Array.from(previousBattleIds), 
                'Internal recentlySeenPokemon size:', recentlySeenPokemon.size);
    
    // Throttle battle generation to prevent rapid-fire calls
    const now = Date.now();
    const minTimeoutMs = 500; // Minimum 500ms between battle generations
    
    if (now - lastBattleTimestamp < minTimeoutMs) {
      logWithTime(`⚠️ Battle generation throttled. Last battle was ${now - lastBattleTimestamp}ms ago. Minimum interval: ${minTimeoutMs}ms`);
      return [];
    }
    
    // Update timestamp
    lastBattleTimestamp = now;
    
    // Increment battle counter
    battleCountRef++;
    const battleSize = battleType === "pairs" ? 2 : 3;
    let result: Pokemon[] = [];

    logWithTime(`🔢 Starting battle #${battleCountRef} with type: ${battleType}, size: ${battleSize}`);
    
    // For the first 25 battles, use a small subset to establish initial rankings
    if (battleCountRef <= 25) {
      const INITIAL_SUBSET_SIZE = 15;
      if (!initialSubsetRef) {
        initialSubsetRef = shuffleArray(pokemonList).slice(0, INITIAL_SUBSET_SIZE);
        logWithTime(`🏁 Created initial subset of ${INITIAL_SUBSET_SIZE} Pokemon for early battles`);
      }
      result = pickDistinctPair(initialSubsetRef, recentlySeenPokemon, battleSize);
      logWithTime(`🔄 Early battle #${battleCountRef} using initial subset: ${result.map(p => p.name).join(", ")}`);
    } else {
      result = getTierBattlePair(battleType);
      if (result.length < battleSize) {
        logWithTime(`⚠️ getTierBattlePair returned insufficient Pokemon, using fallback random selection`);
        result = shuffleArray(pokemonList).slice(0, battleSize);
      }
    }

    // IMPORTANT: Validate battle Pokemon to ensure images and names match before setting
    const validatedResult = validateBattlePokemon(result);
    console.log('[DEBUG createBattleStarter] startNewBattle_INTERNAL: validatedResult IDs:', validatedResult.map(p => p.id));
    
    // Check if we're trying to set an identical battle to what's already in state
    if (previousBattleIds.size > 0 && areBattlesIdentical(validatedResult, previousBattleIds)) {
      logWithTime(`⚠️ Prevented setting identical battle! [${validatedResult.map(p => p.id).join(',')}]`);
      
      // Create a completely different selection
      const differentPool = allPokemonForGeneration.filter(p => !previousBattleIds.has(p.id));
      const newBattle = shuffleArray(differentPool).slice(0, battleSize);
      
      // Clear the previous battle tracking to prevent comparison issues
      previousBattleIds.clear();
      
      // Update our tracking with the new different battle
      newBattle.forEach(p => {
        recentlySeenPokemon.add(p.id);
        previousBattleIds.add(p.id);
      });
      
      logWithTime(`🔄 Forced completely different battle: ${newBattle.map(p => `${p.name} (${p.id})`).join(', ')}`);
      
      // Create and dispatch an event with the forced battle info
      const battleCreatedEvent = new CustomEvent('battle-created', {
        detail: { 
          pokemonIds: newBattle.map(p => p.id),
          pokemonNames: newBattle.map(p => p.name),
          timestamp: now,
          wasForced: true
        }
      });
      document.dispatchEvent(battleCreatedEvent);
      
      console.log('[DEBUG createBattleStarter] startNewBattle_INTERNAL: About to call prop setCurrentBattle. Dispatching battle-created event with IDs:', newBattle.map(p => p.id));
      
      setCurrentBattle(newBattle);
      return newBattle;
    }

    // Update previous battle IDs for next check
    previousBattleIds.clear();
    validatedResult.forEach(p => previousBattleIds.add(p.id));
    
    // Create and dispatch an event with the new battle info
    const battleCreatedEvent = new CustomEvent('battle-created', {
      detail: { 
        pokemonIds: validatedResult.map(p => p.id),
        pokemonNames: validatedResult.map(p => p.name),
        timestamp: now,
        wasForced: false
      }
    });
    document.dispatchEvent(battleCreatedEvent);
    
    console.log('[DEBUG createBattleStarter] startNewBattle_INTERNAL: About to call prop setCurrentBattle. Dispatching battle-created event with IDs:', validatedResult.map(p => p.id));
    
    logWithTime(`[DEBUG createBattleStarter] About to set current battle with: ${validatedResult.map(p => `${p.name} (${p.id})`).join(', ')}`);
    setCurrentBattle(validatedResult);
    logWithTime(`[DEBUG createBattleStarter] Current battle set.`);
    return validatedResult;
  };

  return { 
    startNewBattle, 
    trackLowerTierLoss
  };
};
