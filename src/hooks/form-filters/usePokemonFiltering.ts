
import { Pokemon } from "@/services/pokemon";
import { FormFilters } from "./types";
import { 
  getPokemonFormCategory,
  trackFilteredPokemon,
  resetNormalPokemonTracking,
  getNormalPokemonStats
} from "./categorization";
import { formatPokemonName } from "@/utils/pokemon/nameFormatter";

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
    console.log(`🔍🔍🔍 [FILTERING_PIPELINE_ULTRA_DEBUG] ===== STARTING PIPELINE ANALYSIS =====`);
    console.log(`🔍🔍🔍 [FILTERING_PIPELINE_ULTRA_DEBUG] Input Pokemon count: ${inputPokemon.length}`);
    
    const isAllEnabled = Object.values(filters).every(Boolean);
    
    resetNormalPokemonTracking();
    
    const sortedInput = [...inputPokemon].sort((a, b) => a.id - b.id);
    console.log(`🔍🔍🔍 [FILTERING_PIPELINE_ULTRA_DEBUG] Sorted input Pokemon count: ${sortedInput.length}`);
    
    // ULTRA-CRITICAL: Log Deoxys input names
    const deoxysInput = sortedInput.filter(p => p.name.toLowerCase().includes('deoxys'));
    console.log(`🔍🔍🔍 [DEOXYS_INPUT_ULTRA_DEBUG] Deoxys in input: ${deoxysInput.length}`);
    deoxysInput.forEach(p => {
      console.log(`🔍🔍🔍 [DEOXYS_INPUT_ULTRA_DEBUG] Input Deoxys: "${p.name}" (ID: ${p.id})`);
    });
    
    const filteredPokemon = sortedInput.filter((pokemon) => {
      const shouldInclude = shouldIncludePokemon(pokemon);
      return shouldInclude;
    }).map((pokemon) => {
      // ULTRA-CRITICAL: Apply name formatting and log the transformation
      const originalName = pokemon.name;
      const formattedName = formatPokemonName(originalName);
      
      if (originalName.toLowerCase().includes('deoxys')) {
        console.log(`🔍🔍🔍 [DEOXYS_FORMATTING_ULTRA_DEBUG] Formatting Deoxys: "${originalName}" -> "${formattedName}"`);
      }
      
      // Create new Pokemon object with formatted name
      const formattedPokemon = {
        ...pokemon,
        name: formattedName
      };
      
      console.log(`🔍🔍🔍 [FORMATTING_ULTRA_DEBUG] Pokemon ${pokemon.id}: "${originalName}" -> "${formattedName}"`);
      
      return formattedPokemon;
    });
    
    console.log(`🔍🔍🔍 [FILTERING_PIPELINE_ULTRA_DEBUG] Filtered Pokemon count: ${filteredPokemon.length}`);
    
    // ULTRA-CRITICAL: Log Deoxys output names
    const deoxysOutput = filteredPokemon.filter(p => p.name.toLowerCase().includes('deoxys'));
    console.log(`🔍🔍🔍 [DEOXYS_OUTPUT_ULTRA_DEBUG] Deoxys in output: ${deoxysOutput.length}`);
    deoxysOutput.forEach(p => {
      console.log(`🔍🔍🔍 [DEOXYS_OUTPUT_ULTRA_DEBUG] Output Deoxys: "${p.name}" (ID: ${p.id})`);
    });
    
    const normalStats = getNormalPokemonStats();
    
    const categoryCounts: Record<string, number> = {};
    filteredPokemon.forEach(pokemon => {
      const category = getPokemonFormCategory(pokemon) || 'unknown';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    const outputIds = filteredPokemon.map(p => p.id);
    const isSorted = outputIds.every((id, i) => i === 0 || id >= outputIds[i - 1]);
    
    console.log(`🔍🔍🔍 [FILTERING_PIPELINE_ULTRA_DEBUG] ===== PIPELINE ANALYSIS COMPLETE =====`);
    
    return filteredPokemon;
  };

  return {
    shouldIncludePokemon,
    analyzeFilteringPipeline
  };
};
