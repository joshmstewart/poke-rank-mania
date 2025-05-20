
import { useState, useCallback } from "react";
import { Pokemon, fetchAllPokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";
import { useFormFilters } from "@/hooks/useFormFilters";

export const usePokemonLoader = () => {
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get form filters
  const { shouldIncludePokemon } = useFormFilters();

  const loadPokemon = useCallback(async (genId = 0, fullRankingMode = true) => {
    setIsLoading(true);
    try {
      const pokemon = await fetchAllPokemon(genId);
      
      // Apply form filters
      const filteredPokemon = pokemon.filter(shouldIncludePokemon);
      
      console.log(`Loaded ${pokemon.length} Pokemon, filtered to ${filteredPokemon.length} based on form settings`);
      setAllPokemon(filteredPokemon);
      setIsLoading(false);
      return filteredPokemon;
    } catch (error) {
      console.error("Error loading Pokemon:", error);
      toast({
        title: "Error loading Pokémon",
        description: "Could not load Pokémon data. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
      return [];
    }
  }, [shouldIncludePokemon]);

  return {
    allPokemon,
    isLoading,
    loadPokemon
  };
};
