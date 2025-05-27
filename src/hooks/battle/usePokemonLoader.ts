
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
      console.log(`⚡ [SPEED_FIX] Loading initial quick batch for first battle`);
      
      // SPEED FIX: Load a smaller initial batch first for immediate battle creation
      const allPokemonData = await fetchAllPokemon(genId, fullRankingMode, false);
      console.log(`📦 [SPEED_FIX] Loaded complete dataset of ${allPokemonData.length} Pokémon from API`);
      
      // SPEED FIX: Take first 200 Pokemon for immediate use, then shuffle the rest in background
      const quickBatch = allPokemonData.slice(0, 200);
      const remainingPokemon = allPokemonData.slice(200);
      
      // Filter the quick batch
      const filteredQuickBatch = quickBatch.filter(p => {
        const include = shouldIncludePokemon(p);
        if (!include) {
          storePokemon(p);
        }
        return include;
      });
      
      // SPEED FIX: Shuffle only the quick batch initially
      const shuffledQuickBatch = [...filteredQuickBatch].sort(() => Math.random() - 0.5);
      console.log(`⚡ [SPEED_FIX] Quick batch ready: ${shuffledQuickBatch.length} Pokemon shuffled`);
      
      // Set the quick batch immediately so battles can start
      setAllPokemon(shuffledQuickBatch);
      setIsLoading(false);
      
      // SPEED FIX: Process the remaining Pokemon in the background
      if (remainingPokemon.length > 0) {
        console.log(`🔄 [SPEED_FIX] Processing remaining ${remainingPokemon.length} Pokemon in background`);
        setIsBackgroundLoading(true);
        
        setTimeout(async () => {
          try {
            // Filter remaining Pokemon
            const filteredRemaining = remainingPokemon.filter(p => {
              const include = shouldIncludePokemon(p);
              if (!include) {
                storePokemon(p);
              }
              return include;
            });
            
            // Shuffle remaining and combine with quick batch
            const shuffledRemaining = [...filteredRemaining].sort(() => Math.random() - 0.5);
            const fullShuffledList = [...shuffledQuickBatch, ...shuffledRemaining].sort(() => Math.random() - 0.5);
            
            console.log(`✅ [SPEED_FIX] Background loading complete: ${fullShuffledList.length} total Pokemon`);
            
            // Update with full list
            setAllPokemon(fullShuffledList);
            setIsBackgroundLoading(false);
            
            // Lock Pokemon after full loading
            if (fullShuffledList.length >= 100) {
              console.log(`🔒 [REFRESH_FIX] Locking Pokemon at ${fullShuffledList.length} to prevent refresh cascades`);
              pokemonLockedRef.current = true;
            }
          } catch (error) {
            console.error("❌ Background loading failed:", error);
            setIsBackgroundLoading(false);
          }
        }, 100); // Very short delay to let UI update
      } else {
        // If no remaining Pokemon, lock immediately
        if (shuffledQuickBatch.length >= 100) {
          console.log(`🔒 [REFRESH_FIX] Locking Pokemon at ${shuffledQuickBatch.length} to prevent refresh cascades`);
          pokemonLockedRef.current = true;
        }
      }
      
      return shuffledQuickBatch;
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
