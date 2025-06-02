
import { useMemo } from "react";
import { Pokemon } from "@/services/pokemon";

export const useGenerationFilter = (availablePokemon: Pokemon[], selectedGeneration: number) => {
  const filteredAvailablePokemon = useMemo(() => {
    if (selectedGeneration === 0) {
      return availablePokemon;
    }
    
    return availablePokemon.filter(pokemon => {
      // Filter by generation based on Pokemon ID ranges
      if (selectedGeneration === 1) return pokemon.id <= 151;
      if (selectedGeneration === 2) return pokemon.id <= 251;
      if (selectedGeneration === 3) return pokemon.id <= 386;
      if (selectedGeneration === 4) return pokemon.id <= 493;
      if (selectedGeneration === 5) return pokemon.id <= 649;
      if (selectedGeneration === 6) return pokemon.id <= 721;
      if (selectedGeneration === 7) return pokemon.id <= 809;
      if (selectedGeneration === 8) return pokemon.id <= 905;
      if (selectedGeneration === 9) return pokemon.id <= 1025;
      return true;
    });
  }, [availablePokemon, selectedGeneration]);

  const setSelectedGeneration = (gen: number) => {
    // This will be handled by the parent component
    console.log(`Generation filter updated to: ${gen}`);
  };

  return {
    filteredAvailablePokemon,
    setSelectedGeneration
  };
};
