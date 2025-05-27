
import { useState, useCallback, useRef, useEffect } from "react";
import { Pokemon, fetchAllPokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";
import { useFormFilters } from "@/hooks/useFormFilters";

export const usePokemonLoader = () => {
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  const backgroundLoadingRef = useRef(false);
  const pokemonLockedRef = useRef(false); // CRITICAL FIX: Lock Pokemon once sufficient data is loaded
  
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
      
      // Load initial small batch (150 Pokemon) for quick battle start
      const initialBatch = await fetchAllPokemon(genId, fullRankingMode, true, 150);
      console.log(`Loaded initial batch of ${initialBatch.length} Pokémon from API`);
      
      // Filter Pokemon according to user preferences
      const filteredBatch = initialBatch.filter(p => {
        const include = shouldIncludePokemon(p);
        if (!include) {
          storePokemon(p);
        }
        return include;
      });
      
      console.log(`After filtering initial batch: ${filteredBatch.length} Pokémon remaining`);
      
      setAllPokemon(filteredBatch);
      setIsLoading(false);
      
      // CRITICAL FIX: Lock Pokemon after initial batch to prevent refresh cascades
      if (filteredBatch.length >= 100) {
        console.log(`🔒 [REFRESH_FIX] Locking Pokemon at ${filteredBatch.length} to prevent refresh cascades`);
        pokemonLockedRef.current = true;
      }
      
      // Start background loading of remaining Pokemon
      if (!backgroundLoadingRef.current && !pokemonLockedRef.current) {
        backgroundLoadingRef.current = true;
        setIsBackgroundLoading(true);
        loadRemainingPokemon(genId, fullRankingMode, filteredBatch);
      }
      
      return filteredBatch;
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

  const loadRemainingPokemon = useCallback(async (genId: number, fullRankingMode: boolean, initialBatch: Pokemon[]) => {
    try {
      console.log("Starting background load of remaining Pokémon...");
      
      // Load all Pokemon
      const allPokemonData = await fetchAllPokemon(genId, fullRankingMode, false);
      console.log(`Background loaded ${allPokemonData.length} total Pokémon`);
      
      // Filter and get only the new ones not in initial batch
      const initialIds = new Set(initialBatch.map(p => p.id));
      const remainingPokemon = allPokemonData.filter(p => {
        if (initialIds.has(p.id)) return false; // Skip already loaded
        
        const include = shouldIncludePokemon(p);
        if (!include) {
          storePokemon(p);
        }
        return include;
      });
      
      console.log(`Background loading complete: ${remainingPokemon.length} additional Pokémon`);
      
      // CRITICAL FIX: DON'T update allPokemon if locked to prevent refresh cascades
      if (!pokemonLockedRef.current) {
        setAllPokemon(prev => [...prev, ...remainingPokemon]);
        
        // Lock Pokemon after background load completes
        if ((initialBatch.length + remainingPokemon.length) >= 200) {
          console.log(`🔒 [REFRESH_FIX] Locking Pokemon after background load at ${initialBatch.length + remainingPokemon.length}`);
          pokemonLockedRef.current = true;
        }
      } else {
        console.log(`🔒 [REFRESH_FIX] Skipping Pokemon update - already locked to prevent refresh`);
      }
      
      setIsBackgroundLoading(false);
      
      // Show completion toast but don't trigger any battle events
      toast({
        title: "Loading complete",
        description: `${initialBatch.length + remainingPokemon.length} total Pokémon loaded. Current battle will continue.`,
        duration: 3000
      });
      
    } catch (error) {
      console.error("Error loading remaining Pokemon:", error);
      setIsBackgroundLoading(false);
      toast({
        title: "Background loading failed", 
        description: "Some Pokémon couldn't be loaded in the background.",
        variant: "destructive"
      });
    }
  }, [shouldIncludePokemon, storePokemon]);

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
