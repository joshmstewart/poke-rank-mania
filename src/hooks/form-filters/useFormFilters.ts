
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

  // CRITICAL DEBUG: Add a function to analyze the full filtering pipeline
  const analyzeFilteringPipeline = (inputPokemon: Pokemon[]): Pokemon[] => {
    console.log(`🔍 [FILTER_PIPELINE_ANALYSIS] ===== STARTING FILTER ANALYSIS =====`);
    console.log(`🔍 [FILTER_PIPELINE_ANALYSIS] Input Pokemon count: ${inputPokemon.length}`);
    
    let inputDistribution = {
      '1-100': 0,
      '101-200': 0,
      '201-400': 0,
      '401-600': 0,
      '601-800': 0,
      '801-1025': 0,
      '1026+': 0,
    };
    
    if (inputPokemon.length > 0) {
      const inputIds = inputPokemon.map(p => p.id);
      const inputMinId = Math.min(...inputIds);
      const inputMaxId = Math.max(...inputIds);
      console.log(`🔍 [FILTER_PIPELINE_ANALYSIS] Input ID range: ${inputMinId} - ${inputMaxId}`);
      
      inputDistribution = {
        '1-100': inputIds.filter(id => id >= 1 && id <= 100).length,
        '101-200': inputIds.filter(id => id >= 101 && id <= 200).length,
        '201-400': inputIds.filter(id => id >= 201 && id <= 400).length,
        '401-600': inputIds.filter(id => id >= 401 && id <= 600).length,
        '601-800': inputIds.filter(id => id >= 601 && id <= 800).length,
        '801-1025': inputIds.filter(id => id >= 801 && id <= 1025).length,
        '1026+': inputIds.filter(id => id >= 1026).length,
      };
      console.log(`🔍 [FILTER_PIPELINE_ANALYSIS] Input distribution:`, inputDistribution);
    }
    
    console.log(`🔍 [FILTER_PIPELINE_ANALYSIS] Current filter states:`, filters);
    console.log(`🔍 [FILTER_PIPELINE_ANALYSIS] All filters enabled: ${isAllEnabled}`);
    
    // Apply filtering and track results
    const filteredPokemon = inputPokemon.filter(shouldIncludePokemon);
    
    console.log(`🔍 [FILTER_PIPELINE_ANALYSIS] Output Pokemon count: ${filteredPokemon.length}`);
    
    if (filteredPokemon.length > 0) {
      const outputIds = filteredPokemon.map(p => p.id);
      const outputMinId = Math.min(...outputIds);
      const outputMaxId = Math.max(...outputIds);
      console.log(`🔍 [FILTER_PIPELINE_ANALYSIS] Output ID range: ${outputMinId} - ${outputMaxId}`);
      
      const outputDistribution = {
        '1-100': outputIds.filter(id => id >= 1 && id <= 100).length,
        '101-200': outputIds.filter(id => id >= 101 && id <= 200).length,
        '201-400': outputIds.filter(id => id >= 201 && id <= 400).length,
        '401-600': outputIds.filter(id => id >= 401 && id <= 600).length,
        '601-800': outputIds.filter(id => id >= 601 && id <= 800).length,
        '801-1025': outputIds.filter(id => id >= 801 && id <= 1025).length,
        '1026+': outputIds.filter(id => id >= 1026).length,
      };
      console.log(`🔍 [FILTER_PIPELINE_ANALYSIS] Output distribution:`, outputDistribution);
      
      // Calculate filtering impact
      const filteringImpact = {
        '1-100': ((inputDistribution['1-100'] - outputDistribution['1-100']) / Math.max(inputDistribution['1-100'], 1) * 100).toFixed(1),
        '101-200': ((inputDistribution['101-200'] - outputDistribution['101-200']) / Math.max(inputDistribution['101-200'], 1) * 100).toFixed(1),
        '201-400': ((inputDistribution['201-400'] - outputDistribution['201-400']) / Math.max(inputDistribution['201-400'], 1) * 100).toFixed(1),
        '401-600': ((inputDistribution['401-600'] - outputDistribution['401-600']) / Math.max(inputDistribution['401-600'], 1) * 100).toFixed(1),
        '601-800': ((inputDistribution['601-800'] - outputDistribution['601-800']) / Math.max(inputDistribution['601-800'], 1) * 100).toFixed(1),
        '801-1025': ((inputDistribution['801-1025'] - outputDistribution['801-1025']) / Math.max(inputDistribution['801-1025'], 1) * 100).toFixed(1),
        '1026+': ((inputDistribution['1026+'] - outputDistribution['1026+']) / Math.max(inputDistribution['1026+'], 1) * 100).toFixed(1),
      };
      console.log(`🔍 [FILTER_PIPELINE_ANALYSIS] Filtering impact (% removed):`, filteringImpact);
    }
    
    console.log(`🔍 [FILTER_PIPELINE_ANALYSIS] ===== FILTER ANALYSIS COMPLETE =====`);
    
    return filteredPokemon;
  };
  
  // Return the filter state and functions
  return {
    filters,
    toggleFilter,
    isAllEnabled,
    toggleAll,
    shouldIncludePokemon,
    analyzeFilteringPipeline,
    getPokemonFormCategory,
    storePokemon,
    getStoredPokemon,
    clearStoredPokemon
  };
};
