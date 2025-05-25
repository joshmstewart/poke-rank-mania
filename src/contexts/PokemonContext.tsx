
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
  
  // CRITICAL FIX: Log the original Pokemon data to verify types are present
  if (allPokemon.length > 0) {
    const samplePokemon = allPokemon.find(p => p.id === 60) || allPokemon[0]; // Try to find Poliwag or use first
    console.log('[DEBUG PokemonContext] Original Pokemon data sample:', JSON.stringify({
      id: samplePokemon.id,
      name: samplePokemon.name,
      types: samplePokemon.types
    }));
  }
  
  // CRITICAL FIX: Create lookup map that preserves ALL original Pokemon data
  const pokemonLookupMap = useMemo(() => {
    console.log('[DEBUG PokemonContext] Creating lookup map with', allPokemon.length, 'Pokemon');
    
    const map = new Map<number, Pokemon>();
    allPokemon.forEach((pokemon) => {
      // Store the COMPLETE original Pokemon object without any modification
      map.set(pokemon.id, pokemon);
    });
    
    console.log('[DEBUG PokemonContext] Lookup map created with', map.size, 'entries');
    
    // Verify the lookup map contains correct data
    const sampleFromMap = map.get(60); // Try to get Poliwag
    if (sampleFromMap) {
      console.log('[DEBUG PokemonContext] Sample from map - Poliwag data:', JSON.stringify({
        id: sampleFromMap.id,
        name: sampleFromMap.name,
        types: sampleFromMap.types
      }));
    }
    
    return map;
  }, [allPokemon]); // Only depend on the allPokemon array reference

  // CRITICAL FIX: Ultra-stable context value to prevent consumer re-renders
  const contextValue = useMemo(() => {
    const value = {
      allPokemon,
      pokemonLookupMap
    };
    console.log('[DEBUG PokemonContext] Context value memoized - allPokemon length:', allPokemon.length, 'map size:', pokemonLookupMap.size);
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
