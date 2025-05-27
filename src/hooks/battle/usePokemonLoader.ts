
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
      console.log(`📦 [POKEMON_LOADING_FIX] Loading complete dataset for battles`);
      
      // CRITICAL FIX: Load ALL Pokemon at once instead of batching
      const allPokemonData = await fetchAllPokemon(genId, fullRankingMode, false);
      console.log(`📦 [POKEMON_LOADING_FIX] Loaded complete dataset of ${allPokemonData.length} Pokémon from API`);
      
      // Filter all Pokemon at once
      const filteredPokemon = allPokemonData.filter(p => {
        const include = shouldIncludePokemon(p);
        if (!include) {
          storePokemon(p);
        }
        return include;
      });
      
      // Shuffle the complete filtered dataset
      const shuffledPokemon = [...filteredPokemon].sort(() => Math.random() - 0.5);
      console.log(`✅ [POKEMON_LOADING_FIX] Complete dataset ready: ${shuffledPokemon.length} Pokemon shuffled and available for battles`);
      
      // Set the complete dataset immediately
      setAllPokemon(shuffledPokemon);
      setIsLoading(false);
      
      // Lock Pokemon after full loading
      if (shuffledPokemon.length >= 100) {
        console.log(`🔒 [REFRESH_FIX] Locking Pokemon at ${shuffledPokemon.length} to prevent refresh cascades`);
        pokemonLockedRef.current = true;
      }
      
      return shuffledPokemon;
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
    isBackgroundLoading: false, // No more background loading needed
    loadPokemon
  };
};
