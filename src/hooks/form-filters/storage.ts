
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
        colorsFlavors: true // Default to enabled for new category
      };
      
      // Merge with defaults to handle missing properties
      return { ...defaultFilters, ...parsed };
    }
  } catch (error) {
    console.error('Error loading form filters from localStorage:', error);
  }
  
  // Return default filters with all enabled
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch (error) {
    console.error('Error saving form filters to localStorage:', error);
  }
};
