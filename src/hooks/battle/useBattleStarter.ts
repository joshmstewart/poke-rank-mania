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

  // Log generation distribution
  const generationCounts = new Map<number, number>();
  allPokemonForGeneration.forEach(p => {
    let gen = 1;
    if (p.id <= 151) gen = 1;
    else if (p.id <= 251) gen = 2;
    else if (p.id <= 386) gen = 3;
    else if (p.id <= 493) gen = 4;
    else if (p.id <= 649) gen = 5;
    else if (p.id <= 721) gen = 6;
    else if (p.id <= 809) gen = 7;
    else if (p.id <= 905) gen = 8;
    else gen = 9;
    
    generationCounts.set(gen, (generationCounts.get(gen) || 0) + 1);
  });
  
  console.log(`🎯 [GENERATION_DISTRIBUTION] Available Pokemon by generation:`, 
    Array.from(generationCounts.entries()).map(([gen, count]) => `Gen ${gen}: ${count}`).join(', ')
  );

  const shuffleArray = (array: Pokemon[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // CRITICAL FIX: Ensure cross-generation selection
  const getRandomCrossGenerationPokemon = (pool: Pokemon[], count: number, excludeIds: Set<number>): Pokemon[] => {
    // Group Pokemon by generation
    const pokemonByGeneration = new Map<number, Pokemon[]>();
    pool.forEach(p => {
      if (excludeIds.has(p.id)) return;
      
      let gen = 1;
      if (p.id <= 151) gen = 1;
      else if (p.id <= 251) gen = 2;
      else if (p.id <= 386) gen = 3;
      else if (p.id <= 493) gen = 4;
      else if (p.id <= 649) gen = 5;
      else if (p.id <= 721) gen = 6;
      else if (p.id <= 809) gen = 7;
      else if (p.id <= 905) gen = 8;
      else gen = 9;
      
      if (!pokemonByGeneration.has(gen)) {
        pokemonByGeneration.set(gen, []);
      }
      pokemonByGeneration.get(gen)!.push(p);
    });

    const result: Pokemon[] = [];
    const availableGenerations = Array.from(pokemonByGeneration.keys()).filter(gen => 
      pokemonByGeneration.get(gen)!.length > 0
    );
    
    // Try to pick from different generations when possible
    for (let i = 0; i < count && result.length < count; i++) {
      if (availableGenerations.length === 0) break;
      
      const randomGen = availableGenerations[Math.floor(Math.random() * availableGenerations.length)];
      const genPokemon = pokemonByGeneration.get(randomGen)!;
      
      if (genPokemon.length > 0) {
        const randomIndex = Math.floor(Math.random() * genPokemon.length);
        const selectedPokemon = genPokemon.splice(randomIndex, 1)[0];
        result.push(selectedPokemon);
        
        console.log(`🎯 [CROSS_GEN] Selected ${selectedPokemon.name} from Generation ${randomGen}`);
        
        // Remove generation from available if empty
        if (genPokemon.length === 0) {
          const genIndex = availableGenerations.indexOf(randomGen);
          availableGenerations.splice(genIndex, 1);
        }
      }
    }
    
    // If we still need more Pokemon, fill from any available
    if (result.length < count) {
      const remaining = pool.filter(p => 
        !excludeIds.has(p.id) && !result.some(r => r.id === p.id)
      );
      const shuffledRemaining = shuffleArray(remaining);
      result.push(...shuffledRemaining.slice(0, count - result.length));
    }
    
    return result;
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

    // CRITICAL FIX: Use cross-generation selection strategy
    const randomValue = Math.random();
    console.log("🎲 Random strategy selection value:", randomValue.toFixed(2));

    let selectedBattle: Pokemon[] = [];

    // 60% chance for completely random cross-generation battle
    if (randomValue < 0.6) {
      selectedBattle = getRandomCrossGenerationPokemon(allPokemonForGeneration, battleSize, recentlySeenPokemon);
      console.log("⚖️ Selected battle strategy: Cross-generation random");
    }
    // 40% chance for ranking-based battle (if we have rankings)
    else if (currentFinalRankings.length > 0) {
      const tierSize = activeTier === "All" ? 
        currentFinalRankings.length : 
        Math.min(Number(activeTier), currentFinalRankings.length);

      const topCandidates = currentFinalRankings
        .slice(0, tierSize)
        .filter(p => !isPokemonFrozenForTier || !isPokemonFrozenForTier(p.id, activeTier))
        .filter(p => !recentlySeenPokemon.has(p.id));

      if (topCandidates.length >= battleSize) {
        selectedBattle = shuffleArray(topCandidates as unknown as Pokemon[]).slice(0, battleSize);
        console.log("⚖️ Selected battle strategy: Top tier ranking-based");
      } else {
        selectedBattle = getRandomCrossGenerationPokemon(allPokemonForGeneration, battleSize, recentlySeenPokemon);
        console.log("⚖️ Selected battle strategy: Fallback cross-generation random");
      }
    }
    // Fallback to cross-generation random
    else {
      selectedBattle = getRandomCrossGenerationPokemon(allPokemonForGeneration, battleSize, recentlySeenPokemon);
      console.log("⚖️ Selected battle strategy: Fallback cross-generation random");
    }

    if (selectedBattle.length < battleSize) {
      console.log("⚠️ Failed to select enough Pokemon with strategy, using simple random selection");
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
    
    // Log generation info for selected Pokemon
    validatedBattle.forEach((pokemon, index) => {
      let gen = 1;
      if (pokemon.id <= 151) gen = 1;
      else if (pokemon.id <= 251) gen = 2;
      else if (pokemon.id <= 386) gen = 3;
      else if (pokemon.id <= 493) gen = 4;
      else if (pokemon.id <= 649) gen = 5;
      else if (pokemon.id <= 721) gen = 6;
      else if (pokemon.id <= 809) gen = 7;
      else if (pokemon.id <= 905) gen = 8;
      else gen = 9;
      
      console.log(`🎯 [GENERATION_DEBUG] Battle Pokemon ${index + 1}: ${pokemon.name} (ID: ${pokemon.id}, Gen: ${gen})`);
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

    console.log(`🎯 [POKEMON_RANGE_FIX] Battle ${battleCountRef}: Using FULL Pokemon range with cross-generation strategy`);
    result = getTierBattlePair(battleType);
    
    if (result.length < battleSize) {
      console.log("⚠️ getTierBattlePair returned insufficient Pokemon, using fallback cross-generation selection");
      result = getRandomCrossGenerationPokemon(allPokemonForGeneration, battleSize, new Set());
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
