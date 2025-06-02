
import { useMemo } from "react";
import { Pokemon } from "@/services/pokemon";

export const useAvailablePokemonGenerations = (availablePokemon: Pokemon[]) => {
  return useMemo(() => {
    const generations = new Set<number>();
    availablePokemon.forEach(pokemon => {
      let gen: number;
      let baseId = pokemon.id;
      
      // For high IDs (variants/forms), try to map to base Pokemon generation
      if (pokemon.id > 1025) {
        // Handle specific known variant ranges
        if (pokemon.id >= 10001 && pokemon.id <= 10300) {
          // Many Gen 6-7 forms are in this range
          baseId = pokemon.id - 10000;
        } else {
          // For other high IDs, try to extract the base from the name
          const pokemonName = pokemon.name.toLowerCase();
          
          // Zygarde forms should be Gen 6
          if (pokemonName.includes('zygarde')) {
            gen = 6;
            generations.add(gen);
            return;
          }
          
          // If we can't determine, use the modulo approach as fallback
          const mod1000 = pokemon.id % 1000;
          const mod10000 = pokemon.id % 10000;
          
          if (mod1000 >= 1 && mod1000 <= 1025) {
            baseId = mod1000;
          } else if (mod10000 >= 1 && mod10000 <= 1025) {
            baseId = mod10000;
          } else {
            // Default to latest generation for unknown high IDs
            gen = 9;
            generations.add(gen);
            return;
          }
        }
      }
      
      // Standard generation ranges for base IDs
      if (baseId <= 151) gen = 1;
      else if (baseId <= 251) gen = 2;
      else if (baseId <= 386) gen = 3;
      else if (baseId <= 493) gen = 4;
      else if (baseId <= 649) gen = 5;
      else if (baseId <= 721) gen = 6;
      else if (baseId <= 809) gen = 7;
      else if (baseId <= 905) gen = 8;
      else if (baseId <= 1025) gen = 9;
      else gen = 9; // Default to latest
      
      generations.add(gen);
    });
    return Array.from(generations).sort((a, b) => a - b);
  }, [availablePokemon]);
};
