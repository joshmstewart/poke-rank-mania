
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { shuffleArray } from "./useBattleStarterUtils";

export const pickDistinctPair = (pool: Pokemon[], seen: Set<number>, size: number) => {
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

export const ensureRankedPokemon = (pokemon: Pokemon): RankedPokemon => {
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

export const ensureRankedPokemonArray = (pokemonArray: Pokemon[]): RankedPokemon[] => {
  return pokemonArray.map(ensureRankedPokemon);
};
