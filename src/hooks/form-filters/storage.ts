
import { FormFilters } from "./types";

const STORAGE_KEY = "pokemon-form-filters";

const defaultFilters: FormFilters = {
  normal: true,        // ON by default
  megaGmax: false,     // OFF by default (changed)
  regional: true,      // ON by default
  gender: true,        // ON by default
  forms: true,         // ON by default (Special Forms)
  originPrimal: false, // OFF by default (changed)
  costumes: false,     // OFF by default (changed)
  colorsFlavors: false, // OFF by default (changed)
  blocked: false       // OFF by default (always)
};

// CRITICAL FIX: Add manual hydration check like TrueSkill store
console.log(`🔧 [FORM_FILTERS_STORAGE_FIX] ===== CHECKING LOCALSTORAGE AND FORCING HYDRATION =====`);
const checkStoredFilters = () => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    console.log(`🔧 [FORM_FILTERS_STORAGE_FIX] Raw localStorage data exists:`, !!storedData);
    
    if (storedData) {
      const parsed = JSON.parse(storedData) as Partial<FormFilters>;
      console.log(`🔧 [FORM_FILTERS_STORAGE_FIX] Parsed filters from localStorage:`, parsed);
      return parsed;
    }
  } catch (error) {
    console.error(`🔧 [FORM_FILTERS_STORAGE_FIX] Failed to parse localStorage:`, error);
  }
  return null;
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
    
    // CRITICAL FIX: Ensure all required properties exist with robust fallback
    const result: FormFilters = {
      ...defaultFilters,
      ...parsed
    };
    
    console.log('🔧 [FORM_FILTERS_STORAGE] Final filters after merge:', result);
    
    // CRITICAL FIX: Double-check the result has all required keys
    const requiredKeys = Object.keys(defaultFilters);
    const resultKeys = Object.keys(result);
    const missingKeys = requiredKeys.filter(key => !resultKeys.includes(key));
    
    if (missingKeys.length > 0) {
      console.warn(`🔧 [FORM_FILTERS_STORAGE_FIX] Missing keys detected, fixing:`, missingKeys);
      missingKeys.forEach(key => {
        result[key as keyof FormFilters] = defaultFilters[key as keyof FormFilters];
      });
    }
    
    return result;
  } catch (error) {
    console.error('🔧 [FORM_FILTERS_STORAGE] Error loading filters, using defaults:', error);
    
    // CRITICAL FIX: Try manual check if main parsing fails
    const manualCheck = checkStoredFilters();
    if (manualCheck) {
      console.log(`🔧 [FORM_FILTERS_STORAGE_FIX] Manual check succeeded, using:`, manualCheck);
      return { ...defaultFilters, ...manualCheck };
    }
    
    return defaultFilters;
  }
};

export const saveFilters = (filters: FormFilters): void => {
  try {
    console.log('🔧 [FORM_FILTERS_STORAGE] Saving filters:', filters);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    
    // CRITICAL FIX: Verify the save worked
    const verification = localStorage.getItem(STORAGE_KEY);
    if (!verification) {
      console.error('🔧 [FORM_FILTERS_STORAGE_FIX] Save verification failed!');
    } else {
      console.log('🔧 [FORM_FILTERS_STORAGE_FIX] Save verified successfully');
    }
  } catch (error) {
    console.error('🔧 [FORM_FILTERS_STORAGE] Error saving filters:', error);
  }
};

export const clearStoredFilters = (): void => {
  try {
    console.log('🔧 [FORM_FILTERS_STORAGE] Clearing stored filters');
    localStorage.removeItem(STORAGE_KEY);
    
    // CRITICAL FIX: Verify the clear worked
    const verification = localStorage.getItem(STORAGE_KEY);
    if (verification) {
      console.error('🔧 [FORM_FILTERS_STORAGE_FIX] Clear verification failed!');
    } else {
      console.log('🔧 [FORM_FILTERS_STORAGE_FIX] Clear verified successfully');
    }
  } catch (error) {
    console.error('🔧 [FORM_FILTERS_STORAGE] Error clearing filters:', error);
  }
};

// CRITICAL FIX: Export manual check function for emergency use
export const forceReloadFilters = (): FormFilters | null => {
  console.log(`🔧 [FORM_FILTERS_STORAGE_FIX] ===== FORCE RELOAD TRIGGERED =====`);
  const manualData = checkStoredFilters();
  if (manualData) {
    const result = { ...defaultFilters, ...manualData };
    console.log(`🔧 [FORM_FILTERS_STORAGE_FIX] Force reload successful:`, result);
    return result;
  }
  console.log(`🔧 [FORM_FILTERS_STORAGE_FIX] Force reload found no data`);
  return null;
};
