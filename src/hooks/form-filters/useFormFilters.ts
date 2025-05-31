
import { useState } from "react";
import { Pokemon } from "@/services/pokemon";
import { FormFilters, PokemonFormType } from "./types";
import { getStoredFilters, saveFilters } from "./storage";
import { isStarterPokemon, isTotemPokemon, isSizeVariantPokemon, getPokemonFormCategory } from "./categorization";
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
    // ENHANCED DEBUG: Track what's being filtered and why
    const pokemonId = pokemon.id;
    const pokemonName = pokemon.name;
    
    // FIRST: Always exclude starter Pokemon regardless of filters
    if (isStarterPokemon(pokemon)) {
      console.log(`🚫 [FORM_FILTER_TRACE] ${pokemonName} (${pokemonId}) EXCLUDED - STARTER POKEMON`);
      return false;
    }
    
    // SECOND: Always exclude totem Pokemon regardless of filters
    if (isTotemPokemon(pokemon)) {
      console.log(`🚫 [FORM_FILTER_TRACE] ${pokemonName} (${pokemonId}) EXCLUDED - TOTEM POKEMON`);
      return false;
    }
    
    // THIRD: Always exclude size variant Pokemon (Pumpkaboo/Gourgeist sizes)
    if (isSizeVariantPokemon(pokemon)) {
      console.log(`🚫 [FORM_FILTER_TRACE] ${pokemonName} (${pokemonId}) EXCLUDED - SIZE VARIANT`);
      return false;
    }
    
    // ENHANCED: Additional Cramorant filtering at the form filter level
    if (pokemon.name.toLowerCase().includes('cramorant')) {
      console.log(`🚫 [FORM_FILTER_TRACE] ${pokemonName} (${pokemonId}) EXCLUDED - CRAMORANT FORM`);
      return false;
    }
    
    // If all filters are enabled, include all Pokemon (except the exclusions above)
    if (isAllEnabled) {
      console.log(`✅ [FORM_FILTER_TRACE] ${pokemonName} (${pokemonId}) INCLUDED - all filters enabled`);
      return true;
    }
    
    const formCategory = getPokemonFormCategory(pokemon);
    
    // If no form category is determined, default to normal
    const categoryToCheck = formCategory || "normal";
    
    // Return true if the filter for this category is enabled
    const shouldInclude = filters[categoryToCheck];
    
    // CRITICAL DEBUG: Log every single Pokemon decision with ID ranges
    const idRange = pokemonId <= 151 ? "Gen1" : 
                   pokemonId <= 251 ? "Gen2" : 
                   pokemonId <= 386 ? "Gen3" : 
                   pokemonId <= 493 ? "Gen4" : 
                   pokemonId <= 649 ? "Gen5" : 
                   pokemonId <= 721 ? "Gen6" : 
                   pokemonId <= 809 ? "Gen7" : 
                   pokemonId <= 905 ? "Gen8" : 
                   pokemonId <= 1025 ? "Gen9" : "Special";
    
    console.log(`${shouldInclude ? '✅' : '🚫'} [FORM_FILTER_TRACE] ${pokemonName} (${pokemonId}) [${idRange}] ${shouldInclude ? 'INCLUDED' : 'EXCLUDED'} - Category: ${categoryToCheck}, Filter: ${shouldInclude ? 'ON' : 'OFF'}`);
    
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
