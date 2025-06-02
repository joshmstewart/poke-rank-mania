
import { useState, useEffect, useCallback } from "react";
import { FormFilters, PokemonFormType } from "./types";
import { getStoredFilters, saveFilters, clearStoredFilters } from "./storage";
import { toast } from "@/hooks/use-toast";
import { useCloudPreferences } from "@/hooks/useCloudPreferences";

const getFilterName = (filter: PokemonFormType): string => {
  const filterNames: Record<PokemonFormType, string> = {
    normal: "Normal Pokémon",
    megaGmax: "Mega/Gigantamax Forms",
    regional: "Regional Variants",
    gender: "Gender Differences",
    forms: "Special Forms",
    originPrimal: "Origin/Primal Forms",
    costumes: "Costume Pokémon",
    colorsFlavors: "Colors",
    blocked: "Blocked Pokémon"
  };
  return filterNames[filter];
};

export const useFilterState = () => {
  const { formFilters, updateFormFilters, isInitialized } = useCloudPreferences();
  const [filters, setFilters] = useState<FormFilters>(formFilters);
  
  // Update local state when cloud preferences change
  useEffect(() => {
    if (isInitialized) {
      console.log('🌥️ [FORM_FILTERS_CLOUD] Cloud preferences initialized, updating filters:', formFilters);
      setFilters(formFilters);
    }
  }, [formFilters, isInitialized]);
  
  // Determine if all filters are enabled
  const isAllEnabled = Object.values(filters).every(Boolean);
  
  // Save filters to cloud
  const saveFiltersToCloud = useCallback(async (newFilters: FormFilters) => {
    console.log('🌥️ [FORM_FILTERS_CLOUD] Saving filters to cloud:', newFilters);
    await updateFormFilters(newFilters);
  }, [updateFormFilters]);
  
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

  // Reset filters to default
  const resetFilters = useCallback(() => {
    clearStoredFilters();
    const defaultFilters = {
      normal: true,        
      megaGmax: false,     
      regional: true,      
      gender: true,        
      forms: true,         
      originPrimal: false, 
      costumes: false,     
      colorsFlavors: false, 
      blocked: false       
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
