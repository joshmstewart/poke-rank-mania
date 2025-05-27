
import { Pokemon } from "@/services/pokemon";
import { PokemonFormType } from "./types";

// Check if a Pokemon is a starter and should be completely excluded
export const isStarterPokemon = (pokemon: Pokemon): boolean => {
  const name = pokemon.name.toLowerCase();
  return name.includes("starter");
};

// Check if a Pokemon belongs to a specific form category
export const getPokemonFormCategory = (pokemon: Pokemon): PokemonFormType | null => {
  const name = pokemon.name.toLowerCase();
  
  console.log(`🔍 [FORM_CATEGORIZATION_ENHANCED] Analyzing: "${pokemon.name}" (ID: ${pokemon.id})`);
  
  // Check for costumes (Pikachu caps and cosplay forms) - check this FIRST
  if ((name.includes("pikachu") && (
      name.includes("cap") || 
      name.includes("phd") || 
      name.includes("cosplay") || 
      name.includes("belle") || 
      name.includes("libre") || 
      name.includes("pop-star") || 
      name.includes("rock-star") ||
      name.includes("partner"))) || 
      name.includes("crowned")) {
    console.log(`🎭 [FORM_FILTER_DEBUG] ${pokemon.name} (${pokemon.id}) categorized as COSTUME`);
    return "costumes";
  }
  
  // Check for Origin and Primal forms (AFTER costumes) - make more strict
  if ((name.includes("origin") && !name.includes("pikachu")) || 
      (name.includes("primal") && !name.includes("pikachu"))) {
    console.log(`🔥 [FORM_FILTER_DEBUG] ${pokemon.name} (${pokemon.id}) categorized as ORIGIN/PRIMAL`);
    return "originPrimal";
  }
  
  // Check for mega evolutions and gigantamax forms - ENHANCED detection
  if (name.includes("mega") || name.includes("g-max") || name.includes("gmax") || name.includes("eternamax")) {
    console.log(`💥 [FORM_FILTER_DEBUG] ${pokemon.name} (${pokemon.id}) categorized as MEGA/GMAX`);
    return "megaGmax";
  }
  
  // Check for regional variants (expanded to include paldean variants)
  if (name.includes("alolan") || 
      name.includes("galarian") || 
      name.includes("hisuian") || 
      name.includes("paldean")) {
    console.log(`🌍 [FORM_FILTER_DEBUG] ${pokemon.name} (${pokemon.id}) categorized as REGIONAL`);
    return "regional";
  }
  
  // FIXED: More specific gender differences check - exclude Pokemon with their own Pokedex numbers
  // Only treat as gender variants if they explicitly have gender indicators AND are likely alternate forms
  if ((name.includes("female") || name.includes("male")) && 
      (name.includes("-f") || name.includes("-m")) && 
      pokemon.id > 10000) { // Only special form IDs (>10000) should be treated as gender variants
    console.log(`⚧️ [FORM_FILTER_DEBUG] ${pokemon.name} (${pokemon.id}) categorized as GENDER`);
    return "gender";
  }
  
  // Check for special forms (expanded to include more form types, but excluding what's now in other categories)
  if (name.includes("form") || 
      name.includes("style") || 
      name.includes("mode") || 
      name.includes("size") || 
      name.includes("cloak") ||
      name.includes("rotom-") ||
      name.includes("forme") ||
      name.includes("unbound") ||
      name.includes("gorging") ||
      name.includes("-theme")) {
    console.log(`🔄 [FORM_FILTER_DEBUG] ${pokemon.name} (${pokemon.id}) categorized as FORMS`);
    return "forms";
  }
  
  // ENHANCED: Stricter normal Pokemon identification
  // A Pokemon is normal if it has a standard Pokedex number (1-1000) AND no special form indicators
  if (pokemon.id <= 1000 && 
      !name.includes("mega") && 
      !name.includes("gmax") && 
      !name.includes("g-max") &&
      !name.includes("alolan") && 
      !name.includes("galarian") && 
      !name.includes("hisuian") && 
      !name.includes("paldean") &&
      !name.includes("origin") &&
      !name.includes("primal") &&
      !name.includes("cap") &&
      !name.includes("form") &&
      !name.includes("style") &&
      !name.includes("mode") &&
      !name.includes("crowned")) {
    console.log(`✅ [FORM_FILTER_DEBUG] ${pokemon.name} (${pokemon.id}) is NORMAL (standard form) - standard Pokedex number and no special indicators`);
    return "normal";
  }
  
  // If Pokemon has ID > 1000, it's likely a special form
  if (pokemon.id > 1000) {
    console.log(`🔄 [FORM_FILTER_DEBUG] ${pokemon.name} (${pokemon.id}) categorized as FORMS (high ID number)`);
    return "forms";
  }
  
  // Default to normal for any edge cases
  console.log(`✅ [FORM_FILTER_DEBUG] ${pokemon.name} (${pokemon.id}) defaulting to NORMAL`);
  return "normal";
};
