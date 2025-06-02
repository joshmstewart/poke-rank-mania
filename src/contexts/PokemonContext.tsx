
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
  
  // CRITICAL FIX: Create lookup map that preserves COMPLETE original Pokemon data AND ensures new Map instance
  const pokemonLookupMap = useMemo(() => {
    console.log('[DEBUG PokemonContext] Creating lookup map with', allPokemon.length, 'Pokemon');
    console.log(`🌟🌟🌟 [CONTEXT_CREATION_CRITICAL] Creating NEW Map instance for ${allPokemon.length} Pokemon`);
    
    // CRITICAL: Always create a NEW Map instance, even if allPokemon is empty
    // This ensures React detects the change when allPokemon goes from [] to [Pokemon...]
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
    console.log(`🌟🌟🌟 [CONTEXT_READINESS_CRITICAL] Map instance timestamp: ${Date.now()}`);
    if (map.size > 0) {
      console.log(`🌟🌟🌟 [CONTEXT_READINESS_CRITICAL] ✅ CONTEXT IS NOW READY - Should trigger dependent effects`);
    } else {
      console.log(`🌟🌟🌟 [CONTEXT_READINESS_CRITICAL] ⚠️ Empty context created - waiting for Pokemon data`);
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
  }, [allPokemon]); // CRITICAL: Depend on allPokemon array - React will detect reference changes

  // CRITICAL FIX: Create completely new context value object when dependencies change
  const contextValue = useMemo(() => {
    const value = {
      allPokemon, // This should be a new array reference when data changes
      pokemonLookupMap // This is always a new Map instance from above useMemo
    };
    
    // NEW: Enhanced logging to track context value changes
    console.log(`🌟🌟🌟 [CONTEXT_VALUE_CRITICAL] NEW context value created - timestamp: ${Date.now()}`);
    console.log(`🌟🌟🌟 [CONTEXT_VALUE_CRITICAL] allPokemon length: ${allPokemon.length}, map size: ${pokemonLookupMap.size}`);
    console.log(`🌟🌟🌟 [CONTEXT_VALUE_CRITICAL] allPokemon reference: ${allPokemon}`);
    console.log(`🌟🌟🌟 [CONTEXT_VALUE_CRITICAL] pokemonLookupMap reference: ${pokemonLookupMap}`);
    
    return value;
  }, [allPokemon, pokemonLookupMap]); // Both dependencies ensure new value when either changes

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
