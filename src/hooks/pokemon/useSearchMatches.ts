
import { useMemo } from "react";
import { Pokemon } from "@/services/pokemon";

export const useSearchMatches = (availablePokemon: Pokemon[], searchTerm: string) => {
  return useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    console.log(`🔍 [SEARCH_DEBUG] Searching for "${searchTerm}" in ${availablePokemon.length} Pokemon`);
    
    const matchingGenerations = new Set<number>();
    const matchingPokemon: string[] = [];
    
    availablePokemon.forEach(pokemon => {
      const pokemonNameLower = pokemon.name.toLowerCase();
      const searchTermLower = searchTerm.toLowerCase();
      
      if (pokemonNameLower.includes(searchTermLower)) {
        matchingPokemon.push(`${pokemon.name} (ID: ${pokemon.id})`);
        
        // Use the same logic as above to determine generation
        let gen: number;
        let baseId = pokemon.id;
        
        if (pokemon.id > 1025) {
          if (pokemon.id >= 10001 && pokemon.id <= 10300) {
            baseId = pokemon.id - 10000;
          } else {
            const pokemonName = pokemon.name.toLowerCase();
            if (pokemonName.includes('zygarde')) {
              gen = 6;
              matchingGenerations.add(gen);
              return;
            }
            
            const mod1000 = pokemon.id % 1000;
            const mod10000 = pokemon.id % 10000;
            
            if (mod1000 >= 1 && mod1000 <= 1025) {
              baseId = mod1000;
            } else if (mod10000 >= 1 && mod10000 <= 1025) {
              baseId = mod10000;
            } else {
              gen = 9;
              matchingGenerations.add(gen);
              return;
            }
          }
        }
        
        if (baseId <= 151) gen = 1;
        else if (baseId <= 251) gen = 2;
        else if (baseId <= 386) gen = 3;
        else if (baseId <= 493) gen = 4;
        else if (baseId <= 649) gen = 5;
        else if (baseId <= 721) gen = 6;
        else if (baseId <= 809) gen = 7;
        else if (baseId <= 905) gen = 8;
        else if (baseId <= 1025) gen = 9;
        else gen = 9;
        
        matchingGenerations.add(gen);
      }
    });
    
    console.log(`🔍 [SEARCH_DEBUG] Found ${matchingPokemon.length} matching Pokemon:`, matchingPokemon);
    console.log(`🔍 [SEARCH_DEBUG] Matching generations:`, Array.from(matchingGenerations));
    
    return Array.from(matchingGenerations);
  }, [availablePokemon, searchTerm]);
};
