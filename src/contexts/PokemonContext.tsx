
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
  // CRITICAL FIX: Ensure lookup map preserves complete Pokemon data including full types
  const pokemonLookupMap = useMemo(() => {
    console.log('[DEBUG PokemonContext] Creating lookup map with', allPokemon.length, 'Pokemon');
    
    const map = new Map<number, Pokemon>();
    allPokemon.forEach((pokemon, index) => {
      // CRITICAL: Preserve complete Pokemon data including types structure
      const completePokemon = {
        ...pokemon,
        types: pokemon.types || []
      };
      
      // Verify type data for first few Pokemon
      if (index < 3) {
        console.log(`[DEBUG PokemonContext] Pokemon ${pokemon.name} (${pokemon.id}) types in map:`, JSON.stringify(pokemon.types));
      }
      
      map.set(pokemon.id, completePokemon);
    });
    
    console.log('[DEBUG PokemonContext] Lookup map created with', map.size, 'entries');
    return map;
  }, [allPokemon.length]); // Only re-create when length changes

  // CRITICAL FIX: Ultra-stable context value
  const contextValue = useMemo(() => {
    const value = {
      allPokemon,
      pokemonLookupMap
    };
    console.log('[DEBUG PokemonContext] Context value created/updated');
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
