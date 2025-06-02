
import { useState, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { FormFilters, PokemonFormType } from "./types";
import { getStoredFilters, saveFilters, clearStoredFilters } from "./storage";
import { 
  isStarterVariant, 
  isTotemPokemon, 
  isSizeVariantPokemon, 
  isSpecialKoraidonMiraidonMode,
  getPokemonFormCategory,
  getMiscategorizedExamples,
  logCategoryStats,
  trackFilteredPokemon,
  getNormalPokemonStats,
  resetNormalPokemonTracking
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
      colorsFlavors: newValue,
      blocked: newValue
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
      colorsFlavors: true,
      blocked: false // Default blocked to false
    };
    console.log('🧹 [FORM_FILTERS_RESET] Resetting to default filters');
    saveFilters(defaultFilters);
    setFilters(defaultFilters);
  };
  
  // CRITICAL FIX: Updated Pokemon filtering - blocked Pokemon are now categorized but can be toggled
  const shouldIncludePokemon = (pokemon: Pokemon): boolean => {
    const pokemonId = pokemon.id;
    const pokemonName = pokemon.name.toLowerCase();
    
    // If all filters are enabled, include all Pokemon (including blocked if that filter is enabled)
    if (isAllEnabled) {
      console.log(`✅ [FILTER_DEBUG] Pokemon ${pokemonId} "${pokemon.name}" included - all filters enabled`);
      return true;
    }
    
    const formCategory = getPokemonFormCategory(pokemon);
    
    // If no form category is determined, default to normal
    const categoryToCheck = formCategory || "normal";
    
    // Check if the filter for this category is enabled
    const shouldInclude = filters[categoryToCheck];
    
    // Track filtered Pokemon for debugging
    trackFilteredPokemon(pokemon, !shouldInclude, `Filter for category "${categoryToCheck}" is disabled`);
    
    console.log(`🔍 [FILTER_DEBUG] Pokemon ${pokemonId} "${pokemon.name}" category: ${categoryToCheck}, filter enabled: ${filters[categoryToCheck]}, included: ${shouldInclude}`);
    
    return shouldInclude;
  };

  // CRITICAL FIX: Deterministic filtering pipeline with comprehensive tracking
  const analyzeFilteringPipeline = (inputPokemon: Pokemon[]): Pokemon[] => {
    console.log(`🔍 [DETERMINISTIC_FILTER_PIPELINE] ===== STARTING DETERMINISTIC FILTER ANALYSIS =====`);
    console.log(`🔍 [DETERMINISTIC_FILTER_PIPELINE] Input Pokemon count: ${inputPokemon.length}`);
    console.log(`🔍 [DETERMINISTIC_FILTER_PIPELINE] Current filter states:`, filters);
    console.log(`🔍 [DETERMINISTIC_FILTER_PIPELINE] All filters enabled: ${isAllEnabled}`);
    
    // Reset tracking for this analysis
    resetNormalPokemonTracking();
    
    // CRITICAL: Sort input by ID for absolute determinism
    const sortedInput = [...inputPokemon].sort((a, b) => a.id - b.id);
    console.log(`🔍 [DETERMINISTIC_FILTER_PIPELINE] Sorted input by ID for determinism`);
    
    // Apply filtering deterministically with detailed tracking
    const filteredPokemon = sortedInput.filter((pokemon, index) => {
      const shouldInclude = shouldIncludePokemon(pokemon);
      if (index < 10 || !shouldInclude) {
        console.log(`🔍 [FILTER_SAMPLE] Pokemon ${pokemon.id} "${pokemon.name}" -> included: ${shouldInclude}`);
      }
      return shouldInclude;
    });
    
    console.log(`🔍 [DETERMINISTIC_FILTER_PIPELINE] Output Pokemon count: ${filteredPokemon.length}`);
    console.log(`🔍 [DETERMINISTIC_FILTER_PIPELINE] Filtered out: ${sortedInput.length - filteredPokemon.length}`);
    
    // Get detailed normal Pokemon stats
    const normalStats = getNormalPokemonStats();
    console.log(`📊 [NORMAL_POKEMON_STATS] Tracked: ${normalStats.tracked}, Filtered out: ${normalStats.filteredOut}, Remaining: ${normalStats.remaining}`);
    
    if (normalStats.filteredOut > 0) {
      console.log(`❌ [MISSING_NORMAL_POKEMON] ${normalStats.filteredOut} normal Pokemon were filtered out!`);
      console.log(`❌ [FILTERED_OUT_IDS] IDs: ${normalStats.filteredOutIds.slice(0, 20).join(', ')}${normalStats.filteredOutIds.length > 20 ? '...' : ''}`);
    }
    
    // Count Pokemon by category in the output
    const categoryCounts: Record<string, number> = {};
    filteredPokemon.forEach(pokemon => {
      const category = getPokemonFormCategory(pokemon) || 'unknown';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    console.log(`📊 [OUTPUT_CATEGORY_COUNTS]`, categoryCounts);
    
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
    clearStoredPokemon,
    getNormalPokemonStats // Export for debugging
  };
};
