
import { Pokemon } from "@/services/pokemon";
import { FormFilters } from "./types";
import { 
  getPokemonFormCategory,
  trackFilteredPokemon,
  resetNormalPokemonTracking,
  getNormalPokemonStats
} from "./categorization";

export const usePokemonFiltering = (filters: FormFilters) => {
  // CRITICAL FIX: Updated Pokemon filtering - blocked Pokemon are now categorized but can be toggled
  const shouldIncludePokemon = (pokemon: Pokemon): boolean => {
    const pokemonId = pokemon.id;
    
    // If all filters are enabled, include all Pokemon (including blocked if that filter is enabled)
    const isAllEnabled = Object.values(filters).every(Boolean);
    if (isAllEnabled) {
      console.log(`✅ [FILTER_DEBUG] Pokemon ${pokemonId} "${pokemon.name}" included - all filters enabled`);
      return true;
    }
    
    const formCategory = getPokemonFormCategory(pokemon);
    
    // If no form category is determined, default to normal
    const categoryToCheck = formCategory || "normal";
    
    // Check if the filter for this category is enabled
    const shouldInclude = filters[categoryToCheck];
    
    // Track filtered Pokemon for debugging
    trackFilteredPokemon(pokemon, !shouldInclude, `Filter for category "${categoryToCheck}" is disabled`);
    
    console.log(`🔍 [FILTER_DEBUG] Pokemon ${pokemonId} "${pokemon.name}" category: ${categoryToCheck}, filter enabled: ${filters[categoryToCheck]}, included: ${shouldInclude}`);
    
    return shouldInclude;
  };

  // CRITICAL FIX: Deterministic filtering pipeline with comprehensive tracking
  const analyzeFilteringPipeline = (inputPokemon: Pokemon[]): Pokemon[] => {
    console.log(`🔍 [DETERMINISTIC_FILTER_PIPELINE] ===== STARTING DETERMINISTIC FILTER ANALYSIS =====`);
    console.log(`🔍 [DETERMINISTIC_FILTER_PIPELINE] Input Pokemon count: ${inputPokemon.length}`);
    console.log(`🔍 [DETERMINISTIC_FILTER_PIPELINE] Current filter states:`, filters);
    
    const isAllEnabled = Object.values(filters).every(Boolean);
    console.log(`🔍 [DETERMINISTIC_FILTER_PIPELINE] All filters enabled: ${isAllEnabled}`);
    
    // Reset tracking for this analysis
    resetNormalPokemonTracking();
    
    // CRITICAL: Sort input by ID for absolute determinism
    const sortedInput = [...inputPokemon].sort((a, b) => a.id - b.id);
    console.log(`🔍 [DETERMINISTIC_FILTER_PIPELINE] Sorted input by ID for determinism`);
    
    // Apply filtering deterministically with detailed tracking
    const filteredPokemon = sortedInput.filter((pokemon, index) => {
      const shouldInclude = shouldIncludePokemon(pokemon);
      if (index < 10 || !shouldInclude) {
        console.log(`🔍 [FILTER_SAMPLE] Pokemon ${pokemon.id} "${pokemon.name}" -> included: ${shouldInclude}`);
      }
      return shouldInclude;
    });
    
    console.log(`🔍 [DETERMINISTIC_FILTER_PIPELINE] Output Pokemon count: ${filteredPokemon.length}`);
    console.log(`🔍 [DETERMINISTIC_FILTER_PIPELINE] Filtered out: ${sortedInput.length - filteredPokemon.length}`);
    
    // Get detailed normal Pokemon stats
    const normalStats = getNormalPokemonStats();
    console.log(`📊 [NORMAL_POKEMON_STATS] Tracked: ${normalStats.tracked}, Filtered out: ${normalStats.filteredOut}, Remaining: ${normalStats.remaining}`);
    
    if (normalStats.filteredOut > 0) {
      console.log(`❌ [MISSING_NORMAL_POKEMON] ${normalStats.filteredOut} normal Pokemon were filtered out!`);
      console.log(`❌ [FILTERED_OUT_IDS] IDs: ${normalStats.filteredOutIds.slice(0, 20).join(', ')}${normalStats.filteredOutIds.length > 20 ? '...' : ''}`);
    }
    
    // Count Pokemon by category in the output
    const categoryCounts: Record<string, number> = {};
    filteredPokemon.forEach(pokemon => {
      const category = getPokemonFormCategory(pokemon) || 'unknown';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    console.log(`📊 [OUTPUT_CATEGORY_COUNTS]`, categoryCounts);
    
    // Verify output is still sorted
    const outputIds = filteredPokemon.map(p => p.id);
    const isSorted = outputIds.every((id, i) => i === 0 || id >= outputIds[i - 1]);
    console.log(`🔍 [DETERMINISTIC_FILTER_PIPELINE] Output still sorted by ID: ${isSorted}`);
    
    console.log(`🔍 [DETERMINISTIC_FILTER_PIPELINE] ===== DETERMINISTIC FILTER ANALYSIS COMPLETE =====`);
    
    return filteredPokemon;
  };

  return {
    shouldIncludePokemon,
    analyzeFilteringPipeline
  };
};
