
import { useMemo } from "react";
import { formatPokemonName } from "@/utils/pokemon";

interface UseEnhancedAvailablePokemonProps {
  filteredAvailablePokemon: any[];
  localRankings: any[];
}

export const useEnhancedAvailablePokemon = ({
  filteredAvailablePokemon,
  localRankings
}: UseEnhancedAvailablePokemonProps) => {
  
  const enhancedAvailablePokemon = useMemo(() => {
    const rankedById = new Map(localRankings.map((p, index) => [p.id, index + 1]));
    const formattedNameById = new Map<number, string>();
    
    const enhanced = filteredAvailablePokemon.map(pokemon => {
      const currentRank = rankedById.get(pokemon.id) ?? null;
      const formattedName = formattedNameById.get(pokemon.id) ?? formatPokemonName(pokemon.name);
      formattedNameById.set(pokemon.id, formattedName);
      const nameChanged = pokemon.name !== formattedName;
      
      if (!currentRank && !nameChanged && !pokemon.isRanked && pokemon.currentRank == null) {
        return pokemon;
      }

      return { ...pokemon, name: formattedName, isRanked: !!currentRank, currentRank };
    });
    
    return enhanced;
  }, [filteredAvailablePokemon, localRankings]);

  return { enhancedAvailablePokemon };
};
