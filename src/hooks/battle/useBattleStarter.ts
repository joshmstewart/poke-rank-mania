
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { BattleType } from "./types";
import { validateBattlePokemon } from "@/services/pokemon/api/utils";

export const createBattleStarter = (
  pokemonList: Pokemon[],
  allPokemonForGeneration: Pokemon[],
  currentFinalRankings: RankedPokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  activeTier: TopNOption = "All",
  isPokemonFrozenForTier?: (pokemonId: number, tier: TopNOption) => boolean
) => {
  // Use plain objects instead of hooks
  const recentlySeenPokemon = new Set<number>();
  let battleCountRef = 0;
  let lowerTierLosersMap = new Map<number, number>();

  console.log(`🎯 [POKEMON_RANGE_FIX] createBattleStarter initialized with ${allPokemonForGeneration.length} total Pokemon`);
  console.log(`🎯 [POKEMON_RANGE_FIX] Pokemon ID range: ${Math.min(...allPokemonForGeneration.map(p => p.id))} to ${Math.max(...allPokemonForGeneration.map(p => p.id))}`);

  const shuffleArray = (array: Pokemon[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const pickDistinctPair = (pool: Pokemon[], seen: Set<number>, size: number) => {
    const filteredPool = pool.filter(p => !seen.has(p.id));
    
    if (filteredPool.length >= size) {
      return shuffleArray(filteredPool).slice(0, size);
    }
    
    const shuffledPool = shuffleArray(pool);
    const result = [];
    const tempSeen = new Set([...seen]);
    
    for (const pokemon of shuffledPool) {
      if (!tempSeen.has(pokemon.id) && result.length < size) {
        result.push(pokemon);
        tempSeen.add(pokemon.id);
      }
      
      if (result.length >= size) break;
    }
    
    if (result.length < size) {
      for (const pokemon of shuffledPool) {
        if (!result.some(p => p.id === pokemon.id) && result.length < size) {
          result.push(pokemon);
        }
        
        if (result.length >= size) break;
      }
    }
    
    return result;
  };

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

  const ensureRankedPokemonArray = (pokemonArray: Pokemon[]): RankedPokemon[] => {
    return pokemonArray.map(ensureRankedPokemon);
  };

  const getTierBattlePair = (battleType: BattleType): Pokemon[] => {
    console.log("🌟 Battle generation started. Battle type:", battleType);
    console.log("📋 All Pokémon count:", allPokemonForGeneration.length, "Ranked Pokémon count:", currentFinalRankings.length);

    const battleSize = battleType === "pairs" ? 2 : 3;
    console.log("🎯 [useBattleStarter] battleSize determined:", battleSize, "battleType:", battleType);

    // CRITICAL FIX: Always use full Pokemon pool, no early battle subset
    const allAvailablePokemon = allPokemonForGeneration.filter(p => !recentlySeenPokemon.has(p.id));
    
    console.log(`🎯 [POKEMON_RANGE_FIX] Using FULL Pokemon pool of ${allAvailablePokemon.length} Pokemon`);
    console.log(`🎯 [POKEMON_RANGE_FIX] Full range IDs available: ${Math.min(...allAvailablePokemon.map(p => p.id))} to ${Math.max(...allAvailablePokemon.map(p => p.id))}`);

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

    // Get Pokémon with few battles (discovery pool) - FROM FULL RANGE
    const unrankedPokemonIds = allPokemonForGeneration
      .filter(p => {
        const rankedData = currentFinalRankings.find(rp => rp.id === p.id);
        return !rankedData || rankedData.count < 3;
      })
      .filter(p => !recentlySeenPokemon.has(p.id))
      .map(p => p.id);
    
    const unrankedCandidates: RankedPokemon[] = unrankedPokemonIds
      .map(id => {
        const rankedVersion = currentFinalRankings.find(rp => rp.id === id);
        if (rankedVersion) return rankedVersion;
        
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

    // Get Pokémon that lost to lower tier opponents
    const demotionCandidates = Array.from(lowerTierLosersMap.keys())
      .filter(id => !recentlySeenPokemon.has(id))
      .map(id => {
        const rankedVersion = currentFinalRankings.find(p => p.id === id);
        if (rankedVersion) return rankedVersion;
        
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

    const randomValue = Math.random();
    console.log("🎲 Random strategy selection value:", randomValue.toFixed(2));

    let selectedBattle: Pokemon[] = [];
    
    console.log(`📊 Candidate pools: Top=${topCandidates.length}, Near=${nearCandidates.length}, Lower=${lowerTierCandidates.length}, Unranked=${unrankedCandidates.length}, Demotion=${demotionCandidates.length}`);

    if (randomValue < 0.3 && topCandidates.length >= battleSize) {
      selectedBattle = shuffleArray(topCandidates as unknown as Pokemon[]).slice(0, battleSize);
      console.log("⚖️ Selected battle strategy: Top tier");
    } 
    else if (randomValue < 0.55 && topCandidates.length > 0 && nearCandidates.length > 0) {
      const result = [
        topCandidates[Math.floor(Math.random() * topCandidates.length)] as unknown as Pokemon
      ];
      const neededMore = battleSize - result.length;
      result.push(...shuffleArray(nearCandidates as unknown as Pokemon[]).slice(0, neededMore));
      selectedBattle = result;
      console.log("⚖️ Selected battle strategy: Top vs Challenger");
    } 
    else if (randomValue < 0.7 && demotionCandidates.length > 0 && lowerTierCandidates.length > 0) {
      const demotionCandidate = shuffleArray(demotionCandidates as unknown as Pokemon[])[0];
      const result = [demotionCandidate];
      const neededMore = battleSize - result.length;
      result.push(...shuffleArray(lowerTierCandidates as unknown as Pokemon[]).slice(0, neededMore));
      console.log(`⚖️ Selected battle strategy: Testing ${demotionCandidate.name} for demotion`);
      selectedBattle = result;
    } 
    else if (randomValue < 0.85 && unrankedCandidates.length > 0) {
      selectedBattle = shuffleArray(unrankedCandidates as unknown as Pokemon[]).slice(0, battleSize);
      console.log("⚖️ Selected battle strategy: Discovery (unranked Pokemon)");
    } 
    else if (randomValue < 0.95 && topCandidates.length > 0 && unrankedCandidates.length > 0) {
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
      // CRITICAL FIX: Use full Pokemon range for completely random battles
      selectedBattle = shuffleArray(allPokemonForGeneration).slice(0, battleSize);
      console.log("⚖️ Selected battle strategy: Completely random from FULL range");
    }

    if (selectedBattle.length < battleSize) {
      console.log("⚠️ Failed to select enough Pokemon with strategy, using fallback random selection from FULL range");
      selectedBattle = shuffleArray(allPokemonForGeneration).slice(0, battleSize);
    }

    selectedBattle.forEach(p => {
      recentlySeenPokemon.add(p.id);
    });

    if (recentlySeenPokemon.size > Math.min(100, Math.floor(allPokemonForGeneration.length * 0.1))) {
      const oldestEntries = Array.from(recentlySeenPokemon).slice(0, 20);
      oldestEntries.forEach(id => recentlySeenPokemon.delete(id));
    }

    const validatedBattle = validateBattlePokemon(selectedBattle);

    console.log("⚖️ Final selected battle pair IDs:", validatedBattle.map(p => p.id));
    console.log("⚖️ Final selected battle names:", validatedBattle.map(p => p.name));
    
    // CRITICAL: Log type data for color debugging
    validatedBattle.forEach((pokemon, index) => {
      console.log(`🎯 [TYPE_DEBUG] Final battle Pokemon ${index + 1}: ${pokemon.name} (ID: ${pokemon.id})`);
      console.log(`🎯 [TYPE_DEBUG] - Raw types:`, pokemon.types);
      console.log(`🎯 [TYPE_DEBUG] - Types length:`, pokemon.types?.length || 0);
      if (!pokemon.types || pokemon.types.length === 0) {
        console.error(`🚨 [TYPE_DEBUG] - NO TYPES for ${pokemon.name}! This will cause color issues.`);
      }
    });
    
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

  const startNewBattle = (battleType: BattleType): Pokemon[] => {
    battleCountRef++;
    const battleSize = battleType === "pairs" ? 2 : 3;
    let result: Pokemon[] = [];

    // CRITICAL FIX: Remove early battle subset limitation - always use full range
    console.log(`🎯 [POKEMON_RANGE_FIX] Battle ${battleCountRef}: Using FULL Pokemon range (no subset)`);
    result = getTierBattlePair(battleType);
    
    if (result.length < battleSize) {
      console.log("⚠️ getTierBattlePair returned insufficient Pokemon, using fallback random selection from FULL range");
      result = shuffleArray(allPokemonForGeneration).slice(0, battleSize);
    }

    const validatedResult = validateBattlePokemon(result);

    console.log(`[DEBUG useBattleStarter] About to set current battle with:`, 
      validatedResult.map(p => ({
        id: p.id, 
        name: p.name
      }))
    );

    const battleCreatedEvent = new CustomEvent('battle-created', {
      detail: { 
        pokemonIds: validatedResult.map(p => p.id),
        pokemonNames: validatedResult.map(p => p.name)
      }
    });
    document.dispatchEvent(battleCreatedEvent);
    
    setCurrentBattle(validatedResult);
    console.log(`[DEBUG useBattleStarter] Current battle set.`);
    return validatedResult;
  };

  return { 
    startNewBattle, 
    trackLowerTierLoss
  };
};
