
import { FormFilters } from "./types";

const STORAGE_KEY = "pokemon-form-filters";

const defaultFilters: FormFilters = {
  normal: true,
  megaGmax: true,
  regional: true,
  gender: true,
  forms: true,
  originPrimal: true,
  costumes: true,
  colorsFlavors: true,
  blocked: false // Default to false - blocked Pokemon should not be shown by default
};

export const getStoredFilters = (): FormFilters => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      console.log('🔧 [FORM_FILTERS_STORAGE] No stored filters, using defaults');
      return defaultFilters;
    }
    
    const parsed = JSON.parse(stored) as Partial<FormFilters>;
    console.log('🔧 [FORM_FILTERS_STORAGE] Loaded stored filters:', parsed);
    
    // Ensure all required properties exist (for backwards compatibility)
    const result: FormFilters = {
      ...defaultFilters,
      ...parsed
    };
    
    console.log('🔧 [FORM_FILTERS_STORAGE] Final filters after merge:', result);
    return result;
  } catch (error) {
    console.error('🔧 [FORM_FILTERS_STORAGE] Error loading filters:', error);
    return defaultFilters;
  }
};

export const saveFilters = (filters: FormFilters): void => {
  try {
    console.log('🔧 [FORM_FILTERS_STORAGE] Saving filters:', filters);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch (error) {
    console.error('🔧 [FORM_FILTERS_STORAGE] Error saving filters:', error);
  }
};

export const clearStoredFilters = (): void => {
  try {
    console.log('🔧 [FORM_FILTERS_STORAGE] Clearing stored filters');
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('🔧 [FORM_FILTERS_STORAGE] Error clearing filters:', error);
  }
};
