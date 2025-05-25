
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
  // PERFORMANCE FIX: Stable memoized lookup map
  const pokemonLookupMap = useMemo(() => {
    const map = new Map<number, Pokemon>();
    allPokemon.forEach(pokemon => {
      // Preserve complete Pokemon data including types
      map.set(pokemon.id, {
        ...pokemon,
        types: pokemon.types || []
      });
    });
    return map;
  }, [allPokemon.length]); // Only re-create when length changes

  // PERFORMANCE FIX: Memoize context value
  const contextValue = useMemo(() => ({
    allPokemon,
    pokemonLookupMap
  }), [allPokemon, pokemonLookupMap]);

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
