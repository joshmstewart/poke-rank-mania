
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
  
  // Check for mega evolutions, gigantamax forms and eternamax forms (combined)
  if (name.includes("mega") || name.includes("gmax") || name.includes("eternamax")) {
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
  
  // Check for gender differences (updated to standardize naming)
  // Looking for female or male indicators in the name
  if (name.includes("female") || 
      name.includes("male") || 
      name.includes("-f") || 
      name.includes("-m")) {
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
  
  // If none of the above categories match, it's a normal Pokemon
  console.log(`✅ [FORM_FILTER_DEBUG] ${pokemon.name} (${pokemon.id}) is NORMAL (standard form)`);
  return "normal";
};
