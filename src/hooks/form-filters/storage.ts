
import { FormFilters } from "./types";

// Retrieve filters from localStorage or use defaults (mega/gmax disabled, others enabled)
export const getStoredFilters = (): FormFilters => {
  const stored = localStorage.getItem('pokemon-form-filters');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Error parsing stored form filters:", e);
    }
  }
  
  // Default to mega/gmax evolutions disabled, others enabled (including normal)
  return {
    normal: true,
    megaGmax: false,
    regional: true,
    gender: true,
    forms: true,
    originPrimal: true,
    costumes: true
  };
};

export const saveFilters = (filters: FormFilters): void => {
  localStorage.setItem('pokemon-form-filters', JSON.stringify(filters));
};
