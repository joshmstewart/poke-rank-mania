
import { useState, useCallback, useEffect, useRef } from "react";
import { RankedPokemon, RankingSuggestion } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";

const STORAGE_KEY = 'pokemon-active-suggestions';

export const useRankingSuggestions = (
  pokemonList: RankedPokemon[],
  setPokemonList: React.Dispatch<React.SetStateAction<RankedPokemon[]>>
) => {
  const activeSuggestionsRef = useRef<Map<number, RankingSuggestion>>(new Map());

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
  }, [loadSavedSuggestions]);

const suggestRanking = useCallback((pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => {
  const suggestion = { direction, strength, used: false };
  activeSuggestionsRef.current.set(pokemon.id, suggestion);
  setPokemonList(curr => curr.map(p => p.id === pokemon.id ? { ...p, suggestedAdjustment: suggestion } : p));
  console.log(`💾 suggestRanking: Suggestion CREATED for Pokémon ${pokemon.name} (${pokemon.id})`, suggestion);
  saveSuggestions();
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
  }, [setPokemonList]);

// ✅ Step 2: Ensure explicit marking of suggestions as used
const markSuggestionUsed = useCallback((pokemon: RankedPokemon) => {
  const suggestion = activeSuggestionsRef.current.get(pokemon.id);
  if (suggestion) {
    // Explicitly mark the suggestion as used
    suggestion.used = true;
    activeSuggestionsRef.current.set(pokemon.id, suggestion);
    
    // Update the Pokemon list with the used suggestion
    setPokemonList(curr => curr.map(p => 
      p.id === pokemon.id ? { ...p, suggestedAdjustment: { ...suggestion } } : p
    ));
    
    // Save to localStorage immediately
    saveSuggestions();
    
    console.log(`🎯 Explicitly marked suggestion as USED for Pokémon #${pokemon.id} (${pokemon.name})`);
    
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
