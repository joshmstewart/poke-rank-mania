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
  
  // Keep track of the last time we saved to localStorage to avoid excessive writes
  const lastSaveTimeRef = useRef(0);

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
    
    // CRITICAL FIX: Create a direct object for storage that's easier to debug
    const storageObject: Record<string, any> = {};
    
    // Add ALL current suggestions to the storage object
    activeSuggestionsRef.current.forEach((value, key) => {
      storageObject[key.toString()] = value;
    });
    
    // Directly set to localStorage with simple string keys
    try {
      const storageJson = JSON.stringify(storageObject);
      
      // CRITICAL FIX: Fix the storage key to ensure consistency - make it a constant
      const STORAGE_KEY = 'pokemon-active-suggestions';
      localStorage.setItem(STORAGE_KEY, storageJson);
      
      // Direct verification
      console.log(`💾 SAVED: Wrote suggestion for ${pokemon.name} (ID: ${pokemon.id}) to localStorage`);
      
      // Immediate verification by reading back
      const verificationRead = localStorage.getItem(STORAGE_KEY);
      if (verificationRead) {
        const parsed = JSON.parse(verificationRead);
        const keys = Object.keys(parsed);
        console.log(`✅ VERIFICATION: Successfully stored ${keys.length} suggestions in localStorage`);
        
        // Check if our specific pokemon is in there
        if (parsed[pokemon.id.toString()]) {
          console.log(`✅ VERIFICATION: Confirmed ${pokemon.name} suggestion is in localStorage`);
        } else {
          console.log(`❌ VERIFICATION: FAILED TO FIND ${pokemon.name} suggestion in localStorage!`);
        }
      } else {
        console.log(`❌ VERIFICATION: FAILED to read suggestions from localStorage after saving!`);
      }
    } catch (e) {
      console.error(`❌ ERROR saving suggestion to localStorage:`, e);
    }
    
    return suggestion;
  }, [setPokemonList]);

  // CRITICAL FIX: Ensure we're using a consistent storage key
  const STORAGE_KEY = 'pokemon-active-suggestions';
  
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
    
    // CRITICAL FIX: Direct removal from localStorage
    try {
      const savedSuggestions = localStorage.getItem(STORAGE_KEY);
      if (savedSuggestions) {
        const parsed = JSON.parse(savedSuggestions);
        delete parsed[pokemonId.toString()];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        console.log(`✅ VERIFICATION: Removed suggestion for ${pokemonName} from localStorage`);
      }
    } catch (e) {
      console.error(`❌ ERROR removing suggestion from localStorage:`, e);
    }
  }, [pokemonList, setPokemonList, STORAGE_KEY]);

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
      
      // CRITICAL FIX: Directly update localStorage
      try {
        const savedSuggestions = localStorage.getItem(STORAGE_KEY);
        if (savedSuggestions) {
          const parsed = JSON.parse(savedSuggestions);
          if (parsed[pokemon.id]) {
            parsed[pokemon.id].used = true;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            console.log(`✅ VERIFICATION: Updated suggestion as used for ${pokemon.name} in localStorage`);
          } else {
            console.log(`⚠️ Could not find suggestion for ${pokemon.name} in localStorage to mark as used`);
          }
        }
      } catch (e) {
        console.error(`❌ ERROR updating suggestion in localStorage:`, e);
      }
    }
  }, [setPokemonList, STORAGE_KEY]);

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
    localStorage.removeItem(STORAGE_KEY);
    suggestionsLoadedRef.current = false;
    
    // Verify removal
    const verifyRemoval = localStorage.getItem(STORAGE_KEY);
    if (!verifyRemoval) {
      console.log(`✅ VERIFICATION: Successfully cleared all suggestions from localStorage`);
    } else {
      console.log(`❌ VERIFICATION: Failed to clear suggestions from localStorage!`);
    }
  }, [setPokemonList, STORAGE_KEY]);

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
  
  // Load suggestions from localStorage and apply them to the pokemonList
  const loadSavedSuggestions = useCallback(() => {
    try {
      console.log("🔄 Loading saved suggestions from localStorage...");
      const savedSuggestions = localStorage.getItem(STORAGE_KEY);
      
      if (savedSuggestions) {
        console.log(`📋 Raw suggestions data from localStorage: ${savedSuggestions.substring(0, 100)}...`);
        
        const parsedSuggestions = JSON.parse(savedSuggestions);
        const suggestionMap = new Map<number, RankingSuggestion>();
        
        // CRITICAL FIX: Better parsing of suggestions from localStorage
        Object.entries(parsedSuggestions).forEach(([idStr, suggestionData]) => {
          const id = Number(idStr);
          const suggestion = suggestionData as RankingSuggestion;
          suggestionMap.set(id, suggestion);
        });
        
        console.log(`📂 Loaded ${suggestionMap.size} saved suggestions from localStorage`);
        
        // Print out each suggestion for verification
        suggestionMap.forEach((suggestion, id) => {
          const pokemonName = pokemonList.find(p => p.id === id)?.name || `#${id}`;
          console.log(`  - ${pokemonName}: ${suggestion.direction} x${suggestion.strength} (used: ${suggestion.used})`);
        });
        
        activeSuggestionsRef.current = suggestionMap;
        suggestionsLoadedRef.current = true;
        
        // Apply these suggestions to the pokemon list if available
        if (pokemonList && pokemonList.length > 0) {
          console.log(`📌 Applying ${suggestionMap.size} suggestions to ${pokemonList.length} Pokémon`);
          
          setPokemonList(currentList => {
            // Create a new list with suggestions applied
            const updatedList = currentList.map(p => {
              const suggestion = suggestionMap.get(p.id);
              
              if (suggestion) {
                console.log(`📌 Applied suggestion to ${p.name}: ${suggestion.direction} x${suggestion.strength} (used: ${suggestion.used})`);
                return { ...p, suggestedAdjustment: suggestion };
              }
              
              return p;
            });
            
            // Return the updated list
            return updatedList;
          });
        } else {
          console.log("⚠️ Cannot apply suggestions yet: Pokemon list is empty");
        }
        
        return suggestionMap;
      } else {
        console.log("ℹ️ No saved suggestions found in localStorage");
        suggestionsLoadedRef.current = true;
        return new Map<number, RankingSuggestion>();
      }
    } catch (e) {
      console.error("❌ Error loading suggestions from localStorage:", e);
      suggestionsLoadedRef.current = true;
      return new Map<number, RankingSuggestion>();
    }
  }, [pokemonList, setPokemonList, STORAGE_KEY]);
  
  // CRITICAL FIX: Load saved suggestions on EVERY mount to ensure they're always available
  useEffect(() => {
    console.log("⚙️ useRankingSuggestions hook initialized");
    
    // ALWAYS load suggestions on mount
    console.log("🔄 useRankingSuggestions: Loading suggestions on mount");
    loadSavedSuggestions();
    
    // Set init flag
    initDoneRef.current = true;
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
              console.log(`📌 Re-applied suggestion to ${p.name}: ${suggestion.direction} x${suggestion.strength}`);
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
    const unusedCount = pokemonList.filter(p => 
      p.suggestedAdjustment && !p.suggestedAdjustment.used
    ).length;
    
    const usedCount = pokemonList.filter(p => 
      p.suggestedAdjustment && p.suggestedAdjustment.used
    ).length;
    
    if (unusedCount > 0 || usedCount > 0) {
      console.log(`📊 Current suggestions: ${unusedCount} unused, ${usedCount} used (total: ${unusedCount + usedCount})`);
    }
    
    // CRITICAL FIX: Also verify against localStorage
    try {
      const savedSuggestions = localStorage.getItem(STORAGE_KEY);
      if (savedSuggestions) {
        try {
          const parsed = JSON.parse(savedSuggestions);
          const storedCount = Object.keys(parsed).length;
          
          if (storedCount !== (unusedCount + usedCount)) {
            console.log(`⚠️ MISMATCH: ${storedCount} suggestions in localStorage vs ${unusedCount + usedCount} in state`);
          } else if (storedCount > 0) {
            console.log(`✅ MATCH: ${storedCount} suggestions in both localStorage and state`);
          }
        } catch (e) {
          console.error(`❌ Error parsing suggestions when verifying:`, e);
        }
      }
    } catch (e) {
      console.error(`❌ Error checking localStorage during verification:`, e);
    }
  }, [pokemonList]);

  return {
    activeSuggestions: activeSuggestionsRef.current, // Expose the map of suggestions
    suggestRanking,
    removeSuggestion,
    markSuggestionUsed,
    clearAllSuggestions,
    findNextSuggestion,
    loadSavedSuggestions // CRITICAL FIX: Expose this function for external use
  };
};
