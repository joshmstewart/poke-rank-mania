
import { useState, useCallback } from "react";
import { Pokemon, fetchAllPokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";
import { useFormFilters } from "@/hooks/useFormFilters";

export const usePokemonLoader = () => {
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  // Get form filters
  const { shouldIncludePokemon, storePokemon } = useFormFilters();

  const loadPokemon = useCallback(async (genId = 0, fullRankingMode = true, preserveState = false) => {
    setIsLoading(true);
    setLoadingError(null);
    
    try {
      // Log that we're loading Pokémon
      console.log(`Loading Pokémon for generation ${genId}, fullRankingMode: ${fullRankingMode}`);
      
      // Add a timeout to prevent infinite loading
      const timeoutPromise = new Promise<Pokemon[]>((_, reject) => {
        setTimeout(() => reject(new Error("Loading Pokémon timed out")), 15000);
      });
      
      // Race between the actual fetch and the timeout
      const pokemon = await Promise.race([
        fetchAllPokemon(genId, fullRankingMode),
        timeoutPromise
      ]);
      
      console.log(`Loaded ${pokemon.length} Pokémon from API before filtering`);
      
      if (!Array.isArray(pokemon) || pokemon.length === 0) {
        throw new Error("No Pokémon data received from API");
      }
      
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
      
      if (filteredPokemon.length === 0) {
        throw new Error("All Pokémon were filtered out by current filters");
      }
      
      setAllPokemon(filteredPokemon);
      setIsLoading(false);
      return filteredPokemon;
    } catch (error) {
      console.error("Error loading Pokemon:", error);
      const errorMessage = error instanceof Error ? error.message : "Could not load Pokémon data";
      
      setLoadingError(errorMessage);
      toast({
        title: "Error loading Pokémon",
        description: errorMessage,
        variant: "destructive"
      });
      
      setIsLoading(false);
      
      // Return empty array but don't crash the app
      return [];
    }
  }, [shouldIncludePokemon, storePokemon]);

  return {
    allPokemon,
    isLoading,
    loadingError,
    loadPokemon
  };
};
