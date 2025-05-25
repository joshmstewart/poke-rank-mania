
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
  
  // CRITICAL FIX: Preserve complete Pokemon data including full types
  const pokemonLookupMap = useMemo(() => {
    console.log('[DEBUG PokemonContext] Creating lookup map with', allPokemon.length, 'Pokemon');
    
    const map = new Map<number, Pokemon>();
    allPokemon.forEach((pokemon, index) => {
      // CRITICAL: Store the COMPLETE original Pokemon object without modification
      // This preserves the original types array structure exactly as fetched
      const completePokemon = pokemon; // No spread operator to avoid losing properties
      
      // Verify type data for first few Pokemon
      if (index < 3) {
        console.log(`[DEBUG PokemonContext] Pokemon ${pokemon.name} (${pokemon.id}) original types:`, JSON.stringify(pokemon.types));
        console.log(`[DEBUG PokemonContext] Pokemon ${pokemon.name} stored types:`, JSON.stringify(completePokemon.types));
      }
      
      map.set(pokemon.id, completePokemon);
    });
    
    console.log('[DEBUG PokemonContext] Lookup map created with', map.size, 'entries');
    
    // Verify a specific Pokemon from the map
    const samplePokemon = map.get(1); // Bulbasaur
    if (samplePokemon) {
      console.log('[DEBUG PokemonContext] Sample from map - Bulbasaur types:', JSON.stringify(samplePokemon.types));
    }
    
    return map;
  }, [allPokemon]); // Depend on the actual array, not just length

  // CRITICAL FIX: Ultra-stable context value with proper memoization
  const contextValue = useMemo(() => {
    const value = {
      allPokemon,
      pokemonLookupMap
    };
    console.log('[DEBUG PokemonContext] Context value created - allPokemon length:', allPokemon.length, 'map size:', pokemonLookupMap.size);
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
