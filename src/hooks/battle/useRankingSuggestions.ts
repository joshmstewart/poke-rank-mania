
import { useState, useCallback, useEffect } from "react";
import { RankedPokemon, RankingSuggestion } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";

export const useRankingSuggestions = (
  pokemonList: RankedPokemon[],
  setPokemonList: React.Dispatch<React.SetStateAction<RankedPokemon[]>>
) => {
  const [activeSuggestions, setActiveSuggestions] = useState<Map<number, RankingSuggestion>>(
    new Map()
  );
  
  // Track whether suggestions have been loaded from localStorage
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);

  // Add or update a suggestion
  const suggestRanking = useCallback((
    pokemon: RankedPokemon,
    direction: "up" | "down",
    strength: 1 | 2 | 3
  ) => {
    console.log(`📝 Creating suggestion: ${pokemon.name} should rank ${direction} (strength: ${strength})`);
    
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
      
      console.log(`🧹 Removing suggestion for '${pokemonName}'`);
      
      // Update localStorage
      saveActiveSuggestions(newMap);
      
      return newMap;
    });
  }, [pokemonList, setPokemonList]);

  // Mark a suggestion as used
  const markSuggestionUsed = useCallback((pokemon: RankedPokemon) => {
    if (!pokemon.suggestedAdjustment) {
      console.log(`⚠️ Attempted to mark suggestion used for ${pokemon.name} but no suggestion exists`);
      return;
    }
    
    console.log(`✅ Marking suggestion used for ${pokemon.name}`);
    
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
        
        console.log(`✓ Used suggestion for '${pokemon.name}' successfully marked as used`);
        
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
    console.log("♻️ Clearing ALL user ranking suggestions");
    
    setActiveSuggestions(new Map());
    
    // Remove suggestions from all pokemon
    setPokemonList(currentList => 
      currentList.map(p => ({ ...p, suggestedAdjustment: undefined }))
    );
    
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
    const next = pokemonList.find(p => 
      p.suggestedAdjustment && !p.suggestedAdjustment.used
    );
    
    if (next) {
      console.log(`🔍 Found unused suggestion for ${next.name}`);
    } else {
      console.log("🔍 No unused suggestions found");
    }
    
    return next;
  }, [pokemonList]);
  
  // Helper function to save suggestions to localStorage
  const saveActiveSuggestions = (suggestions: Map<number, RankingSuggestion>) => {
    try {
      const suggestionsObject = Object.fromEntries(suggestions);
      localStorage.setItem('pokemon-active-suggestions', JSON.stringify(suggestionsObject));
      console.log(`💾 Saved ${suggestions.size} suggestions to localStorage`);
    } catch (e) {
      console.error("❌ Error saving suggestions to localStorage:", e);
    }
  };
  
  // Load suggestions from localStorage on init
  const loadSavedSuggestions = useCallback(() => {
    try {
      console.log("🔄 Loading saved suggestions from localStorage...");
      const savedSuggestions = localStorage.getItem('pokemon-active-suggestions');
      if (savedSuggestions) {
        const parsedSuggestions = JSON.parse(savedSuggestions);
        const suggestionMap = new Map(Object.entries(parsedSuggestions).map(
          ([id, suggestion]) => [Number(id), suggestion as RankingSuggestion]
        ));
        
        console.log(`📂 Loaded ${suggestionMap.size} saved suggestions from localStorage`);
        
        setActiveSuggestions(suggestionMap);
        setSuggestionsLoaded(true);
        
        // Apply these suggestions to the pokemon list
        setPokemonList(currentList => {
          if (!currentList || currentList.length === 0) {
            console.warn("Cannot apply suggestions: Pokemon list is empty");
            return currentList;
          }
          
          console.log(`Applying ${suggestionMap.size} suggestions to ${currentList.length} Pokémon`);
          
          return currentList.map(p => {
            const suggestion = suggestionMap.get(p.id);
            
            if (suggestion) {
              console.log(`Applied suggestion to ${p.name}: ${suggestion.direction} x${suggestion.strength}`);
              return { ...p, suggestedAdjustment: suggestion };
            }
            
            return p;
          });
        });
        
        return suggestionMap;
      } else {
        console.log("No saved suggestions found in localStorage");
        return new Map<number, RankingSuggestion>();
      }
    } catch (e) {
      console.error("❌ Error loading suggestions from localStorage:", e);
      return new Map<number, RankingSuggestion>();
    }
  }, [setPokemonList]);
  
  // Load saved suggestions when the hook is initialized
  useEffect(() => {
    console.log("⚙️ useRankingSuggestions hook initialized");
    if (!suggestionsLoaded) {
      loadSavedSuggestions();
    }
  }, [suggestionsLoaded, loadSavedSuggestions]);
  
  // Debug effect to monitor suggestion counts
  useEffect(() => {
    const unusedCount = pokemonList.filter(p => 
      p.suggestedAdjustment && !p.suggestedAdjustment.used
    ).length;
    
    const usedCount = pokemonList.filter(p => 
      p.suggestedAdjustment && p.suggestedAdjustment.used
    ).length;
    
    if (unusedCount > 0 || usedCount > 0) {
      console.log(`📊 Current suggestions: ${unusedCount} unused, ${usedCount} used (total: ${unusedCount + usedCount})`);
    }
  }, [pokemonList]);

  return {
    activeSuggestions, // Expose the map of suggestions
    suggestRanking,
    removeSuggestion,
    markSuggestionUsed,
    clearAllSuggestions,
    findNextSuggestion,
    loadSavedSuggestions // Expose this function for external use
  };
};
