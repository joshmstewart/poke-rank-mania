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

  const markSuggestionUsed = useCallback((pokemon: RankedPokemon, fullyUsed: boolean = false) => {
    console.log(`[DEBUG useRankingSuggestions - markSuggestionUsed ENTRY] Called for ${pokemon.name} (${pokemon.id}). fullyUsed: ${fullyUsed}. Current suggestion from activeSuggestionsRef:`, JSON.stringify(activeSuggestionsRef.current.get(pokemon.id)));
    
    const suggestion = activeSuggestionsRef.current.get(pokemon.id);
    if (suggestion) {
      // Only set to true if fullyUsed is true
      if (fullyUsed) {
        suggestion.used = true;
        console.log(`[DEBUG useRankingSuggestions - markSuggestionUsed] 'fullyUsed' is true. Set suggestion.used = true for ${pokemon.name} (${pokemon.id}) in activeSuggestionsRef.`);
        console.log(`💾 Suggestion for ${pokemon.name} (${pokemon.id}) marked as fully used.`);
      } else {
        // If not fullyUsed, ensure 'used' remains false for continued selection
        console.log(`[DEBUG useRankingSuggestions - markSuggestionUsed] 'fullyUsed' is false. NOT setting suggestion.used = true for ${pokemon.name} (${pokemon.id}) in activeSuggestionsRef here.`);
        console.log(`ℹ️ Suggestion for ${pokemon.name} (${pokemon.id}) participated in a battle. Usage count managed by createBattleStarter.`);
      }

      activeSuggestionsRef.current.set(pokemon.id, { ...suggestion });
      setPokemonList(curr => curr.map(p => 
        p.id === pokemon.id ? { ...p, suggestedAdjustment: { ...suggestion } } : p
      ));
      saveSuggestions();
      
      console.log(`[DEBUG useRankingSuggestions - markSuggestionUsed EXIT] After potential updates for ${pokemon.name} (${pokemon.id}). Updated suggestion in activeSuggestionsRef:`, JSON.stringify(activeSuggestionsRef.current.get(pokemon.id)));

      toast({
        title: `Refined match for ${pokemon.name}`,
        description: `${suggestion.direction === "up" ? "↑" : "↓"} Rating updated! ${fullyUsed ? "" : "(Suggestion active)"}`,
        duration: 3000
      });
    }
  }, [setPokemonList, saveSuggestions]);

  const findNextSuggestion = useCallback(() => {
    return pokemonList.find(p => p.suggestedAdjustment && !p.suggestedAdjustment.used);
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
