
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
    console.log("⚙️ SAVING updated suggestions back to localStorage explicitly. Count:", activeSuggestionsRef.current.size);

    const obj: Record<string, RankingSuggestion> = {};
    activeSuggestionsRef.current.forEach((v, k) => (obj[k] = v));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    console.log(`💾 saveSuggestions: Saved ${Object.keys(obj).length} suggestions to localStorage`, obj);
  }, []);

  const loadSavedSuggestions = useCallback(() => {
    console.log("💾 LOADING suggestions from localStorage explicitly:", localStorage.getItem(STORAGE_KEY));

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
    console.log("✅ APPLYING suggestion adjustments explicitly. Pokémon ID applied:", pokemon.id, "Direction:", direction, "Strength:", strength);

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
    console.log("🧹 Cleared ALL suggestions and removed from localStorage");
  }, [setPokemonList]);

  const markSuggestionUsed = useCallback((pokemon: RankedPokemon, fullyUsed: boolean = true) => {
    console.log(`[DEBUG useRankingSuggestions - markSuggestionUsed ENTRY] Called for ${pokemon.name} (${pokemon.id}). fullyUsed: ${fullyUsed}. Current suggestion from activeSuggestionsRef:`, JSON.stringify(activeSuggestionsRef.current.get(pokemon.id)));
    
    const suggestion = activeSuggestionsRef.current.get(pokemon.id);
    if (suggestion) {
      // Always remove the suggestion completely after it's used
      // This allows for new suggestions on this Pokémon in the future
      activeSuggestionsRef.current.delete(pokemon.id);
      console.log(`[DEBUG useRankingSuggestions - markSuggestionUsed] 'fullyUsed' is true. REMOVING suggestion for ${pokemon.name} (${pokemon.id}) from activeSuggestionsRef.`);
      console.log(`💾 Suggestion for ${pokemon.name} (${pokemon.id}) fully used and removed to allow new suggestions.`);
      
      setPokemonList(curr => curr.map(p => 
        p.id === pokemon.id ? { ...p, suggestedAdjustment: undefined } : p
      ));
      
      saveSuggestions();
      
      console.log(`[DEBUG useRankingSuggestions - markSuggestionUsed EXIT] After updates for ${pokemon.name} (${pokemon.id}). Updated suggestion in activeSuggestionsRef:`, JSON.stringify(activeSuggestionsRef.current.get(pokemon.id)));

      toast({
        title: `Refined match for ${pokemon.name}`,
        description: `${suggestion.direction === "up" ? "↑" : "↓"} Rating updated! Ready for new suggestions.`,
        duration: 3000
      });
    }
  }, [setPokemonList, saveSuggestions]);

  const findNextSuggestion = useCallback(() => {
    return pokemonList.find(p => p.suggestedAdjustment);
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
