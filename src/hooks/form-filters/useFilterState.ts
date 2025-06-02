
import { useState, useEffect, useCallback } from "react";
import { FormFilters, PokemonFormType } from "./types";
import { getStoredFilters, saveFilters, clearStoredFilters } from "./storage";
import { toast } from "@/hooks/use-toast";
import { useTrueSkillStore } from "@/stores/trueskillStore";

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
  const { syncToCloud, getFormFilters, setFormFilters } = useTrueSkillStore();
  
  // CRITICAL FIX: Initialize with cloud data if available, fallback to localStorage
  const [filters, setFilters] = useState<FormFilters>(() => {
    // Try cloud data first
    const cloudFilters = getFormFilters();
    if (cloudFilters && Object.keys(cloudFilters).length > 0) {
      console.log('🌥️ [FORM_FILTERS_CLOUD] Initializing with cloud filters:', cloudFilters);
      return cloudFilters;
    }
    
    // Fallback to localStorage
    const storedFilters = getStoredFilters();
    console.log('🧹 [FORM_FILTERS_LOCAL] Initializing with localStorage filters:', storedFilters);
    return storedFilters;
  });
  
  // Load from cloud on mount
  useEffect(() => {
    const cloudFilters = getFormFilters();
    if (cloudFilters && Object.keys(cloudFilters).length > 0) {
      console.log('🌥️ [FORM_FILTERS_CLOUD] Loading filters from cloud on mount:', cloudFilters);
      setFilters(cloudFilters);
      // Also save to localStorage for offline access
      saveFilters(cloudFilters);
    }
  }, [getFormFilters]);
  
  // Determine if all filters are enabled
  const isAllEnabled = Object.values(filters).every(Boolean);
  
  // Save filters to both cloud and localStorage
  const saveFiltersToCloud = useCallback(async (newFilters: FormFilters) => {
    console.log('🌥️ [FORM_FILTERS_CLOUD] Saving filters to cloud:', newFilters);
    
    // Save to cloud via TrueSkill store
    setFormFilters(newFilters);
    
    // Also save to localStorage for offline access
    saveFilters(newFilters);
    
    // Sync to cloud
    await syncToCloud();
    
    console.log('🌥️ [FORM_FILTERS_CLOUD] Filters saved and synced to cloud');
  }, [setFormFilters, syncToCloud]);
  
  // Toggle a specific filter
  const toggleFilter = useCallback((filter: PokemonFormType) => {
    setFilters(prev => {
      const updated = { ...prev, [filter]: !prev[filter] };
      console.log(`🧹 [FORM_FILTERS_TOGGLE] Toggling ${filter}: ${prev[filter]} -> ${updated[filter]}`);
      
      // Save to cloud
      saveFiltersToCloud(updated);
      
      return updated;
    });
    
    // Show toast with appropriate message
    toast({
      title: `${filters[filter] ? "Disabled" : "Enabled"} ${getFilterName(filter)}`,
      description: filters[filter] 
        ? `${getFilterName(filter)} will no longer appear in battles`
        : `${getFilterName(filter)} will now be included in battles`,
    });
  }, [filters, saveFiltersToCloud]);
  
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
    
    setFilters(updated);
    saveFiltersToCloud(updated);
    
    toast({
      title: isAllEnabled ? "Disabled some Pokémon forms" : "Enabled all Pokémon forms",
      description: isAllEnabled 
        ? "Only standard forms will appear in battles"
        : "All Pokémon forms will be included in battles",
    });
  }, [isAllEnabled, saveFiltersToCloud]);

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
    
    setFilters(defaultFilters);
    saveFiltersToCloud(defaultFilters);
  }, [saveFiltersToCloud]);

  return {
    filters,
    isAllEnabled,
    toggleFilter,
    toggleAll,
    resetFilters
  };
};
