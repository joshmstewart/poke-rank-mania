
import { useFilterState } from "./useFilterState";
import { usePokemonFiltering } from "./usePokemonFiltering";
import { useFormFilterDebug } from "./useFormFilterDebug";
import { getPokemonFormCategory } from "./categorization";

export const useFormFilters = () => {
  const {
    filters,
    isAllEnabled,
    toggleFilter,
    toggleAll,
    resetFilters
  } = useFilterState();

  const {
    shouldIncludePokemon,
    analyzeFilteringPipeline
  } = usePokemonFiltering(filters);

  const {
    getMiscategorizedPokemonExamples,
    logStats,
    storePokemon,
    getStoredPokemon,
    clearStoredPokemon,
    getNormalPokemonStats
  } = useFormFilterDebug();
  
  // Return the filter state and functions
  return {
    filters,
    toggleFilter,
    isAllEnabled,
    toggleAll,
    resetFilters,
    shouldIncludePokemon,
    analyzeFilteringPipeline,
    getPokemonFormCategory,
    getMiscategorizedPokemonExamples,
    storePokemon,
    getStoredPokemon,
    clearStoredPokemon,
    getNormalPokemonStats
  };
};
