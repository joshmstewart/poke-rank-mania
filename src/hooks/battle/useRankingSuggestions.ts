
import { useState, useCallback, useEffect, useRef } from "react";
import { RankedPokemon, RankingSuggestion } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";

export const useRankingSuggestions = (
  pokemonList: RankedPokemon[],
  setPokemonList: React.Dispatch<React.SetStateAction<RankedPokemon[]>>
) => {
  // Use useRef instead of useState for activeSuggestions to avoid state sync issues
  const activeSuggestionsRef = useRef<Map<number, RankingSuggestion>>(new Map());
  
  // Track whether suggestions have been loaded from localStorage
  const suggestionsLoadedRef = useRef(false);
  
  // Add a ref to track if we've been initialized
  const initDoneRef = useRef(false);

  // Add or update a suggestion
  const suggestRanking = useCallback((
    pokemon: RankedPokemon,
    direction: "up" | "down",
    strength: 1 | 2 | 3
  ) => {
    console.log(`📝 Creating suggestion: ${pokemon.name} should rank ${direction} (strength: ${strength})`);
    
    // Create new suggestion
    const suggestion: RankingSuggestion = {
      direction,
      strength,
      used: false
    };
    
    // Add to our internal map
    activeSuggestionsRef.current.set(pokemon.id, suggestion);

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
    saveActiveSuggestions(activeSuggestionsRef.current);
    
    return suggestion;
  }, [setPokemonList]);

  // Remove a suggestion
  const removeSuggestion = useCallback((pokemonId: number) => {
    // Find the pokemon name before removing for logging
    const pokemon = pokemonList.find(p => p.id === pokemonId);
    const pokemonName = pokemon?.name || `Pokemon #${pokemonId}`;
    
    activeSuggestionsRef.current.delete(pokemonId);
    
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
    saveActiveSuggestions(activeSuggestionsRef.current);
  }, [pokemonList, setPokemonList]);

  // Mark a suggestion as used
  const markSuggestionUsed = useCallback((pokemon: RankedPokemon) => {
    if (!pokemon.suggestedAdjustment) {
      console.log(`⚠️ Attempted to mark suggestion used for ${pokemon.name} but no suggestion exists`);
      return;
    }
    
    console.log(`✅ Marking suggestion used for ${pokemon.name}`);
    
    const suggestion = activeSuggestionsRef.current.get(pokemon.id);
    
    if (suggestion) {
      suggestion.used = true;
      activeSuggestionsRef.current.set(pokemon.id, suggestion);
      
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
      saveActiveSuggestions(activeSuggestionsRef.current);
    }
  }, [setPokemonList]);

  // Clear all suggestions
  const clearAllSuggestions = useCallback(() => {
    console.log("♻️ Clearing ALL user ranking suggestions");
    
    activeSuggestionsRef.current.clear();
    
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
    suggestionsLoadedRef.current = false;
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
  
  // Load suggestions from localStorage and apply them to the pokemonList
  const loadSavedSuggestions = useCallback(() => {
    try {
      if (suggestionsLoadedRef.current) {
        console.log("🔄 Suggestions already loaded, skipping load");
        return activeSuggestionsRef.current;
      }
      
      console.log("🔄 Loading saved suggestions from localStorage...");
      const savedSuggestions = localStorage.getItem('pokemon-active-suggestions');
      
      if (savedSuggestions) {
        const parsedSuggestions = JSON.parse(savedSuggestions);
        const suggestionMap = new Map(Object.entries(parsedSuggestions).map(
          ([id, suggestion]) => [Number(id), suggestion as RankingSuggestion]
        ));
        
        console.log(`📂 Loaded ${suggestionMap.size} saved suggestions from localStorage`);
        activeSuggestionsRef.current = suggestionMap;
        suggestionsLoadedRef.current = true;
        
        // Apply these suggestions to the pokemon list
        if (pokemonList && pokemonList.length > 0) {
          console.log(`Applying ${suggestionMap.size} suggestions to ${pokemonList.length} Pokémon`);
          
          setPokemonList(currentList => 
            currentList.map(p => {
              const suggestion = suggestionMap.get(p.id);
              
              if (suggestion) {
                console.log(`Applied suggestion to ${p.name}: ${suggestion.direction} x${suggestion.strength}`);
                return { ...p, suggestedAdjustment: suggestion };
              }
              
              return p;
            })
          );
        } else {
          console.log("Cannot apply suggestions yet: Pokemon list is empty");
        }
        
        return suggestionMap;
      } else {
        console.log("No saved suggestions found in localStorage");
        suggestionsLoadedRef.current = true;
        return new Map<number, RankingSuggestion>();
      }
    } catch (e) {
      console.error("❌ Error loading suggestions from localStorage:", e);
      suggestionsLoadedRef.current = true;
      return new Map<number, RankingSuggestion>();
    }
  }, [pokemonList, setPokemonList]);
  
  // Load saved suggestions when the hook initializes
  useEffect(() => {
    console.log("⚙️ useRankingSuggestions hook initialized");
    
    if (!initDoneRef.current) {
      initDoneRef.current = true;
      console.log("🔄 useRankingSuggestions: First mount, loading suggestions");
      loadSavedSuggestions();
    }
  }, [loadSavedSuggestions]);
  
  // Apply suggestions when pokemonList changes significantly
  useEffect(() => {
    if (suggestionsLoadedRef.current && pokemonList.length > 0 && activeSuggestionsRef.current.size > 0) {
      // Check if suggestions are already applied to avoid infinite loops
      const hasAnySuggestion = pokemonList.some(p => p.suggestedAdjustment);
      
      if (!hasAnySuggestion) {
        console.log("🔄 useRankingSuggestions: pokemonList updated but no suggestions applied, applying now");
        
        setPokemonList(currentList => 
          currentList.map(p => {
            const suggestion = activeSuggestionsRef.current.get(p.id);
            
            if (suggestion) {
              console.log(`Re-applied suggestion to ${p.name}: ${suggestion.direction} x${suggestion.strength}`);
              return { ...p, suggestedAdjustment: suggestion };
            }
            
            return p;
          })
        );
      }
    }
  }, [pokemonList, setPokemonList]);
  
  // Debug effect to monitor suggestion counts
  useEffect(() => {
    if (activeSuggestionsRef.current.size > 0 || pokemonList.some(p => p.suggestedAdjustment)) {
      const unusedCount = pokemonList.filter(p => 
        p.suggestedAdjustment && !p.suggestedAdjustment.used
      ).length;
      
      const usedCount = pokemonList.filter(p => 
        p.suggestedAdjustment && p.suggestedAdjustment.used
      ).length;
      
      console.log(`📊 Current suggestions: ${unusedCount} unused, ${usedCount} used (total: ${unusedCount + usedCount})`);
    }
  }, [pokemonList]);

  return {
    activeSuggestions: activeSuggestionsRef.current, // Expose the map of suggestions
    suggestRanking,
    removeSuggestion,
    markSuggestionUsed,
    clearAllSuggestions,
    findNextSuggestion,
    loadSavedSuggestions // Expose this function for external use
  };
};
