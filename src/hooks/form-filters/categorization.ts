
import { Pokemon } from "@/services/pokemon";
import { PokemonFormType } from "./types";

// Check if a Pokemon is a starter and should be completely excluded
export const isStarterPokemon = (pokemon: Pokemon): boolean => {
  const name = pokemon.name.toLowerCase();
  return name.includes("starter");
};

// Check if a Pokemon is a totem and should be completely excluded
export const isTotemPokemon = (pokemon: Pokemon): boolean => {
  const name = pokemon.name.toLowerCase();
  return name.includes("totem");
};

// Check if a Pokemon is a size variant that should be completely excluded
export const isSizeVariantPokemon = (pokemon: Pokemon): boolean => {
  const name = pokemon.name.toLowerCase();
  
  // Always exclude Pumpkaboo and Gourgeist size variants
  if ((name.includes("pumpkaboo") || name.includes("gourgeist")) && 
      (name.includes("small") || name.includes("large") || name.includes("super") || name.includes("size"))) {
    console.log(`🚫 [SIZE_VARIANT_DEBUG] ${pokemon.name} (${pokemon.id}) EXCLUDED - size variant`);
    return true;
  }
  
  return false;
};

// Check if a Pokemon is a special Koraidon/Miraidon mode that should be excluded
export const isSpecialKoraidonMiraidonMode = (pokemon: Pokemon): boolean => {
  const name = pokemon.name.toLowerCase();
  
  if ((name.includes('koraidon') || name.includes('miraidon')) && 
      (name.includes('apex') || name.includes('limited') || 
       name.includes('build') || name.includes('mode'))) {
    console.log(`🚫 [KORAIDON_MIRAIDON_DEBUG] ${pokemon.name} (${pokemon.id}) EXCLUDED - special mode`);
    return true;
  }
  
  return false;
};

// Check if a Pokemon is a color/flavor variant
export const isColorFlavorVariant = (pokemon: Pokemon): boolean => {
  const name = pokemon.name.toLowerCase();
  
  // Common color variants
  const colorKeywords = [
    'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'gray', 'grey',
    'brown', 'silver', 'gold', 'rainbow', 'indigo', 'violet', 'cyan', 'magenta'
  ];
  
  // Common flavor variants (especially for Alcremie)
  const flavorKeywords = [
    'vanilla', 'chocolate', 'strawberry', 'berry', 'mint', 'lemon', 'orange', 'apple',
    'caramel', 'ruby', 'matcha', 'salted', 'cream', 'sweet', 'bitter', 'sour', 'spicy'
  ];
  
  // Minior color cores
  const miniorColors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
  
  // Check for Minior specifically
  if (name.includes('minior')) {
    return miniorColors.some(color => name.includes(color));
  }
  
  // Check for Alcremie and its forms
  if (name.includes('alcremie')) {
    return flavorKeywords.some(flavor => name.includes(flavor)) || 
           colorKeywords.some(color => name.includes(color));
  }
  
  // General color/flavor check for hyphenated names
  if (name.includes('-')) {
    const parts = name.split('-');
    return parts.some(part => 
      colorKeywords.includes(part) || flavorKeywords.includes(part)
    );
  }
  
  return false;
};

// Check if a Pokemon belongs to a specific form category
export const getPokemonFormCategory = (pokemon: Pokemon): PokemonFormType | null => {
  const name = pokemon.name.toLowerCase();
  
  console.log(`🔍 [FORM_CATEGORIZATION_ENHANCED] Analyzing: "${pokemon.name}" (ID: ${pokemon.id})`);
  
  // Check for color/flavor variants FIRST (new category)
  if (isColorFlavorVariant(pokemon)) {
    console.log(`🎨 [FORM_FILTER_DEBUG] ${pokemon.name} (${pokemon.id}) categorized as COLOR/FLAVOR`);
    return "colorsFlavors";
  }
  
  // Check for costumes (Pikachu caps and cosplay forms)
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
  
  // Check for mega evolutions and gigantamax forms
  if (name.includes("mega") || name.includes("g-max") || name.includes("gmax") || name.includes("eternamax")) {
    console.log(`💥 [FORM_FILTER_DEBUG] ${pokemon.name} (${pokemon.id}) categorized as MEGA/GMAX`);
    return "megaGmax";
  }
  
  // Check for regional variants
  if (name.includes("alolan") || 
      name.includes("galarian") || 
      name.includes("hisuian") || 
      name.includes("paldean")) {
    console.log(`🌍 [FORM_FILTER_DEBUG] ${pokemon.name} (${pokemon.id}) categorized as REGIONAL`);
    return "regional";
  }
  
  // Check for gender differences - only treat as gender variants if they explicitly have gender indicators
  if ((name.includes("female") || name.includes("male")) && 
      (name.includes("-f") || name.includes("-m")) && 
      pokemon.id > 10000) {
    console.log(`⚧️ [FORM_FILTER_DEBUG] ${pokemon.name} (${pokemon.id}) categorized as GENDER`);
    return "gender";
  }
  
  // Check for special forms
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
  
  // A Pokemon is normal if it has a standard Pokedex number (1-1010) AND no special form indicators
  if (pokemon.id <= 1010 && 
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
    console.log(`✅ [FORM_FILTER_DEBUG] ${pokemon.name} (${pokemon.id}) is NORMAL (standard form)`);
    return "normal";
  }
  
  // If Pokemon has ID > 1010, it's likely a special form
  if (pokemon.id > 1010) {
    console.log(`🔄 [FORM_FILTER_DEBUG] ${pokemon.name} (${pokemon.id}) categorized as FORMS (high ID number)`);
    return "forms";
  }
  
  // Default to normal for any edge cases
  console.log(`✅ [FORM_FILTER_DEBUG] ${pokemon.name} (${pokemon.id}) defaulting to NORMAL`);
  return "normal";
};
