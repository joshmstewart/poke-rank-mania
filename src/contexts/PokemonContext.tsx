
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
    console.log('[CRITICAL DEBUG PokemonContext] Input allPokemon - Sample Pokemon types:', JSON.stringify({
      id: samplePokemon.id,
      name: samplePokemon.name,
      types: samplePokemon.types,
      hasTypes: !!samplePokemon.types,
      typesLength: samplePokemon.types?.length || 0,
      firstType: samplePokemon.types?.[0],
      rawTypesStructure: samplePokemon.types
    }));
  }
  
  // CRITICAL FIX: Create lookup map that preserves COMPLETE original Pokemon data
  const pokemonLookupMap = useMemo(() => {
    console.log('[DEBUG PokemonContext] Creating lookup map with', allPokemon.length, 'Pokemon');
    
    const map = new Map<number, Pokemon>();
    allPokemon.forEach((pokemon) => {
      // CRITICAL: Log the exact pokemon object being stored for debugging
      if (pokemon.id === 60) { // Poliwag example
        console.log('[PokemonContext MAP POPULATION] Storing Poliwag (60):', JSON.stringify({
          id: pokemon.id,
          name: pokemon.name,
          types: pokemon.types,
          typesLength: pokemon.types?.length || 0,
          hasValidTypes: !!(pokemon.types && pokemon.types.length > 0)
        }));
      }
      
      // Store the EXACT original Pokemon object - no modifications
      map.set(pokemon.id, pokemon);
    });
    
    console.log('[DEBUG PokemonContext] Lookup map created with', map.size, 'entries');
    
    // NEW: Critical logging for context readiness tracking
    console.log(`🌟🌟🌟 [CONTEXT_READINESS_CRITICAL] PokemonContext lookup map FINALIZED with ${map.size} entries`);
    if (map.size > 0) {
      console.log(`🌟🌟🌟 [CONTEXT_READINESS_CRITICAL] ✅ CONTEXT IS NOW READY - Should trigger dependent effects`);
    }
    
    // CRITICAL: Verify the map contains correct data after creation
    const poliwagFromMap = map.get(60);
    if (poliwagFromMap) {
      console.log('[PokemonContext MAP VERIFICATION] Poliwag retrieved from CREATED map:', JSON.stringify({
        id: poliwagFromMap.id,
        name: poliwagFromMap.name,
        types: poliwagFromMap.types,
        typesLength: poliwagFromMap.types?.length || 0,
        firstType: poliwagFromMap.types?.[0]
      }));
    }
    
    return map;
  }, [allPokemon]);

  // CRITICAL FIX: Ultra-stable context value that never changes reference unnecessarily
  const contextValue = useMemo(() => {
    const value = {
      allPokemon,
      pokemonLookupMap
    };
    
    // NEW: Log whenever context value changes to track re-renders
    console.log(`🌟🌟🌟 [CONTEXT_VALUE_CRITICAL] Context value updated - map size: ${pokemonLookupMap.size}, allPokemon length: ${allPokemon.length}`);
    
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
