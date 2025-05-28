
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
  console.log(`🔧 [FORMAT_ULTRA_DEBUG] Input type: ${typeof name}`);
  console.log(`🔧 [FORMAT_ULTRA_DEBUG] Input length: ${name.length}`);
  console.log(`🔧 [FORMAT_ULTRA_DEBUG] Input chars: [${name.split('').join(', ')}]`);
  
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
  
  // If no special patterns found, just capitalize the first letter
  console.log(`🔧 [FORMAT_ULTRA_DEBUG] No patterns matched for: "${name}"`);
  const result = capitalizeFirstLetter(name);
  console.log(`🔧 [FORMAT_ULTRA_DEBUG] Default capitalization result: "${result}"`);
  console.log(`🔧 [FORMAT_ULTRA_DEBUG] ===== formatPokemonName EXIT (DEFAULT) =====`);
  return result;
};
