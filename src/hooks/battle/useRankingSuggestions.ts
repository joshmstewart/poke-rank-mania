
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
      
      // Save suggestions to localStorage for persistence
      saveActiveSuggestions(newMap);
      
      return newMap;
    });
  }, [setPokemonList]);

  // Remove a suggestion
  const removeSuggestion = useCallback((pokemonId: number) => {
    setActiveSuggestions(prev => {
      const newMap = new Map(prev);
      
      // Find the pokemon name before removing for logging
      const pokemon = pokemonList.find(p => p.id === pokemonId);
      const pokemonName = pokemon?.name || `Pokemon #${pokemonId}`;
      
      newMap.delete(pokemonId);
      
      // Update the pokemon list to remove the suggestion
      setPokemonList(currentList => 
        currentList.map(p => 
          p.id === pokemonId 
            ? { ...p, suggestedAdjustment: undefined } 
            : p
        )
      );
      
      console.log(`Removing suggestion for '${pokemonName}'`);
      
      // Update localStorage
      saveActiveSuggestions(newMap);
      
      return newMap;
    });
  }, [pokemonList, setPokemonList]);

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
          description: `${suggestion.direction === "up" ? "↑" : "↓"} Rating updated!`,
          duration: 3000
        });
        
        // Update localStorage
        saveActiveSuggestions(newMap);
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
    
    // Clear from localStorage
    localStorage.removeItem('pokemon-active-suggestions');
  }, [setPokemonList]);

  // Find a pokemon with an active, unused suggestion
  const findNextSuggestion = useCallback(() => {
    return pokemonList.find(p => 
      p.suggestedAdjustment && !p.suggestedAdjustment.used
    );
  }, [pokemonList]);
  
  // Helper function to save suggestions to localStorage
  const saveActiveSuggestions = (suggestions: Map<number, RankingSuggestion>) => {
    try {
      const suggestionsObject = Object.fromEntries(suggestions);
      localStorage.setItem('pokemon-active-suggestions', JSON.stringify(suggestionsObject));
    } catch (e) {
      console.error("Error saving suggestions to localStorage:", e);
    }
  };
  
  // Load suggestions from localStorage on init
  const loadSavedSuggestions = useCallback(() => {
    try {
      const savedSuggestions = localStorage.getItem('pokemon-active-suggestions');
      if (savedSuggestions) {
        const parsedSuggestions = JSON.parse(savedSuggestions);
        const suggestionMap = new Map(Object.entries(parsedSuggestions).map(
          ([id, suggestion]) => [Number(id), suggestion as RankingSuggestion]
        ));
        setActiveSuggestions(suggestionMap);
        
        // Apply these suggestions to the pokemon list
        setPokemonList(currentList => 
          currentList.map(p => {
            const suggestion = suggestionMap.get(p.id);
            return suggestion ? { ...p, suggestedAdjustment: suggestion } : p;
          })
        );
        
        console.log(`Loaded ${suggestionMap.size} saved suggestions from localStorage`);
      }
    } catch (e) {
      console.error("Error loading suggestions from localStorage:", e);
    }
  }, [setPokemonList]);
  
  // Load saved suggestions when the hook is initialized
  useEffect(() => {
    loadSavedSuggestions();
  }, [loadSavedSuggestions]);

  return {
    activeSuggestions, // Expose the map of suggestions
    suggestRanking,
    removeSuggestion,
    markSuggestionUsed,
    clearAllSuggestions,
    findNextSuggestion
  };
};
