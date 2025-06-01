
import { Pokemon } from "@/services/pokemon";

// FIXED: Check if Pokemon has the literal word "starter" in its name
export const isStarterPokemon = (pokemon: Pokemon): boolean => {
  return pokemon.name.toLowerCase().includes('starter');
};

// Check if Pokemon is a totem variant (always exclude)
export const isTotemPokemon = (pokemon: Pokemon): boolean => {
  return pokemon.name.toLowerCase().includes('totem');
};

// Check if Pokemon is a size variant (always exclude)
export const isSizeVariantPokemon = (pokemon: Pokemon): boolean => {
  const name = pokemon.name.toLowerCase();
  return name.includes('small') || name.includes('large') || name.includes('super') ||
         (name.includes('pumpkaboo') && (name.includes('small') || name.includes('large') || name.includes('super'))) ||
         (name.includes('gourgeist') && (name.includes('small') || name.includes('large') || name.includes('super')));
};

// Check if Pokemon is a special Koraidon/Miraidon mode (always exclude)
export const isSpecialKoraidonMiraidonMode = (pokemon: Pokemon): boolean => {
  const name = pokemon.name.toLowerCase();
  return (name.includes('koraidon') || name.includes('miraidon')) && 
         (name.includes('limited') || name.includes('build') || name.includes('mode'));
};

// ENHANCED: More comprehensive blocked Pokemon detection
export const isBlockedPokemon = (pokemon: Pokemon): boolean => {
  const name = pokemon.name.toLowerCase();
  
  // Log each Pokemon being checked for blocking
  const isBlocked = isStarterPokemon(pokemon) || 
         isTotemPokemon(pokemon) || 
         isSizeVariantPokemon(pokemon) || 
         isSpecialKoraidonMiraidonMode(pokemon) ||
         (name.includes('minior') && name.includes('meteor')) ||
         (name.includes('cramorant') && name !== 'cramorant') ||
         // Additional blocked patterns
         name.includes('-cap') || // Pikachu caps that might be missed
         name.includes('shadow') || // Shadow Pokemon
         name.includes('purified') || // Purified Pokemon
         name.includes('clone') || // Clone Pokemon
         name.includes('copy'); // Copy Pokemon
  
  if (isBlocked) {
    console.log(`🚫 [BLOCKED_DETECTION] "${pokemon.name}" (ID: ${pokemon.id}) detected as blocked`);
  }
  
  return isBlocked;
};
