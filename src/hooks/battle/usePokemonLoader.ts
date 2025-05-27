
import { useState, useCallback, useRef, useEffect } from "react";
import { Pokemon, fetchAllPokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";
import { useFormFilters } from "@/hooks/useFormFilters";

export const usePokemonLoader = () => {
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  const backgroundLoadingRef = useRef(false);
  
  // Get form filters
  const { shouldIncludePokemon, storePokemon } = useFormFilters();

  const loadInitialBatch = useCallback(async (genId = 0, fullRankingMode = true) => {
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
      
      // Start background loading of remaining Pokemon
      if (!backgroundLoadingRef.current) {
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
  }, [shouldIncludePokemon, storePokemon]);

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
      
      // Merge with existing Pokemon
      setAllPokemon(prev => [...prev, ...remainingPokemon]);
      setIsBackgroundLoading(false);
      
      toast({
        title: "Loading complete",
        description: `Loaded ${initialBatch.length + remainingPokemon.length} total Pokémon for battles.`,
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
    return loadInitialBatch(genId, fullRankingMode);
  }, [loadInitialBatch]);

  return {
    allPokemon,
    isLoading,
    isBackgroundLoading,
    loadPokemon
  };
};
