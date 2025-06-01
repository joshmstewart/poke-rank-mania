
export type PokemonFormType = 
  | "normal"
  | "megaGmax" 
  | "regional" 
  | "gender" 
  | "forms"
  | "originPrimal"
  | "costumes"
  | "colorsFlavors"; // New category for color and flavor variants

export interface FormFilters {
  normal: boolean;
  megaGmax: boolean;
  regional: boolean;
  gender: boolean;
  forms: boolean;
  originPrimal: boolean;
  costumes: boolean;
  colorsFlavors: boolean; // New filter
}
