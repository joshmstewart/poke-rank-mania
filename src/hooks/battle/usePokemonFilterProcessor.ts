
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { useFormFilters } from "@/hooks/form-filters/useFormFilters";

export const usePokemonFilterProcessor = () => {
  const { analyzeFilteringPipeline } = useFormFilters();

  const processFilteredPokemon = useCallback((rawPokemon: Pokemon[]) => {
    const filteredPokemon = analyzeFilteringPipeline(rawPokemon);
    
    return filteredPokemon;
  }, [analyzeFilteringPipeline]);

  return {
    processFilteredPokemon
  };
};
