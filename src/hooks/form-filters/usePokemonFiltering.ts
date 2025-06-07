
import { Pokemon } from "@/services/pokemon";
import { FormFilters } from "./types";
import { 
  getPokemonFormCategory,
  trackFilteredPokemon,
  resetNormalPokemonTracking,
  getNormalPokemonStats
} from "./categorization";

export const usePokemonFiltering = (filters: FormFilters) => {
  const shouldIncludePokemon = (pokemon: Pokemon): boolean => {
    const pokemonId = pokemon.id;
    
    const isAllEnabled = Object.values(filters).every(Boolean);
    if (isAllEnabled) {
      return true;
    }
    
    const formCategory = getPokemonFormCategory(pokemon);
    const categoryToCheck = formCategory || "normal";
    const shouldInclude = filters[categoryToCheck];
    
    trackFilteredPokemon(pokemon, !shouldInclude, `Filter for category "${categoryToCheck}" is disabled`);
    
    return shouldInclude;
  };

  const analyzeFilteringPipeline = (inputPokemon: Pokemon[]): Pokemon[] => {
    const isAllEnabled = Object.values(filters).every(Boolean);
    
    resetNormalPokemonTracking();
    
    const sortedInput = [...inputPokemon].sort((a, b) => a.id - b.id);
    
    const filteredPokemon = sortedInput.filter((pokemon) => {
      const shouldInclude = shouldIncludePokemon(pokemon);
      return shouldInclude;
    });
    
    const normalStats = getNormalPokemonStats();
    
    const categoryCounts: Record<string, number> = {};
    filteredPokemon.forEach(pokemon => {
      const category = getPokemonFormCategory(pokemon) || 'unknown';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    const outputIds = filteredPokemon.map(p => p.id);
    const isSorted = outputIds.every((id, i) => i === 0 || id >= outputIds[i - 1]);
    
    return filteredPokemon;
  };

  return {
    shouldIncludePokemon,
    analyzeFilteringPipeline
  };
};
