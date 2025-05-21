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
  }, []);

  const loadSavedSuggestions = useCallback(() => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed: Record<number, RankingSuggestion> = JSON.parse(data);
      activeSuggestionsRef.current = new Map(Object.entries(parsed).map(([k, v]) => [Number(k), v]));
      setPokemonList(current =>
        current.map(p => ({
          ...p,
          suggestedAdjustment: activeSuggestionsRef.current.get(p.id)
        }))
      );
    }
  }, [setPokemonList]);

  useEffect(() => {
    loadSavedSuggestions();
  }, [loadSavedSuggestions]);

  const suggestRanking = useCallback((pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => {
    const suggestion = { direction, strength, used: false };
    activeSuggestionsRef.current.set(pokemon.id, suggestion);
    setPokemonList(curr => curr.map(p => p.id === pokemon.id ? { ...p, suggestedAdjustment: suggestion } : p));
    saveSuggestions();
  }, [saveSuggestions, setPokemonList]);

  const removeSuggestion = useCallback((pokemonId: number) => {
    activeSuggestionsRef.current.delete(pokemonId);
    setPokemonList(curr => curr.map(p => p.id === pokemonId ? { ...p, suggestedAdjustment: undefined } : p));
    saveSuggestions();
  }, [saveSuggestions, setPokemonList]);

  const clearAllSuggestions = useCallback(() => {
    activeSuggestionsRef.current.clear();
    setPokemonList(curr => curr.map(p => ({ ...p, suggestedAdjustment: undefined })));
    localStorage.removeItem(STORAGE_KEY);
  }, [setPokemonList]);

  return {
    suggestRanking,
    removeSuggestion,
    clearAllSuggestions,
    loadSavedSuggestions,
    activeSuggestions: activeSuggestionsRef.current
  };
};
