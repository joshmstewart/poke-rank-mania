
import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { Pokemon } from '@/services/pokemon';

interface PokemonContextType {
  allPokemon: Pokemon[];
  pokemonLookupMap: Map<number, Pokemon>;
}

const PokemonContext = createContext<PokemonContextType | undefined>(undefined);

interface PokemonProviderProps {
  children: ReactNode;
  allPokemon: Pokemon[];
}

export const PokemonProvider: React.FC<PokemonProviderProps> = ({ children, allPokemon }) => {
  console.log('[DEBUG PokemonContext] Provider rendering with', allPokemon.length, 'Pokemon');
  
  // CRITICAL: Verify the source data has types before creating the map
  if (allPokemon.length > 0) {
    const samplePokemon = allPokemon.find(p => p.id === 60) || allPokemon[0]; // Poliwag or first
    console.log('[CRITICAL DEBUG] Source allPokemon - Sample Pokemon types:', JSON.stringify({
      id: samplePokemon.id,
      name: samplePokemon.name,
      types: samplePokemon.types,
      hasTypes: !!samplePokemon.types,
      typesLength: samplePokemon.types?.length || 0,
      firstType: samplePokemon.types?.[0]
    }));
    
    // If types are missing, reconstruct them from the pokemon data
    if (!samplePokemon.types || samplePokemon.types.length === 0) {
      console.error('[CRITICAL ERROR] Source Pokemon data is missing types! This must be fixed at the data source level.');
    }
  }
  
  // CRITICAL FIX: Create lookup map that preserves COMPLETE original Pokemon data with type validation
  const pokemonLookupMap = useMemo(() => {
    console.log('[DEBUG PokemonContext] Creating lookup map with', allPokemon.length, 'Pokemon');
    
    const map = new Map<number, Pokemon>();
    allPokemon.forEach((pokemon) => {
      // CRITICAL: Ensure Pokemon has valid types data before storing
      const validatedPokemon = {
        ...pokemon,
        types: pokemon.types || []
      };
      
      // Store the EXACT original Pokemon object without ANY modification
      map.set(pokemon.id, validatedPokemon);
      
      // Verify critical Pokemon have types
      if (pokemon.id === 60) { // Poliwag
        console.log('[CRITICAL VERIFICATION] Poliwag added to map:', JSON.stringify({
          id: pokemon.id,
          name: pokemon.name,
          types: validatedPokemon.types,
          typesIsArray: Array.isArray(validatedPokemon.types),
          typesLength: validatedPokemon.types?.length || 0,
          firstType: validatedPokemon.types?.[0]
        }));
      }
    });
    
    console.log('[DEBUG PokemonContext] Lookup map created with', map.size, 'entries');
    
    // CRITICAL: Verify the map contains correct data after creation
    const poliwagFromMap = map.get(60);
    if (poliwagFromMap) {
      console.log('[CRITICAL VERIFICATION] Poliwag retrieved from CREATED map:', JSON.stringify({
        id: poliwagFromMap.id,
        name: poliwagFromMap.name,
        types: poliwagFromMap.types,
        typesLength: poliwagFromMap.types?.length || 0,
        firstType: poliwagFromMap.types?.[0]
      }));
    }
    
    return map;
  }, [allPokemon]); // Only depend on allPokemon array reference

  // CRITICAL FIX: Ultra-stable context value that never changes reference unnecessarily
  const contextValue = useMemo(() => {
    const value = {
      allPokemon,
      pokemonLookupMap
    };
    
    // Log when context value is recreated to track unnecessary re-renders
    console.log('[CRITICAL DEBUG] PokemonContext value memoized:', {
      allPokemonLength: allPokemon.length,
      mapSize: pokemonLookupMap.size,
      timestamp: Date.now()
    });
    
    return value;
  }, [allPokemon, pokemonLookupMap]);

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
