
import { Pokemon } from "@/services/pokemon";

// Check if Pokemon has "starter" in the name (like Pikachu variants)
export const isStarterVariant = (pokemon: Pokemon): boolean => {
  const name = pokemon.name.toLowerCase();
  const hasStarter = name.includes('starter');
  
  if (hasStarter) {
    console.log(`🔍 [STARTER_VARIANT_DETECTED] Found Pokemon with "starter" in name: "${pokemon.name}" (ID: ${pokemon.id})`);
  }
  
  return hasStarter;
};

// Check if Pokemon is a totem variant (always exclude)
export const isTotemPokemon = (pokemon: Pokemon): boolean => {
  const name = pokemon.name.toLowerCase();
  const hasTotem = name.includes('totem');
  
  if (hasTotem) {
    console.log(`🔍 [TOTEM_VARIANT_DETECTED] Found Pokemon with "totem" in name: "${pokemon.name}" (ID: ${pokemon.id})`);
  }
  
  return hasTotem;
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

// FIXED: Only block Pokemon with specific problematic patterns in their names
export const isBlockedPokemon = (pokemon: Pokemon): boolean => {
  const name = pokemon.name.toLowerCase();
  
  // Check various blocking conditions - NO MORE ID-BASED STARTER BLOCKING
  const isBlocked = isStarterVariant(pokemon) || 
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
