
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { useFormFilters } from "@/hooks/form-filters/useFormFilters";

export const usePokemonFilterProcessor = () => {
  const { analyzeFilteringPipeline } = useFormFilters();

  const processFilteredPokemon = useCallback((rawPokemon: Pokemon[]) => {
    console.log(`🔒 [FILTER_PROCESSOR] Processing ${rawPokemon.length} raw Pokemon through filters`);
    
    // Apply filtering deterministically to get filtered data
    const filteredPokemon = analyzeFilteringPipeline(rawPokemon);
    
    console.log(`🔒 [FILTER_PROCESSOR] Filtered down to ${filteredPokemon.length} Pokemon`);
    
    return filteredPokemon;
  }, [analyzeFilteringPipeline]);

  return {
    processFilteredPokemon
  };
};
