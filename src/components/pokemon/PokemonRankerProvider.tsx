
import React, { useEffect, useState } from "react";
import { PokemonProvider } from "@/contexts/PokemonContext";
import { Pokemon } from "@/services/pokemon";
import { useGlobalPokemonCache } from "@/hooks/battle/useGlobalPokemonCache";

interface PokemonRankerProviderProps {
  children: React.ReactNode;
}

const PokemonRankerProvider: React.FC<PokemonRankerProviderProps> = ({ children }) => {
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [rawUnfilteredPokemon, setRawUnfilteredPokemon] = useState<Pokemon[]>([]);
  
  // IMMEDIATE CACHE ACCESS: Get cache directly without depending on loader
  const { 
    isGlobalCacheReady,
    getGlobalCache,
    useExistingCache
  } = useGlobalPokemonCache();

  // IMMEDIATE CACHE EFFECT: Use cache immediately if available
  useEffect(() => {
    if (isGlobalCacheReady()) {
      console.log(`🔒 [MANUAL_MODE_PROVIDER] Global cache is ready, using immediately`);
      const cache = getGlobalCache();
      setAllPokemon(cache.filtered);
      setRawUnfilteredPokemon(cache.raw);
    }
  }, []); // Run once on mount

  // SIMPLIFIED LOADING CONDITION: Only show loading if NO data is available anywhere
  const hasAnyData = allPokemon.length > 0 || rawUnfilteredPokemon.length > 0 || isGlobalCacheReady();
  
  if (!hasAnyData) {
    console.log(`🔒 [MANUAL_MODE_PROVIDER] No data available, showing loading`);
    return (
      <div className="flex justify-center items-center h-64 w-full">
        <div className="flex flex-col items-center max-w-md mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p>Loading Pokémon data for Manual Mode...</p>
        </div>
      </div>
    );
  }

  console.log(`🔒 [MANUAL_MODE_PROVIDER] Providing ${allPokemon.length} filtered + ${rawUnfilteredPokemon.length} raw Pokemon to Manual Mode context`);
  
  return (
    <PokemonProvider 
      allPokemon={allPokemon} 
      rawUnfilteredPokemon={rawUnfilteredPokemon}
    >
      {children}
    </PokemonProvider>
  );
};

export default PokemonRankerProvider;
