import { useState, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { FormFilters, PokemonFormType } from "./types";
import { getStoredFilters, saveFilters, clearStoredFilters } from "./storage";
import { 
  isStarterPokemon, 
  isTotemPokemon, 
  isSizeVariantPokemon, 
  isSpecialKoraidonMiraidonMode,
  getPokemonFormCategory,
  getMiscategorizedExamples,
  logCategoryStats
} from "./categorization";
import { storePokemon, getStoredPokemon, clearStoredPokemon } from "./excludedStore";

export const useFormFilters = () => {
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
  const toggleFilter = (filter: PokemonFormType) => {
    setFilters(prev => {
      const updated = { ...prev, [filter]: !prev[filter] };
      console.log(`🧹 [FORM_FILTERS_TOGGLE] Toggling ${filter}: ${prev[filter]} -> ${updated[filter]}`);
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
      costumes: newValue,
      colorsFlavors: newValue
    };
    console.log(`🧹 [FORM_FILTERS_TOGGLE_ALL] Setting all filters to: ${newValue}`);
    saveFilters(updated);
    setFilters(updated);
  };

  // Reset filters to default (all enabled)
  const resetFilters = () => {
    clearStoredFilters();
    const defaultFilters = {
      normal: true,
      megaGmax: true,
      regional: true,
      gender: true,
      forms: true,
      originPrimal: true,
      costumes: true,
      colorsFlavors: true
    };
    console.log('🧹 [FORM_FILTERS_RESET] Resetting to default filters');
    saveFilters(defaultFilters);
    setFilters(defaultFilters);
  };
  
  // CRITICAL FIX: Completely deterministic Pokemon filtering
  const shouldIncludePokemon = (pokemon: Pokemon): boolean => {
    const pokemonId = pokemon.id;
    const pokemonName = pokemon.name.toLowerCase();
    
    // FIRST: Always exclude starter Pokemon regardless of filters
    if (isStarterPokemon(pokemon)) {
      return false;
    }
    
    // SECOND: Always exclude totem Pokemon regardless of filters
    if (isTotemPokemon(pokemon)) {
      return false;
    }
    
    // THIRD: Always exclude size variant Pokemon (Pumpkaboo/Gourgeist sizes)
    if (isSizeVariantPokemon(pokemon)) {
      return false;
    }
    
    // FOURTH: Always exclude special Koraidon/Miraidon modes
    if (isSpecialKoraidonMiraidonMode(pokemon)) {
      return false;
    }
    
    // FIFTH: Always exclude meteor Minior forms
    if (pokemonName.includes('minior') && pokemonName.includes('meteor')) {
      return false;
    }
    
    // Enhanced Cramorant filtering at the form filter level
    if (pokemonName.includes('cramorant') && pokemonName !== 'cramorant') {
      return false;
    }
    
    // If all filters are enabled, include all Pokemon (except the exclusions above)
    if (isAllEnabled) {
      return true;
    }
    
    const formCategory = getPokemonFormCategory(pokemon);
    
    // If no form category is determined, default to normal
    const categoryToCheck = formCategory || "normal";
    
    // Return true if the filter for this category is enabled
    return filters[categoryToCheck];
  };

  // CRITICAL FIX: Deterministic filtering pipeline with consistent ordering
  const analyzeFilteringPipeline = (inputPokemon: Pokemon[]): Pokemon[] => {
    console.log(`🔍 [DETERMINISTIC_FILTER_PIPELINE] ===== STARTING DETERMINISTIC FILTER ANALYSIS =====`);
    console.log(`🔍 [DETERMINISTIC_FILTER_PIPELINE] Input Pokemon count: ${inputPokemon.length}`);
    console.log(`🔍 [DETERMINISTIC_FILTER_PIPELINE] Current filter states:`, filters);
    console.log(`🔍 [DETERMINISTIC_FILTER_PIPELINE] All filters enabled: ${isAllEnabled}`);
    
    // CRITICAL: Sort input by ID for absolute determinism
    const sortedInput = [...inputPokemon].sort((a, b) => a.id - b.id);
    console.log(`🔍 [DETERMINISTIC_FILTER_PIPELINE] Sorted input by ID for determinism`);
    
    // Apply filtering deterministically
    const filteredPokemon = sortedInput.filter(shouldIncludePokemon);
    
    console.log(`🔍 [DETERMINISTIC_FILTER_PIPELINE] Output Pokemon count: ${filteredPokemon.length}`);
    console.log(`🔍 [DETERMINISTIC_FILTER_PIPELINE] Filtered out: ${sortedInput.length - filteredPokemon.length}`);
    
    // NEW: Log categorization stats and examples
    logCategoryStats();
    
    // Verify output is still sorted
    const outputIds = filteredPokemon.map(p => p.id);
    const isSorted = outputIds.every((id, i) => i === 0 || id >= outputIds[i - 1]);
    console.log(`🔍 [DETERMINISTIC_FILTER_PIPELINE] Output still sorted by ID: ${isSorted}`);
    
    console.log(`🔍 [DETERMINISTIC_FILTER_PIPELINE] ===== DETERMINISTIC FILTER ANALYSIS COMPLETE =====`);
    
    return filteredPokemon;
  };
  
  // NEW: Function to get miscategorized examples for debugging
  const getMiscategorizedPokemonExamples = () => {
    return getMiscategorizedExamples();
  };
  
  // Return the filter state and functions
  return {
    filters,
    toggleFilter,
    isAllEnabled,
    toggleAll,
    resetFilters,
    shouldIncludePokemon,
    analyzeFilteringPipeline,
    getPokemonFormCategory,
    getMiscategorizedPokemonExamples,
    storePokemon,
    getStoredPokemon,
    clearStoredPokemon
  };
};
