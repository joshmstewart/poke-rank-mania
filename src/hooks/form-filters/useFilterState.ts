
import { useState, useEffect, useCallback } from "react";
import { FormFilters, PokemonFormType } from "./types";
import { getStoredFilters, saveFilters, clearStoredFilters } from "./storage";
import { toast } from "@/hooks/use-toast";

const getFilterName = (filter: PokemonFormType): string => {
  const filterNames: Record<PokemonFormType, string> = {
    normal: "Normal Pokémon",
    megaGmax: "Mega/Gigantamax Forms",
    regional: "Regional Forms",
    gender: "Gender Variants",
    forms: "Alternative Forms",
    originPrimal: "Origin/Primal Forms",
    costumes: "Costume Variants",
    colorsFlavors: "Color/Flavor Forms",
    blocked: "Blocked Pokémon"
  };
  return filterNames[filter];
};

export const useFilterState = () => {
  // CRITICAL FIX: Force immediate synchronous initialization
  const [filters, setFilters] = useState<FormFilters>(() => {
    // Clear any potentially corrupted data first
    const allKeys = Object.keys(localStorage);
    const corruptedKeys = allKeys.filter(key => 
      key.startsWith('pokemon-form-filters') && 
      key !== 'pokemon-form-filters'
    );
    corruptedKeys.forEach(key => {
      console.log(`🧹 [FORM_FILTERS_CORRUPTION_FIX] Removing corrupted key: ${key}`);
      localStorage.removeItem(key);
    });
    
    const storedFilters = getStoredFilters();
    console.log('🧹 [FORM_FILTERS_DETERMINISTIC_INIT] DETERMINISTIC initialization with filters:', storedFilters);
    return storedFilters;
  });
  
  // CRITICAL FIX: Ensure filters are always properly set on mount
  useEffect(() => {
    const currentFilters = getStoredFilters();
    console.log('🧹 [FORM_FILTERS_MOUNT_SYNC] Syncing filters on mount:', currentFilters);
    setFilters(currentFilters);
  }, []);
  
  // Determine if all filters are enabled
  const isAllEnabled = Object.values(filters).every(Boolean);
  
  // Toggle a specific filter
  const toggleFilter = useCallback((filter: PokemonFormType) => {
    setFilters(prev => {
      const updated = { ...prev, [filter]: !prev[filter] };
      console.log(`🧹 [FORM_FILTERS_TOGGLE] Toggling ${filter}: ${prev[filter]} -> ${updated[filter]}`);
      saveFilters(updated);
      return updated;
    });
    
    // Show toast with appropriate message
    toast({
      title: `${filters[filter] ? "Disabled" : "Enabled"} ${getFilterName(filter)}`,
      description: filters[filter] 
        ? `${getFilterName(filter)} will no longer appear in battles`
        : `${getFilterName(filter)} will now be included in battles`,
    });
  }, [filters]);
  
  // Toggle all filters on/off
  const toggleAll = useCallback(() => {
    const newValue = !isAllEnabled;
    const updated = {
      normal: newValue,
      megaGmax: newValue,
      regional: newValue,
      gender: newValue,
      forms: newValue,
      originPrimal: newValue,
      costumes: newValue,
      colorsFlavors: newValue,
      blocked: newValue
    };
    console.log(`🧹 [FORM_FILTERS_TOGGLE_ALL] Setting all filters to: ${newValue}`);
    saveFilters(updated);
    setFilters(updated);
    
    toast({
      title: isAllEnabled ? "Disabled some Pokémon forms" : "Enabled all Pokémon forms",
      description: isAllEnabled 
        ? "Only standard forms will appear in battles"
        : "All Pokémon forms will be included in battles",
    });
  }, [isAllEnabled]);

  // Reset filters to default (all enabled)
  const resetFilters = useCallback(() => {
    clearStoredFilters();
    const defaultFilters = {
      normal: true,
      megaGmax: true,
      regional: true,
      gender: true,
      forms: true,
      originPrimal: true,
      costumes: true,
      colorsFlavors: true,
      blocked: false // Default blocked to false
    };
    console.log('🧹 [FORM_FILTERS_RESET] Resetting to default filters');
    saveFilters(defaultFilters);
    setFilters(defaultFilters);
  }, []);

  return {
    filters,
    isAllEnabled,
    toggleFilter,
    toggleAll,
    resetFilters
  };
};
