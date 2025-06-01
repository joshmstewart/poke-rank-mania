
import { capitalizeFirstLetter } from './helpers';
import { handleRegionalForms } from './regionalForms';
import { handleSpecialForms } from './specialForms';
import { handlePokemonVariants } from './pokemonVariants';
import { shouldFilterPokemon } from './filters';
import { handleSpecialCases } from './specialCases';
import { handleVariantFormatting } from './variantFormatting';

/**
 * Format Pokémon names to properly display regional forms
 * For example: "graveler-alola" -> "Alolan Graveler"
 * @param name The Pokémon name to format
 * @returns Formatted name with proper regional forms
 */
export const formatPokemonName = (name: string): string => {
  if (!name) return '';
  
  console.log(`🔧 [FORMAT_ULTRA_DEBUG] ===== formatPokemonName ENTRY =====`);
  console.log(`🔧 [FORMAT_ULTRA_DEBUG] Input name: "${name}"`);
  
  // Check if this Pokemon should be filtered out
  if (shouldFilterPokemon(name)) {
    return ''; // Return empty to filter out
  }
  
  // Handle special cases first (Zygarde, Nidoran, Greninja Ash, Maushold)
  const specialCaseResult = handleSpecialCases(name);
  if (specialCaseResult) {
    console.log(`🔧 [FORMAT_ULTRA_DEBUG] ===== formatPokemonName EXIT (SPECIAL CASE) =====`);
    return specialCaseResult;
  }
  
  // Handle variants that should be moved to front
  const variantFormattingResult = handleVariantFormatting(name);
  if (variantFormattingResult) {
    console.log(`🔧 [FORMAT_ULTRA_DEBUG] ===== formatPokemonName EXIT (VARIANT) =====`);
    return variantFormattingResult;
  }
  
  // Try special forms first (G-Max, Mega, Primal, Origin)
  const specialFormResult = handleSpecialForms(name);
  if (specialFormResult) {
    console.log(`🔧 [FORMAT_ULTRA_DEBUG] ===== formatPokemonName EXIT (SPECIAL) =====`);
    return specialFormResult;
  }
  
  // Try regional forms (Alolan, Galarian, Hisuian, Paldean)
  const regionalFormResult = handleRegionalForms(name);
  if (regionalFormResult) {
    console.log(`🔧 [FORMAT_ULTRA_DEBUG] ===== formatPokemonName EXIT (REGIONAL) =====`);
    return regionalFormResult;
  }
  
  // Try Pokemon variants (Miraidon, Koraidon, Totem, Hero, etc.)
  const variantResult = handlePokemonVariants(name);
  if (variantResult) {
    console.log(`🔧 [FORMAT_ULTRA_DEBUG] ===== formatPokemonName EXIT (VARIANT) =====`);
    return variantResult;
  }
  
  // Default: Capitalize the first letter of every word (including after hyphens)
  const result = capitalizeWords(name);
  console.log(`🔧 [FORMAT_DEBUG] Default capitalization: "${name}" -> "${result}"`);
  console.log(`🔧 [FORMAT_ULTRA_DEBUG] ===== formatPokemonName EXIT (DEFAULT) =====`);
  return result;
};

/**
 * Helper function to capitalize each word in a string, including words after hyphens
 */
const capitalizeWords = (str: string): string => {
  if (!str) return '';
  
  return str.split(/(\s+|-+)/).map(part => {
    if (part.match(/^\s+$/) || part.match(/^-+$/)) {
      return part; // Keep whitespace and hyphens as-is
    }
    return capitalizeFirstLetter(part);
  }).join('');
};
