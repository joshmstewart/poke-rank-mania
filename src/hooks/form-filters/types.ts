
export type PokemonFormType = 
  | "normal"
  | "megaGmax" 
  | "regional" 
  | "gender" 
  | "forms"
  | "originPrimal"
  | "costumes"
  | "colorsFlavors"
  | "blocked";

export interface FormFilters {
  normal: boolean;
  megaGmax: boolean;
  regional: boolean;
  gender: boolean;
  forms: boolean;
  originPrimal: boolean;
  costumes: boolean;
  colorsFlavors: boolean;
  blocked: boolean;
}
