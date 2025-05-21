
import { useState, useCallback } from "react";
import { RankedPokemon, RankingSuggestion } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";

export const useRankingSuggestions = (
  pokemonList: RankedPokemon[],
  setPokemonList: React.Dispatch<React.SetStateAction<RankedPokemon[]>>
) => {
  const [activeSuggestions, setActiveSuggestions] = useState<Map<number, RankingSuggestion>>(
    new Map()
  );

  // Add or update a suggestion
  const suggestRanking = useCallback((
    pokemon: RankedPokemon,
    direction: "up" | "down",
    strength: 1 | 2 | 3
  ) => {
    setActiveSuggestions(prev => {
      const newMap = new Map(prev);
      
      // Create new suggestion
      const suggestion: RankingSuggestion = {
        direction,
        strength,
        used: false
      };
      
      // Add to our internal map
      newMap.set(pokemon.id, suggestion);

      // Update the pokemon list with the suggestion
      setPokemonList(currentList => 
        currentList.map(p => 
          p.id === pokemon.id 
            ? { ...p, suggestedAdjustment: suggestion } 
            : p
        )
      );
      
      const directionSymbol = direction === "up" ? "🔼" : "🔽";
      const directionText = direction === "up" ? "HIGHER" : "LOWER";
      const arrowSymbol = direction === "up" ? "↑" : "↓";
      
      console.log(`${directionSymbol} Suggesting '${pokemon.name}' should be ranked ${directionText} (${arrowSymbol} x${strength})`);
      
      return newMap;
    });
  }, [setPokemonList]);

  // Remove a suggestion
  const removeSuggestion = useCallback((pokemonId: number) => {
    setActiveSuggestions(prev => {
      const newMap = new Map(prev);
      newMap.delete(pokemonId);
      
      // Update the pokemon list to remove the suggestion
      setPokemonList(currentList => 
        currentList.map(p => 
          p.id === pokemonId 
            ? { ...p, suggestedAdjustment: undefined } 
            : p
        )
      );
      
      return newMap;
    });
  }, [setPokemonList]);

  // Mark a suggestion as used
  const markSuggestionUsed = useCallback((pokemon: RankedPokemon) => {
    if (!pokemon.suggestedAdjustment) return;
    
    setActiveSuggestions(prev => {
      const newMap = new Map(prev);
      const suggestion = newMap.get(pokemon.id);
      
      if (suggestion) {
        suggestion.used = true;
        newMap.set(pokemon.id, suggestion);
        
        // Update the pokemon in the list
        setPokemonList(currentList => 
          currentList.map(p => 
            p.id === pokemon.id 
              ? { ...p, suggestedAdjustment: { ...suggestion, used: true } } 
              : p
          )
        );
        
        console.log(`✅ Used suggestion for '${pokemon.name}' → marking as used`);
        
        toast({
          title: `Refined match for ${pokemon.name}`,
          description: `${direction === "up" ? "↑" : "↓"} Rating updated!`,
          duration: 3000
        });
      }
      
      return newMap;
    });
  }, [setPokemonList]);

  // Clear all suggestions
  const clearAllSuggestions = useCallback(() => {
    setActiveSuggestions(new Map());
    
    // Remove suggestions from all pokemon
    setPokemonList(currentList => 
      currentList.map(p => ({ ...p, suggestedAdjustment: undefined }))
    );
    
    console.log("♻️ All user ranking suggestions cleared");
    
    toast({
      title: "Suggestions cleared",
      description: "All ranking suggestions have been reset",
      duration: 3000
    });
  }, [setPokemonList]);

  // Find a pokemon with an active, unused suggestion
  const findNextSuggestion = useCallback(() => {
    return pokemonList.find(p => 
      p.suggestedAdjustment && !p.suggestedAdjustment.used
    );
  }, [pokemonList]);

  return {
    activeSuggestions,
    suggestRanking,
    removeSuggestion,
    markSuggestionUsed,
    clearAllSuggestions,
    findNextSuggestion
  };
};
