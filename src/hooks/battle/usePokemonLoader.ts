
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
      // Log that we're loading Pokémon
      console.log(`Loading Pokémon for generation ${genId}, fullRankingMode: ${fullRankingMode}`);
      
      const pokemon = await fetchAllPokemon(genId, fullRankingMode);
      console.log(`Loaded ${pokemon.length} Pokémon from API before filtering`);
      
      // Check for special variants in the loaded data
      const specialForms = pokemon.filter(p => {
        const name = p.name.toLowerCase();
        return name.includes("form") || name.includes("mega") || name.includes("alolan") || 
               name.includes("galarian") || name.includes("gmax") || name.includes("style") || 
               name.includes("mode");
      });
      
      console.log(`Special forms found in API data: ${specialForms.length}`);
      if (specialForms.length > 0) {
        console.log("Examples:", specialForms.slice(0, 5).map(p => p.name));
      }
      
      // Apply form filters
      const filteredPokemon = pokemon.filter(shouldIncludePokemon);
      console.log(`After filtering: ${filteredPokemon.length} Pokémon remaining`);
      
      // Check for special forms after filtering
      const remainingSpecialForms = filteredPokemon.filter(p => {
        const name = p.name.toLowerCase();
        return name.includes("form") || name.includes("mega") || name.includes("alolan") || 
               name.includes("galarian") || name.includes("gmax") || name.includes("style") || 
               name.includes("mode");
      });
      
      console.log(`Special forms after filtering: ${remainingSpecialForms.length}`);
      
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
