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

  console.log(`⚡ [SPEED_FIX] createBattleStarter initialized with ${allPokemonForGeneration.length} total Pokemon`);

  // SPEED FIX: Simplified generation analysis - only log if we have time
  if (allPokemonForGeneration.length > 500) {
    console.log(`🎯 [POKEMON_RANGE_FIX] Pokemon ID range: ${Math.min(...allPokemonForGeneration.map(p => p.id))} to ${Math.max(...allPokemonForGeneration.map(p => p.id))}`);
  }

  const shuffleArray = (array: Pokemon[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // SPEED FIX: Simplified cross-generation selection for faster initial battles
  const getRandomCrossGenerationPokemon = (pool: Pokemon[], count: number, excludeIds: Set<number>): Pokemon[] => {
    // For small pools or initial battles, use simple random selection
    if (pool.length < 100) {
      const available = pool.filter(p => !excludeIds.has(p.id));
      return shuffleArray(available).slice(0, count);
    }

    // For larger pools, use the full cross-generation logic
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
    console.log("⚡ [SPEED_FIX] Fast battle generation started. Battle type:", battleType);
    
    const battleSize = battleType === "pairs" ? 2 : 3;

    // SPEED FIX: For initial battles, use simple random selection
    const selectedBattle = getRandomCrossGenerationPokemon(allPokemonForGeneration, battleSize, recentlySeenPokemon);
    
    if (selectedBattle.length < battleSize) {
      console.log("⚠️ Failed to select enough Pokemon with strategy, using simple random selection");
      const fallback = shuffleArray(allPokemonForGeneration).slice(0, battleSize);
      return fallback;
    }

    selectedBattle.forEach(p => {
      recentlySeenPokemon.add(p.id);
    });

    if (recentlySeenPokemon.size > Math.min(50, Math.floor(allPokemonForGeneration.length * 0.1))) {
      const oldestEntries = Array.from(recentlySeenPokemon).slice(0, 10);
      oldestEntries.forEach(id => recentlySeenPokemon.delete(id));
    }

    const validatedBattle = validateBattlePokemon(selectedBattle);
    console.log("⚡ [SPEED_FIX] Fast battle created:", validatedBattle.map(p => p.name));
    
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

    console.log(`⚡ [SPEED_FIX] Battle ${battleCountRef}: Fast battle generation`);
    result = getTierBattlePair(battleType);
    
    if (result.length < battleSize) {
      console.log("⚠️ getTierBattlePair returned insufficient Pokemon, using simple fallback");
      result = shuffleArray(allPokemonForGeneration).slice(0, battleSize);
    }

    const validatedResult = validateBattlePokemon(result);

    const battleCreatedEvent = new CustomEvent('battle-created', {
      detail: { 
        pokemonIds: validatedResult.map(p => p.id),
        pokemonNames: validatedResult.map(p => p.name)
      }
    });
    document.dispatchEvent(battleCreatedEvent);
    
    setCurrentBattle(validatedResult);
    return validatedResult;
  };

  return { 
    startNewBattle, 
    trackLowerTierLoss
  };
};
