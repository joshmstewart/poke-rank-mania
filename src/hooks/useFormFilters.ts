
import { useState, useEffect } from "react";
import { PokemonFormType } from "@/components/settings/FormFiltersSelector";
import { Pokemon } from "@/services/pokemon";

interface FormFilters {
  megaGmax: boolean;
  regional: boolean;
  gender: boolean;
  forms: boolean;
  originPrimal: boolean;
  costumes: boolean;
}

// Store for tracking "excluded" pokemon that were previously in battles
const excludedPokemonStore = new Map<number, Pokemon>();

// Retrieve filters from localStorage or use defaults (mega/gmax disabled, others enabled)
const getStoredFilters = (): FormFilters => {
  const stored = localStorage.getItem('pokemon-form-filters');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Error parsing stored form filters:", e);
    }
  }
  
  // Default to mega/gmax evolutions disabled, others enabled
  return {
    megaGmax: false,
    regional: true,
    gender: true,
    forms: true,
    originPrimal: true,
    costumes: true
  };
};

export const useFormFilters = () => {
  const [filters, setFilters] = useState<FormFilters>(getStoredFilters());
  
  // Determine if all filters are enabled
  const isAllEnabled = Object.values(filters).every(Boolean);
  
  // Toggle a specific filter
  const toggleFilter = (filter: PokemonFormType) => {
    setFilters(prev => {
      const updated = { ...prev, [filter]: !prev[filter] };
      localStorage.setItem('pokemon-form-filters', JSON.stringify(updated));
      return updated;
    });
  };
  
  // Toggle all filters on/off
  const toggleAll = () => {
    const newValue = !isAllEnabled;
    const updated = {
      megaGmax: newValue,
      regional: newValue,
      gender: newValue,
      forms: newValue,
      originPrimal: newValue,
      costumes: newValue
    };
    localStorage.setItem('pokemon-form-filters', JSON.stringify(updated));
    setFilters(updated);
  };
  
  // Check if a Pokemon belongs to a specific form category
  const getPokemonFormCategory = (pokemon: Pokemon): PokemonFormType | null => {
    const name = pokemon.name.toLowerCase();
    
    // Check for costumes (Pikachu caps and cosplay forms) - check this FIRST
    // Expanded pattern to catch all costume Pikachu variants
    if (name.includes("pikachu") && (
        name.includes("cap") || 
        name.includes("phd") || 
        name.includes("cosplay") || 
        name.includes("belle") || 
        name.includes("libre") || 
        name.includes("pop-star") || 
        name.includes("rock-star") ||
        name.includes("partner"))) {
      return "costumes";
    }
    
    // Check for Origin and Primal forms (AFTER costumes) - make more strict
    if ((name.includes("origin") && !name.includes("pikachu")) || 
        (name.includes("primal") && !name.includes("pikachu"))) {
      return "originPrimal";
    }
    
    // Check for mega evolutions and gigantamax forms (combined)
    if (name.includes("mega") || name.includes("gmax")) {
      return "megaGmax";
    }
    
    // Check for regional variants (expanded to include paldean variants)
    if (name.includes("alolan") || 
        name.includes("galarian") || 
        name.includes("hisuian") || 
        name.includes("paldean")) {
      return "regional";
    }
    
    // Check for gender differences (updated to standardize naming)
    // Looking for female or male indicators in the name
    if (name.includes("female") || 
        name.includes("male") || 
        name.includes("-f") || 
        name.includes("-m")) {
      return "gender";
    }
    
    // Check for special forms (expanded to include more form types, but excluding what's now in other categories)
    if (name.includes("form") || 
        name.includes("style") || 
        name.includes("mode") || 
        name.includes("size") || 
        name.includes("cloak") ||
        name.includes("rotom-") ||
        name.includes("forme") ||
        name.includes("unbound") ||
        name.includes("gorging") ||
        name.includes("eternamax") ||
        name.includes("-theme")) {
      return "forms";
    }
    
    return null;
  };
  
  // Check if a Pokemon should be included based on current filters
  const shouldIncludePokemon = (pokemon: Pokemon): boolean => {
    // If all filters are enabled, include all Pokemon
    if (isAllEnabled) return true;
    
    const formCategory = getPokemonFormCategory(pokemon);
    
    // If it's a standard Pokemon (not in any special form category)
    if (!formCategory) return true;
    
    // Return true if the filter for this category is enabled
    return filters[formCategory];
  };
  
  // Store a Pokemon that gets filtered out (for later re-inclusion)
  const storePokemon = (pokemon: Pokemon) => {
    excludedPokemonStore.set(pokemon.id, pokemon);
  };
  
  // Get previously stored Pokemon when a filter is re-enabled
  const getStoredPokemon = (): Pokemon[] => {
    return Array.from(excludedPokemonStore.values());
  };
  
  // Clear stored Pokemon (useful when resetting)
  const clearStoredPokemon = () => {
    excludedPokemonStore.clear();
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
