
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
  rawUnfilteredPokemon?: Pokemon[]; // NEW: Accept separate raw data
}

export const PokemonProvider: React.FC<PokemonProviderProps> = ({ 
  children, 
  allPokemon, 
  rawUnfilteredPokemon 
}) => {
  console.log(`🌟🌟🌟 [CONTEXT_ULTRA_DEBUG] ===== POKEMON CONTEXT PROVIDER =====`);
  console.log(`🌟🌟🌟 [CONTEXT_ULTRA_DEBUG] Provider rendering with ${allPokemon.length} filtered Pokemon`);
  console.log(`🌟🌟🌟 [CONTEXT_ULTRA_DEBUG] Raw unfiltered Pokemon count: ${rawUnfilteredPokemon?.length || 0}`);
  
  // ULTRA-CRITICAL: Log what Deoxys names we're receiving
  const deoxysInInput = allPokemon.filter(p => p.name.toLowerCase().includes('deoxys'));
  console.log(`🌟🌟🌟 [CONTEXT_DEOXYS_ULTRA_DEBUG] Deoxys in context input: ${deoxysInInput.length}`);
  deoxysInInput.forEach(p => {
    console.log(`🌟🌟🌟 [CONTEXT_DEOXYS_ULTRA_DEBUG] Context input Deoxys: "${p.name}" (ID: ${p.id})`);
  });
  
  // Use the explicitly passed raw data, or fall back to allPokemon if not provided
  const actualRawUnfilteredPokemon = useMemo(() => {
    const rawData = rawUnfilteredPokemon || allPokemon;
    console.log(`🌟🌟🌟 [CONTEXT_ULTRA_DEBUG] Storing ${rawData.length} ACTUAL raw unfiltered Pokemon for form counting`);
    console.log(`🌟🌟🌟 [CONTEXT_ULTRA_DEBUG] Is this truly raw data? ${rawUnfilteredPokemon ? 'YES' : 'NO (fallback to filtered)'}`);
    return rawData;
  }, [rawUnfilteredPokemon, allPokemon]);
  
  // CRITICAL: Verify the source data has types before creating the map
  if (allPokemon.length > 0) {
    const samplePokemon = allPokemon.find(p => p.id === 60) || allPokemon[0]; // Poliwag or first
    console.log(`🌟🌟🌟 [CONTEXT_ULTRA_DEBUG] Input allPokemon - Sample Pokemon types:`, JSON.stringify({
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
    console.log(`🌟🌟🌟 [CONTEXT_ULTRA_DEBUG] Creating lookup map with ${allPokemon.length} Pokemon`);
    console.log(`🌟🌟🌟 [CONTEXT_ULTRA_DEBUG] Creating NEW Map instance for ${allPokemon.length} Pokemon`);
    
    // CRITICAL: Always create a NEW Map instance, even if allPokemon is empty
    // This ensures React detects the change when allPokemon goes from [] to [Pokemon...]
    const map = new Map<number, Pokemon>();
    
    allPokemon.forEach((pokemon) => {
      // ULTRA-CRITICAL: Log Deoxys entries going into the map
      if (pokemon.name.toLowerCase().includes('deoxys')) {
        console.log(`🌟🌟🌟 [CONTEXT_MAP_DEOXYS_ULTRA_DEBUG] Storing Deoxys in map: "${pokemon.name}" (ID: ${pokemon.id})`);
      }
      
      // CRITICAL: Log the exact pokemon object being stored for debugging
      if (pokemon.id === 60) { // Poliwag example
        console.log(`🌟🌟🌟 [CONTEXT_ULTRA_DEBUG] Storing Poliwag (60):`, JSON.stringify({
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
    
    console.log(`🌟🌟🌟 [CONTEXT_ULTRA_DEBUG] Lookup map created with ${map.size} entries`);
    
    // ULTRA-CRITICAL: Verify Deoxys entries in the final map
    const deoxysInMap = Array.from(map.values()).filter(p => p.name.toLowerCase().includes('deoxys'));
    console.log(`🌟🌟🌟 [CONTEXT_MAP_DEOXYS_ULTRA_DEBUG] Deoxys in final map: ${deoxysInMap.length}`);
    deoxysInMap.forEach(p => {
      console.log(`🌟🌟🌟 [CONTEXT_MAP_DEOXYS_ULTRA_DEBUG] Final map Deoxys: "${p.name}" (ID: ${p.id})`);
    });
    
    // NEW: Critical logging for context readiness tracking
    console.log(`🌟🌟🌟 [CONTEXT_ULTRA_DEBUG] PokemonContext lookup map FINALIZED with ${map.size} entries`);
    console.log(`🌟🌟🌟 [CONTEXT_ULTRA_DEBUG] Map instance timestamp: ${Date.now()}`);
    if (map.size > 0) {
      console.log(`🌟🌟🌟 [CONTEXT_ULTRA_DEBUG] ✅ CONTEXT IS NOW READY - Should trigger dependent effects`);
    } else {
      console.log(`🌟🌟🌟 [CONTEXT_ULTRA_DEBUG] ⚠️ Empty context created - waiting for Pokemon data`);
    }
    
    // CRITICAL: Verify the map contains correct data after creation
    const poliwagFromMap = map.get(60);
    if (poliwagFromMap) {
      console.log(`🌟🌟🌟 [CONTEXT_ULTRA_DEBUG] Poliwag retrieved from CREATED map:`, JSON.stringify({
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
      rawUnfilteredPokemon: actualRawUnfilteredPokemon, // ACTUAL raw unfiltered data for counting
      pokemonLookupMap // This is always a new Map instance from above useMemo
    };
    
    // NEW: Enhanced logging to track context value changes
    console.log(`🌟🌟🌟 [CONTEXT_ULTRA_DEBUG] NEW context value created - timestamp: ${Date.now()}`);
    console.log(`🌟🌟🌟 [CONTEXT_ULTRA_DEBUG] allPokemon length: ${allPokemon.length}, map size: ${pokemonLookupMap.size}`);
    console.log(`🌟🌟🌟 [CONTEXT_ULTRA_DEBUG] rawUnfilteredPokemon length: ${actualRawUnfilteredPokemon.length}`);
    console.log(`🌟🌟🌟 [CONTEXT_ULTRA_DEBUG] allPokemon reference: ${allPokemon}`);
    console.log(`🌟🌟🌟 [CONTEXT_ULTRA_DEBUG] pokemonLookupMap reference: ${pokemonLookupMap}`);
    
    // ULTRA-CRITICAL: Log Deoxys in final context value
    const deoxysInValue = value.allPokemon.filter(p => p.name.toLowerCase().includes('deoxys'));
    console.log(`🌟🌟🌟 [CONTEXT_VALUE_DEOXYS_ULTRA_DEBUG] Deoxys in final context value: ${deoxysInValue.length}`);
    deoxysInValue.forEach(p => {
      console.log(`🌟🌟🌟 [CONTEXT_VALUE_DEOXYS_ULTRA_DEBUG] Final context Deoxys: "${p.name}" (ID: ${p.id})`);
    });
    
    return value;
  }, [allPokemon, actualRawUnfilteredPokemon, pokemonLookupMap]); // All dependencies ensure new value when any changes

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
