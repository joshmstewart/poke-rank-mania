
import { useState, useCallback, useRef, useEffect } from "react";
import { Pokemon, fetchAllPokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";
import { useFormFilters } from "@/hooks/useFormFilters";

export const usePokemonLoader = () => {
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  const backgroundLoadingRef = useRef(false);
  const pokemonLockedRef = useRef(false);
  
  // Get form filters
  const { shouldIncludePokemon, storePokemon } = useFormFilters();

  const loadInitialBatch = useCallback(async (genId = 0, fullRankingMode = true) => {
    // CRITICAL FIX: If Pokemon are already locked, don't reload
    if (pokemonLockedRef.current) {
      console.log(`🔒 [REFRESH_FIX] Pokemon already locked at ${allPokemon.length} - ignoring reload request`);
      setIsLoading(false);
      return allPokemon;
    }

    setIsLoading(true);
    try {
      console.log(`Loading initial batch for generation ${genId}, fullRankingMode: ${fullRankingMode}`);
      
      // CRITICAL FIX: Load ALL Pokemon initially to ensure proper cross-generation distribution
      const allPokemonData = await fetchAllPokemon(genId, fullRankingMode, false);
      console.log(`Loaded complete dataset of ${allPokemonData.length} Pokémon from API`);
      
      // Filter Pokemon according to user preferences
      const filteredPokemon = allPokemonData.filter(p => {
        const include = shouldIncludePokemon(p);
        if (!include) {
          storePokemon(p);
        }
        return include;
      });
      
      console.log(`After filtering: ${filteredPokemon.length} Pokémon remaining`);
      
      // CRITICAL FIX: Shuffle the filtered Pokemon to ensure random distribution across generations
      const shuffledPokemon = [...filteredPokemon].sort(() => Math.random() - 0.5);
      console.log(`🎲 [GENERATION_FIX] Shuffled ${shuffledPokemon.length} Pokemon for random distribution`);
      
      // Log generation distribution for debugging
      const generationCounts = new Map<number, number>();
      shuffledPokemon.forEach(p => {
        let gen = 1;
        if (p.id <= 151) gen = 1;
        else if (p.id <= 251) gen = 2;
        else if (p.id <= 386) gen = 3;
        else if (p.id <= 493) gen = 4;
        else if (p.id <= 649) gen = 5;
        else if (p.id <= 721) gen = 6;
        else if (p.id <= 809) gen = 7;
        else if (p.id <= 905) gen = 8;
        else gen = 9;
        
        generationCounts.set(gen, (generationCounts.get(gen) || 0) + 1);
      });
      
      console.log(`🎯 [GENERATION_FIX] Pokemon distribution by generation:`, 
        Array.from(generationCounts.entries()).map(([gen, count]) => `Gen ${gen}: ${count}`).join(', ')
      );
      
      setAllPokemon(shuffledPokemon);
      setIsLoading(false);
      
      // CRITICAL FIX: Lock Pokemon after loading to prevent refresh cascades
      if (shuffledPokemon.length >= 100) {
        console.log(`🔒 [REFRESH_FIX] Locking Pokemon at ${shuffledPokemon.length} to prevent refresh cascades`);
        pokemonLockedRef.current = true;
      }
      
      return shuffledPokemon;
    } catch (error) {
      console.error("Error loading initial Pokemon batch:", error);
      toast({
        title: "Error loading Pokémon",
        description: "Could not load initial Pokémon data. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
      return [];
    }
  }, [shouldIncludePokemon, storePokemon, allPokemon.length]);

  const loadPokemon = useCallback(async (genId = 0, fullRankingMode = true) => {
    // Reset background loading state for new loads
    backgroundLoadingRef.current = false;
    // CRITICAL FIX: Don't reset lock for generation changes - only for true reloads
    if (genId !== 0) {
      pokemonLockedRef.current = false;
    }
    return loadInitialBatch(genId, fullRankingMode);
  }, [loadInitialBatch]);

  return {
    allPokemon,
    isLoading,
    isBackgroundLoading,
    loadPokemon
  };
};
