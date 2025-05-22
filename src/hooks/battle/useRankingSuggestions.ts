
import { useState, useCallback, useEffect, useRef } from "react";
import { RankedPokemon, RankingSuggestion } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";

const STORAGE_KEY = 'pokemon-active-suggestions';

export const useRankingSuggestions = (
  pokemonList: RankedPokemon[],
  setPokemonList: React.Dispatch<React.SetStateAction<RankedPokemon[]>>
) => {
  const activeSuggestionsRef = useRef<Map<number, RankingSuggestion>>(new Map());
  // Add a counter to track suggestion usage for debugging
  const suggestionsUsedCountRef = useRef(0);

  const saveSuggestions = useCallback(() => {
    const obj: Record<string, RankingSuggestion> = {};
    activeSuggestionsRef.current.forEach((v, k) => (obj[k] = v));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    console.log(`💾 saveSuggestions: Saved ${Object.keys(obj).length} suggestions to localStorage`, obj);
  }, []);


  const loadSavedSuggestions = useCallback(() => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed: Record<number, RankingSuggestion> = JSON.parse(data);
      activeSuggestionsRef.current = new Map(Object.entries(parsed).map(([k, v]) => [Number(k), v]));
      console.log("📥 Loaded suggestions from localStorage:", activeSuggestionsRef.current.size);
      
      // Count already-used suggestions for debugging
      let usedCount = 0;
      activeSuggestionsRef.current.forEach(s => {
        if (s.used) usedCount++;
      });
      suggestionsUsedCountRef.current = usedCount;
      console.log(`📊 Found ${usedCount} already-used suggestions from ${activeSuggestionsRef.current.size} total`);
      
      setPokemonList(current =>
        current.map(p => ({
          ...p,
          suggestedAdjustment: activeSuggestionsRef.current.get(p.id)
        }))
      );
    } else {
      console.log("⚠️ No suggestions found in localStorage");
      activeSuggestionsRef.current.clear();
    }

    return activeSuggestionsRef.current;
  }, [setPokemonList]);

  useEffect(() => {
    loadSavedSuggestions();
    
    // Set up a periodic check to ensure suggestions are used
    const intervalId = setInterval(() => {
      console.log("⏰ Periodic suggestion refresh check");
      
      // Count unused suggestions
      let unusedCount = 0;
      activeSuggestionsRef.current.forEach(suggestion => {
        if (!suggestion.used) unusedCount++;
      });
      
      if (unusedCount > 0) {
        // Calculate time since last refresh
        const lastRefreshTime = parseInt(localStorage.getItem('last-suggestion-refresh') || '0');
        const timeSinceRefresh = Date.now() - lastRefreshTime;
        console.log(`⚠️ Found ${unusedCount} suggestions without refresh for ${Math.floor(timeSinceRefresh/1000)}s`);
        
        // If it's been more than 30 seconds, force a refresh
        if (timeSinceRefresh > 30000) {
          console.log("🔥 Dispatching prioritizeSuggestions event");
          document.dispatchEvent(new Event('prioritizeSuggestions'));
          localStorage.setItem('last-suggestion-refresh', Date.now().toString());
        }
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [loadSavedSuggestions]);

  const suggestRanking = useCallback((pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => {
    const suggestion = { direction, strength, used: false };
    activeSuggestionsRef.current.set(pokemon.id, suggestion);
    setPokemonList(curr => curr.map(p => p.id === pokemon.id ? { ...p, suggestedAdjustment: suggestion } : p));
    console.log(`💾 suggestRanking: Suggestion CREATED for Pokémon ${pokemon.name} (${pokemon.id})`, suggestion);
    saveSuggestions();
    
    // After adding a suggestion, dispatch an event to prioritize suggestions
    setTimeout(() => {
      console.log("🔥 Dispatching prioritizeSuggestions event after new suggestion creation");
      document.dispatchEvent(new Event('prioritizeSuggestions'));
      localStorage.setItem('last-suggestion-refresh', Date.now().toString());
    }, 500);
    
  }, [saveSuggestions, setPokemonList]);

  const removeSuggestion = useCallback((pokemonId: number) => {
    activeSuggestionsRef.current.delete(pokemonId);
    setPokemonList(curr => curr.map(p => p.id === pokemonId ? { ...p, suggestedAdjustment: undefined } : p));
    saveSuggestions();
    console.log(`❌ Removed suggestion for Pokémon ID: ${pokemonId}`);
  }, [saveSuggestions, setPokemonList]);


  const clearAllSuggestions = useCallback(() => {
    activeSuggestionsRef.current.clear();
    setPokemonList(curr => curr.map(p => ({ ...p, suggestedAdjustment: undefined })));
    localStorage.removeItem(STORAGE_KEY);
    suggestionsUsedCountRef.current = 0;
  }, [setPokemonList]);

  // Fix: Ensure explicit marking of suggestions as used
  const markSuggestionUsed = useCallback((pokemon: RankedPokemon) => {
    const suggestion = activeSuggestionsRef.current.get(pokemon.id);
    if (suggestion) {
      // Explicitly mark the suggestion as used
      suggestion.used = true;
      activeSuggestionsRef.current.set(pokemon.id, suggestion);
      
      // Increment the used counter 
      suggestionsUsedCountRef.current++;
      
      // Update the Pokemon list with the used suggestion
      setPokemonList(curr => curr.map(p => 
        p.id === pokemon.id ? { ...p, suggestedAdjustment: { ...suggestion } } : p
      ));
      
      // Save to localStorage immediately
      saveSuggestions();
      
      console.log(`🎯 Explicitly marked suggestion as USED for Pokémon #${pokemon.id} (${pokemon.name})`);
      console.log(`📊 Total suggestions used in this session: ${suggestionsUsedCountRef.current}`);
      
      toast({
        title: `Refined match for ${pokemon.name}`,
        description: `${suggestion.direction === "up" ? "↑" : "↓"} Rating updated!`,
        duration: 3000
      });
    } else {
      console.log(`⚠️ Attempted to mark suggestion as used for Pokémon #${pokemon.id} but no suggestion exists`);
    }
  }, [setPokemonList, saveSuggestions]);

  const findNextSuggestion = useCallback(() => {
    const next = pokemonList.find(p => p.suggestedAdjustment && !p.suggestedAdjustment.used);
    
    if (next) {
      console.log(`🔍 Found next unused suggestion: Pokémon #${next.id} (${next.name})`);
    } else {
      console.log(`🔍 No unused suggestions found among ${pokemonList.length} Pokémon`);
    }
    
    return next;
  }, [pokemonList]);
  
  // Add a periodic check for unused suggestions
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const unusedCount = pokemonList.filter(p => p.suggestedAdjustment && !p.suggestedAdjustment.used).length;
      console.log(`🔍 Periodic check: Found ${unusedCount} unused suggestions`);
      
      if (unusedCount > 0) {
        // Trigger suggestion prioritization every minute if we have unused suggestions
        console.log(`🔥 Explicitly prioritizing suggestions for upcoming battles`);
        document.dispatchEvent(new Event('prioritizeSuggestions'));
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(checkInterval);
  }, [pokemonList]);

  return {
    suggestRanking,
    removeSuggestion,
    clearAllSuggestions,
    loadSavedSuggestions,
    markSuggestionUsed,     
    findNextSuggestion,     
    activeSuggestions: activeSuggestionsRef.current
  };
};
