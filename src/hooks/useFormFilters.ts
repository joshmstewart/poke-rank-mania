
import { useState, useEffect } from "react";
import { PokemonFormType } from "@/components/settings/FormFiltersSelector";
import { Pokemon } from "@/services/pokemon";

interface FormFilters {
  mega: boolean;
  regional: boolean;
  gender: boolean;
  forms: boolean;
}

// Retrieve filters from localStorage or use defaults (mega disabled, others enabled)
const getStoredFilters = (): FormFilters => {
  const stored = localStorage.getItem('pokemon-form-filters');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Error parsing stored form filters:", e);
    }
  }
  
  // Default to mega evolutions disabled, others enabled
  return {
    mega: false,
    regional: true,
    gender: true,
    forms: true
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
      mega: newValue,
      regional: newValue,
      gender: newValue,
      forms: newValue
    };
    localStorage.setItem('pokemon-form-filters', JSON.stringify(updated));
    setFilters(updated);
  };
  
  // Check if a Pokemon should be included based on current filters
  const shouldIncludePokemon = (pokemon: Pokemon): boolean => {
    // If all filters are enabled, include all Pokemon
    if (isAllEnabled) return true;
    
    const name = pokemon.name.toLowerCase();
    
    // Check for mega evolutions
    if (name.includes("mega") && !filters.mega) {
      return false;
    }
    
    // Check for regional variants (expanded to include paldean variants)
    if ((name.includes("alolan") || 
         name.includes("galarian") || 
         name.includes("hisuian") || 
         name.includes("paldean")) && !filters.regional) {
      return false;
    }
    
    // Check for gender differences (expanded to catch more naming patterns)
    if ((name.includes("female") || 
         name.includes("male") || 
         name.includes("-f") || 
         name.includes("-m")) && !filters.gender) {
      return false;
    }
    
    // Check for special forms (expanded to include more form types)
    if ((name.includes("form") || 
         name.includes("style") || 
         name.includes("mode") || 
         name.includes("size") || 
         name.includes("cloak") ||
         name.includes("rotom-") ||
         name.includes("gmax") ||
         name.includes("primal") ||
         name.includes("forme") ||
         name.includes("origin") ||
         name.includes("unbound") ||
         name.includes("gorging") ||
         name.includes("eternamax") ||
         name.includes("cap") ||
         name.includes("-theme")) && !filters.forms) {
      return false;
    }
    
    // Include this Pokemon by default
    return true;
  };
  
  // Return the filter state and functions
  return {
    filters,
    toggleFilter,
    isAllEnabled,
    toggleAll,
    shouldIncludePokemon
  };
};
