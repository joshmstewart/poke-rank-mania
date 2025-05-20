
import { useState, useEffect } from "react";
import { PokemonFormType } from "@/components/settings/FormFiltersSelector";

interface FormFilters {
  mega: boolean;
  regional: boolean;
  gender: boolean;
  forms: boolean;
}

// Retrieve filters from localStorage or use defaults (all enabled)
const getStoredFilters = (): FormFilters => {
  const stored = localStorage.getItem('pokemon-form-filters');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Error parsing stored form filters:", e);
    }
  }
  
  // Default to all forms enabled
  return {
    mega: true,
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
  
  // Return the filter state and functions
  return {
    filters,
    toggleFilter,
    isAllEnabled,
    toggleAll,
    // Helper function to check if a Pokemon should be included based on current filters
    shouldIncludePokemon: (pokemon: { name: string, id: number }) => {
      // This is a simple implementation - in a real app, you'd want to check the actual Pokemon data
      // to determine its form type more accurately
      const name = pokemon.name.toLowerCase();
      
      // Check for mega evolutions
      if (name.includes("mega") && !filters.mega) {
        return false;
      }
      
      // Check for regional variants (e.g., alolan, galarian)
      if ((name.includes("alolan") || name.includes("galarian") || name.includes("hisuian")) && !filters.regional) {
        return false;
      }
      
      // Check for gender differences
      if ((name.includes("female") || name.includes("male")) && !filters.gender) {
        return false;
      }
      
      // Check for special forms
      if ((name.includes("form") || name.includes("style") || name.includes("mode") || 
           name.includes("size") || name.includes("cloak")) && !filters.forms) {
        return false;
      }
      
      return true;
    }
  };
};
