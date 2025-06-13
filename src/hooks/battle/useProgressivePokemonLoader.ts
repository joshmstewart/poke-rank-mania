
import { useState, useCallback, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { useGlobalPokemonCache } from "./useGlobalPokemonCache";

// Essential Pokemon IDs that users are most likely to encounter first
const ESSENTIAL_POKEMON_IDS = [
  // Starters from all generations
  1, 4, 7, 152, 155, 158, 252, 255, 258, 387, 390, 393, 495, 498, 501, 650, 653, 656, 722, 725, 728, 810, 813, 816, 906, 909, 912,
  // Iconic Pokemon
  25, 39, 54, 104, 129, 130, 131, 132, 133, 134, 135, 136, 144, 145, 146, 150, 151,
  // Popular favorites
  6, 9, 94, 149, 196, 197, 245, 249, 250, 282, 376, 448, 445, 484, 487, 493
];

const BATCH_SIZE = 50;
const ESSENTIAL_BATCH_SIZE = 100;

export const useProgressivePokemonLoader = () => {
  const [essentialPokemon, setEssentialPokemon] = useState<Pokemon[]>([]);
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [isLoadingEssential, setIsLoadingEssential] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [backgroundProgress, setBackgroundProgress] = useState(0);
  
  const backgroundLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController>();

  const {
    hasGlobalCache,
    getGlobalCache,
    setGlobalCache,
    useExistingCache
  } = useGlobalPokemonCache();

  const loadEssentialPokemon = useCallback(async (): Promise<Pokemon[]> => {
    console.log('🚀 [PROGRESSIVE_LOADER] Loading essential Pokemon for instant UI');
    
    // Check cache first
    if (hasGlobalCache()) {
      const cache = getGlobalCache();
      const essential = cache.filtered.filter(p => ESSENTIAL_POKEMON_IDS.includes(p.id));
      if (essential.length > 50) {
        console.log(`✅ [PROGRESSIVE_LOADER] Using cached essential Pokemon: ${essential.length}`);
        setEssentialPokemon(essential);
        return essential;
      }
    }

    setIsLoadingEssential(true);
    
    try {
      // Load only essential Pokemon first - much faster API call
      const essentialPromises = ESSENTIAL_POKEMON_IDS.slice(0, ESSENTIAL_BATCH_SIZE).map(async (id) => {
        try {
          const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
          if (!response.ok) return null;
          
          const data = await response.json();
          return {
            id: data.id,
            name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
            image: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
            types: data.types.map((type: any) => 
              type.type.name.charAt(0).toUpperCase() + type.type.name.slice(1)
            )
          };
        } catch (error) {
          console.warn(`Failed to load Pokemon ${id}:`, error);
          return null;
        }
      });

      const results = await Promise.all(essentialPromises);
      const validPokemon = results.filter(p => p !== null) as Pokemon[];
      
      console.log(`✅ [PROGRESSIVE_LOADER] Essential Pokemon loaded: ${validPokemon.length}`);
      setEssentialPokemon(validPokemon);
      setIsLoadingEssential(false);
      
      return validPokemon;
    } catch (error) {
      console.error('❌ [PROGRESSIVE_LOADER] Failed to load essential Pokemon:', error);
      setIsLoadingEssential(false);
      return [];
    }
  }, [hasGlobalCache, getGlobalCache]);

  const startBackgroundLoading = useCallback(async () => {
    if (backgroundLoadingRef.current) {
      console.log('🔄 [PROGRESSIVE_LOADER] Background loading already in progress');
      return;
    }

    console.log('🌱 [PROGRESSIVE_LOADER] Starting background loading of remaining Pokemon');
    backgroundLoadingRef.current = true;
    setIsLoadingAll(true);
    
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();
    
    try {
      // Use a smaller batch approach to reduce memory pressure
      const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1000&offset=0', {
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) throw new Error('Failed to fetch Pokemon list');
      
      const data = await response.json();
      const allPokemonUrls = data.results;
      
      const loadedPokemon: Pokemon[] = [...essentialPokemon];
      const essentialIds = new Set(ESSENTIAL_POKEMON_IDS);
      
      // Process in smaller batches to avoid blocking UI
      for (let i = 0; i < allPokemonUrls.length; i += BATCH_SIZE) {
        if (abortControllerRef.current?.signal.aborted) {
          console.log('🛑 [PROGRESSIVE_LOADER] Background loading cancelled');
          break;
        }
        
        const batch = allPokemonUrls.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(async (pokemon: any) => {
          try {
            const id = parseInt(pokemon.url.split('/').filter(Boolean).pop());
            
            // Skip if already loaded as essential
            if (essentialIds.has(id)) return null;
            
            const response = await fetch(pokemon.url, {
              signal: abortControllerRef.current?.signal
            });
            
            if (!response.ok) return null;
            
            const pokemonData = await response.json();
            return {
              id: pokemonData.id,
              name: pokemonData.name.charAt(0).toUpperCase() + pokemonData.name.slice(1),
              image: pokemonData.sprites.other['official-artwork'].front_default || pokemonData.sprites.front_default,
              types: pokemonData.types.map((type: any) => 
                type.type.name.charAt(0).toUpperCase() + type.type.name.slice(1)
              )
            };
          } catch (error) {
            if (error.name !== 'AbortError') {
              console.warn(`Failed to load Pokemon from batch:`, error);
            }
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        const validBatchPokemon = batchResults.filter(p => p !== null) as Pokemon[];
        
        loadedPokemon.push(...validBatchPokemon);
        
        // Update progress and state periodically
        const progress = Math.min(100, (i / allPokemonUrls.length) * 100);
        setBackgroundProgress(progress);
        
        if (i % (BATCH_SIZE * 4) === 0) { // Update every 4 batches
          setAllPokemon([...loadedPokemon]);
          console.log(`🌱 [PROGRESSIVE_LOADER] Background progress: ${progress.toFixed(1)}% (${loadedPokemon.length} Pokemon)`);
        }
        
        // Small delay to prevent blocking UI
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // Final update
      const sortedPokemon = loadedPokemon.sort((a, b) => a.id - b.id);
      setAllPokemon(sortedPokemon);
      setGlobalCache(sortedPokemon, sortedPokemon);
      
      console.log(`✅ [PROGRESSIVE_LOADER] Background loading complete: ${sortedPokemon.length} total Pokemon`);
      setBackgroundProgress(100);
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('❌ [PROGRESSIVE_LOADER] Background loading failed:', error);
      }
    } finally {
      setIsLoadingAll(false);
      backgroundLoadingRef.current = false;
    }
  }, [essentialPokemon, setGlobalCache]);

  const cancelBackgroundLoading = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log('🛑 [PROGRESSIVE_LOADER] Background loading cancelled by user');
    }
    backgroundLoadingRef.current = false;
    setIsLoadingAll(false);
  }, []);

  return {
    essentialPokemon,
    allPokemon: allPokemon.length > 0 ? allPokemon : essentialPokemon,
    isLoadingEssential,
    isLoadingAll,
    backgroundProgress,
    loadEssentialPokemon,
    startBackgroundLoading,
    cancelBackgroundLoading,
    hasBackgroundData: allPokemon.length > essentialPokemon.length
  };
};
