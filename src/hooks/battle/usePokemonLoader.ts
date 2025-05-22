
import { useState, useCallback } from "react";
import { Pokemon, fetchAllPokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";
import { useFormFilters } from "@/hooks/useFormFilters";

export const usePokemonLoader = () => {
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get form filters
  const { shouldIncludePokemon, storePokemon } = useFormFilters();

  const loadPokemon = useCallback(async (genId = 0, fullRankingMode = true) => {
    setIsLoading(true);
    try {
      // Log that we're loading Pokémon
      console.log(`Loading Pokémon for generation ${genId}, fullRankingMode: ${fullRankingMode}`);
      
      const pokemon = await fetchAllPokemon(genId, fullRankingMode);
      console.log(`Loaded ${pokemon.length} Pokémon from API before filtering`);
      
      // Filter Pokemon according to user preferences
      // And store filtered Pokemon for potential later use
      const filteredPokemon = pokemon.filter(p => {
        const include = shouldIncludePokemon(p);
        if (!include) {
          // Store filtered Pokemon in case filter is re-enabled later
          storePokemon(p);
        }
        return include;
      });
      
      console.log(`After filtering: ${filteredPokemon.length} Pokémon remaining`);
      
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
  }, [shouldIncludePokemon, storePokemon]);

  return {
    allPokemon,
    isLoading,
    loadPokemon
  };
};
