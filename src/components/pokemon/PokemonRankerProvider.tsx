
import React, { useEffect, useState } from "react";
import { PokemonProvider } from "@/contexts/PokemonContext";
import { Pokemon } from "@/services/pokemon";
import { usePokemonLoader } from "@/hooks/battle/usePokemonLoader";

interface PokemonRankerProviderProps {
  children: React.ReactNode;
}

const PokemonRankerProvider: React.FC<PokemonRankerProviderProps> = ({ children }) => {
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [rawUnfilteredPokemon, setRawUnfilteredPokemon] = useState<Pokemon[]>([]);
  
  // CRITICAL FIX: Get both filtered and raw data from the loader
  const { 
    allPokemon: filteredPokemon, 
    rawUnfilteredPokemon: rawPokemon, 
    isLoading, 
    loadPokemon 
  } = usePokemonLoader();

  // CRITICAL FIX: Update local state when loader provides data
  useEffect(() => {
    if (filteredPokemon.length > 0) {
      console.log(`🔒 [MANUAL_MODE_PROVIDER] Received ${filteredPokemon.length} filtered Pokemon from loader`);
      setAllPokemon(filteredPokemon);
    }
  }, [filteredPokemon]);

  useEffect(() => {
    if (rawPokemon.length > 0) {
      console.log(`🔒 [MANUAL_MODE_PROVIDER] Received ${rawPokemon.length} RAW unfiltered Pokemon from loader`);
      setRawUnfilteredPokemon(rawPokemon);
    }
  }, [rawPokemon]);

  // EMERGENCY FALLBACK: Only load if we have no data AND loader isn't loading
  useEffect(() => {
    if (!isLoading && filteredPokemon.length === 0 && allPokemon.length === 0) {
      console.log(`🔒 [MANUAL_MODE_PROVIDER] Emergency fallback load - no Pokemon available`);
      loadPokemon(0, true).catch(error => {
        console.error(`🔒 [MANUAL_MODE_PROVIDER] Emergency load failed:`, error);
      });
    }
  }, [isLoading, filteredPokemon.length, allPokemon.length, loadPokemon]);

  // TRUST SPLASH SCREEN: Don't show loading if we have Pokemon data from any source
  if (allPokemon.length === 0 && rawUnfilteredPokemon.length === 0 && (isLoading || filteredPokemon.length === 0)) {
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
