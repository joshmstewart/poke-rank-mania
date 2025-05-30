
import { useState } from "react";
import { Pokemon } from "@/services/pokemon";
import { FormFilters, PokemonFormType } from "./types";
import { getStoredFilters, saveFilters } from "./storage";
import { isStarterPokemon, isTotemPokemon, getPokemonFormCategory } from "./categorization";
import { storePokemon, getStoredPokemon, clearStoredPokemon } from "./excludedStore";

export const useFormFilters = () => {
  const [filters, setFilters] = useState<FormFilters>(getStoredFilters());
  
  // Determine if all filters are enabled
  const isAllEnabled = Object.values(filters).every(Boolean);
  
  // Toggle a specific filter
  const toggleFilter = (filter: PokemonFormType) => {
    setFilters(prev => {
      const updated = { ...prev, [filter]: !prev[filter] };
      saveFilters(updated);
      return updated;
    });
  };
  
  // Toggle all filters on/off
  const toggleAll = () => {
    const newValue = !isAllEnabled;
    const updated = {
      normal: newValue,
      megaGmax: newValue,
      regional: newValue,
      gender: newValue,
      forms: newValue,
      originPrimal: newValue,
      costumes: newValue
    };
    saveFilters(updated);
    setFilters(updated);
  };
  
  // Check if a Pokemon should be included based on current filters
  const shouldIncludePokemon = (pokemon: Pokemon): boolean => {
    // FIRST: Always exclude starter Pokemon regardless of filters
    if (isStarterPokemon(pokemon)) {
      console.log(`🚫 [FORM_FILTER_DEBUG] ${pokemon.name} (${pokemon.id}) EXCLUDED - STARTER POKEMON (always filtered)`);
      return false;
    }
    
    // SECOND: Always exclude totem Pokemon regardless of filters
    if (isTotemPokemon(pokemon)) {
      console.log(`🚫 [FORM_FILTER_DEBUG] ${pokemon.name} (${pokemon.id}) EXCLUDED - TOTEM POKEMON (always filtered)`);
      return false;
    }
    
    // ENHANCED: Additional Cramorant filtering at the form filter level
    if (pokemon.name.toLowerCase().includes('cramorant')) {
      console.log(`🚫 [FORM_FILTER_DEBUG] ${pokemon.name} (${pokemon.id}) EXCLUDED - CRAMORANT FORM (always filtered)`);
      return false;
    }
    
    // If all filters are enabled, include all Pokemon (except starters, totems, and Cramorant)
    if (isAllEnabled) {
      console.log(`🟢 [FORM_FILTER_DEBUG] ${pokemon.name} (${pokemon.id}) INCLUDED - all filters enabled`);
      return true;
    }
    
    const formCategory = getPokemonFormCategory(pokemon);
    
    // If no form category is determined, default to normal
    const categoryToCheck = formCategory || "normal";
    
    // Return true if the filter for this category is enabled
    const shouldInclude = filters[categoryToCheck];
    
    // ENHANCED LOGGING: Show current filter states
    console.log(`🎛️ [FORM_FILTER_STATES] Current filters:`, filters);
    console.log(`${shouldInclude ? '🟢' : '🔴'} [FORM_FILTER_DEBUG] ${pokemon.name} (${pokemon.id}) ${shouldInclude ? 'INCLUDED' : 'EXCLUDED'} - ${categoryToCheck} filter is ${shouldInclude ? 'enabled' : 'disabled'}`);
    return shouldInclude;
  };
  
  // Return the filter state and functions
  return {
    filters,
    toggleFilter,
    isAllEnabled,
    toggleAll,
    shouldIncludePokemon,
    getPokemonFormCategory,
    storePokemon,
    getStoredPokemon,
    clearStoredPokemon
  };
};
