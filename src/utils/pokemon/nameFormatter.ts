
import { capitalizeFirstLetter } from './helpers';
import { handleRegionalForms } from './regionalForms';
import { handleSpecialForms } from './specialForms';
import { handlePokemonVariants } from './pokemonVariants';

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
  
  // RULE 5: Special case for Greninja Ash
  if (name.toLowerCase().includes('greninja') && name.toLowerCase().includes('ash')) {
    console.log(`🔧 [FORMAT_DEBUG] Special Greninja Ash case: "${name}"`);
    return "Ash's Greninja";
  }
  
  // RULE 3: Hide special modes of Koraidon and Miraidon
  if ((name.toLowerCase().includes('koraidon') || name.toLowerCase().includes('miraidon')) && 
      (name.toLowerCase().includes('apex') || name.toLowerCase().includes('limited') || 
       name.toLowerCase().includes('build') || name.toLowerCase().includes('mode'))) {
    console.log(`🔧 [FORMAT_DEBUG] Filtering out special Koraidon/Miraidon mode: "${name}"`);
    return ''; // Return empty to filter out
  }
  
  // RULE 1: Handle variants with suffixes that should be moved to front
  // Handle parentheses variants first: "dialga (origin forme)" -> "Origin Forme Dialga"
  const parenthesesMatch = name.match(/^([^(]+)\s*\(([^)]+)\)$/i);
  if (parenthesesMatch) {
    const baseName = parenthesesMatch[1].trim();
    const variant = parenthesesMatch[2].trim();
    const formattedBase = capitalizeWords(baseName);
    const formattedVariant = capitalizeWords(variant);
    const result = `${formattedVariant} ${formattedBase}`;
    console.log(`🔧 [FORMAT_DEBUG] Parentheses variant: "${name}" -> "${result}"`);
    return result;
  }
  
  // Handle hyphenated variants: "calyrex-shadow" -> "Shadow Calyrex"
  if (name.includes('-')) {
    const parts = name.split('-');
    if (parts.length === 2) {
      const baseName = parts[0];
      const variant = parts[1];
      
      // Check if this is a regional form (handle these separately)
      if (['alola', 'galar', 'hisui', 'paldea'].includes(variant.toLowerCase())) {
        // Let regional forms handler take care of this
      } else if (['mega', 'gmax', 'origin', 'primal'].some(special => 
        name.toLowerCase().includes(special))) {
        // Let special forms handler take care of this
      } else {
        // This is a color/flavor/variant that should be moved to front
        const formattedBase = capitalizeWords(baseName);
        const formattedVariant = capitalizeWords(variant);
        const result = `${formattedVariant} ${formattedBase}`;
        console.log(`🔧 [FORMAT_DEBUG] Hyphen variant: "${name}" -> "${result}"`);
        return result;
      }
    } else if (parts.length === 3) {
      // Handle cases like "pikachu-hoenn-cap" -> "Hoenn Cap Pikachu"
      const baseName = parts[0];
      const variant1 = parts[1];
      const variant2 = parts[2];
      
      if (!['alola', 'galar', 'hisui', 'paldea'].includes(variant1.toLowerCase())) {
        const formattedBase = capitalizeWords(baseName);
        const formattedVariant = capitalizeWords(`${variant1} ${variant2}`);
        const result = `${formattedVariant} ${formattedBase}`;
        console.log(`🔧 [FORMAT_DEBUG] Triple hyphen variant: "${name}" -> "${result}"`);
        return result;
      }
    }
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
  
  // RULE 2: Capitalize the first letter of every word (including after hyphens)
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
