
import { PokemonFormType } from "../types";
import { normalPokemonCategories } from "./normalPokemon";
import { specialFormCategories } from "./specialForms";
import { regionalFormCategories } from "./regionalForms";
import { alternativeFormCategories } from "./alternativeForms";
import { blockedPokemonCategories } from "./blockedPokemon";

// Combine all category mappings into a single object
export const hardcodedPokemonCategories: Record<string, PokemonFormType> = {
  ...normalPokemonCategories,
  ...specialFormCategories,
  ...regionalFormCategories,
  ...alternativeFormCategories,
  ...blockedPokemonCategories
};

// Normalize Pokemon name for lookup (convert to lowercase, replace spaces with hyphens)
const normalizePokemonName = (name: string): string => {
  return name.toLowerCase().trim().replace(/\s+/g, '-');
};

export const getHardcodedCategory = (pokemonName: string): PokemonFormType | null => {
  const normalizedName = normalizePokemonName(pokemonName);
  console.log(`🔍 [HARDCODED_LOOKUP] Original: "${pokemonName}" -> Normalized: "${normalizedName}"`);
  
  const category = hardcodedPokemonCategories[normalizedName] || null;
  if (category) {
    console.log(`✅ [HARDCODED_FOUND] "${pokemonName}" -> "${normalizedName}" = ${category}`);
  } else {
    console.log(`❌ [HARDCODED_MISSING] "${pokemonName}" -> "${normalizedName}" not found`);
  }
  
  return category;
};

// Get all normal Pokemon IDs from 1-1025 for faster lookup
export const normalPokemonRange = new Set(Array.from({ length: 1025 }, (_, i) => i + 1));
