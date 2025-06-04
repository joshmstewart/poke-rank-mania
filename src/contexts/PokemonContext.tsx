
import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { Pokemon } from '@/services/pokemon';

interface PokemonContextType {
  allPokemon: Pokemon[];
  rawUnfilteredPokemon: Pokemon[];
  pokemonLookupMap: Map<number, Pokemon>;
}

const PokemonContext = createContext<PokemonContextType | undefined>(undefined);

interface PokemonProviderProps {
  children: ReactNode;
  allPokemon: Pokemon[];
  rawUnfilteredPokemon?: Pokemon[];
}

export const PokemonProvider: React.FC<PokemonProviderProps> = ({ 
  children, 
  allPokemon, 
  rawUnfilteredPokemon 
}) => {
  console.log('[DEBUG PokemonContext] Provider rendering with', allPokemon?.length || 0, 'filtered Pokemon');
  console.log('[DEBUG PokemonContext] Raw unfiltered Pokemon count:', rawUnfilteredPokemon?.length || 0);
  
  // CRITICAL FIX: Ensure allPokemon is always a valid array
  const safeAllPokemon = useMemo(() => {
    if (!allPokemon) {
      console.warn('[PokemonContext] allPokemon is null/undefined, using empty array');
      return [];
    }
    if (!Array.isArray(allPokemon)) {
      console.warn('[PokemonContext] allPokemon is not an array, using empty array');
      return [];
    }
    return allPokemon.filter(p => p && typeof p.id === 'number' && p.name);
  }, [allPokemon]);
  
  // Use the explicitly passed raw data, or fall back to allPokemon if not provided
  const actualRawUnfilteredPokemon = useMemo(() => {
    let rawData = rawUnfilteredPokemon || safeAllPokemon;
    
    // CRITICAL: Ensure raw data is also a valid array
    if (!rawData) {
      console.warn('[PokemonContext] rawData is null/undefined, using empty array');
      rawData = [];
    }
    if (!Array.isArray(rawData)) {
      console.warn('[PokemonContext] rawData is not an array, using safeAllPokemon');
      rawData = safeAllPokemon;
    }
    
    console.log(`📝 [RAW_POKEMON_STORAGE] Storing ${rawData.length} ACTUAL raw unfiltered Pokemon for form counting`);
    console.log(`📝 [RAW_POKEMON_STORAGE] Is this truly raw data? ${rawUnfilteredPokemon ? 'YES' : 'NO (fallback to filtered)'}`);
    return rawData;
  }, [rawUnfilteredPokemon, safeAllPokemon]);
  
  // CRITICAL: Create lookup map that preserves COMPLETE original Pokemon data
  const pokemonLookupMap = useMemo(() => {
    console.log('[DEBUG PokemonContext] Creating lookup map with', safeAllPokemon.length, 'Pokemon');
    console.log(`🌟🌟🌟 [CONTEXT_CREATION_CRITICAL] Creating NEW Map instance for ${safeAllPokemon.length} Pokemon`);
    
    // CRITICAL: Always create a NEW Map instance, even if safeAllPokemon is empty
    const map = new Map<number, Pokemon>();
    
    // CRITICAL: Only process if we have valid Pokemon array
    if (safeAllPokemon && Array.isArray(safeAllPokemon)) {
      safeAllPokemon.forEach((pokemon) => {
        if (pokemon && typeof pokemon.id === 'number' && pokemon.name) {
          map.set(pokemon.id, pokemon);
        } else {
          console.error('[PokemonContext] Invalid Pokemon skipped:', pokemon);
        }
      });
    }
    
    console.log('[DEBUG PokemonContext] Lookup map created with', map.size, 'entries');
    console.log(`🌟🌟🌟 [CONTEXT_READINESS_CRITICAL] PokemonContext lookup map FINALIZED with ${map.size} entries`);
    
    return map;
  }, [safeAllPokemon]);

  // CRITICAL FIX: Create completely new context value object when dependencies change
  const contextValue = useMemo(() => {
    const value = {
      allPokemon: safeAllPokemon,
      rawUnfilteredPokemon: actualRawUnfilteredPokemon,
      pokemonLookupMap
    };
    
    console.log(`🌟🌟🌟 [CONTEXT_VALUE_CRITICAL] NEW context value created - timestamp: ${Date.now()}`);
    console.log(`🌟🌟🌟 [CONTEXT_VALUE_CRITICAL] allPokemon length: ${safeAllPokemon.length}, map size: ${pokemonLookupMap.size}`);
    console.log(`🌟🌟🌟 [CONTEXT_VALUE_CRITICAL] rawUnfilteredPokemon length: ${actualRawUnfilteredPokemon.length}`);
    
    return value;
  }, [safeAllPokemon, actualRawUnfilteredPokemon, pokemonLookupMap]);

  return (
    <PokemonContext.Provider value={contextValue}>
      {children}
    </PokemonContext.Provider>
  );
};

export const usePokemonContext = () => {
  const context = useContext(PokemonContext);
  if (!context) {
    throw new Error('usePokemonContext must be used within a PokemonProvider');
  }
  return context;
};
