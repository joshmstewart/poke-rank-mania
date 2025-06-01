
import { FormFilters } from "./types";

const STORAGE_KEY = 'pokemon-form-filters';

export const getStoredFilters = (): FormFilters => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      
      // Ensure all required properties exist (including new colorsFlavors)
      const defaultFilters: FormFilters = {
        normal: true,
        megaGmax: true,
        regional: true,
        gender: true,
        forms: true,
        originPrimal: true,
        costumes: true,
        colorsFlavors: true
      };
      
      // Merge with defaults to handle missing properties
      return { ...defaultFilters, ...parsed };
    }
  } catch (error) {
    console.error('Error loading form filters from localStorage:', error);
    // Clear corrupted data
    localStorage.removeItem(STORAGE_KEY);
  }
  
  // Return default filters with all enabled
  console.log('🧹 [FORM_FILTERS_STORAGE] Using default filters - all enabled');
  return {
    normal: true,
    megaGmax: true,
    regional: true,
    gender: true,
    forms: true,
    originPrimal: true,
    costumes: true,
    colorsFlavors: true
  };
};

export const saveFilters = (filters: FormFilters): void => {
  try {
    console.log('🧹 [FORM_FILTERS_STORAGE] Saving filters:', filters);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch (error) {
    console.error('Error saving form filters to localStorage:', error);
  }
};

// Add a function to clear filters (useful for resets)
export const clearStoredFilters = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('🧹 [FORM_FILTERS_STORAGE] Cleared stored filters');
  } catch (error) {
    console.error('Error clearing form filters from localStorage:', error);
  }
};
