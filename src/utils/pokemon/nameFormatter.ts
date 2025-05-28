
import { capitalizeFirstLetter, capitalizeWords } from './helpers';

/**
 * Format Pokémon names to properly display regional forms
 * For example: "graveler-alola" -> "Alolan Graveler"
 * @param name The Pokémon name to format
 * @returns Formatted name with proper regional forms
 */
export const formatPokemonName = (name: string): string => {
  if (!name) return '';
  
  console.log(`🔧 [FORMAT_ENTRY] formatPokemonName called with: "${name}"`);
  
  const lowerName = name.toLowerCase();
  console.log(`🔧 [FORMAT_STEP_1] Lowercase conversion: "${lowerName}"`);
  
  // CRITICAL DEBUG: Test the exact condition that should match "diglett-alola"
  const includesAlola = lowerName.includes('-alola');
  console.log(`🔧 [FORMAT_ALOLA_CHECK] Does "${lowerName}" include '-alola'? ${includesAlola}`);
  
  if (includesAlola) {
    console.log(`🔧 [FORMAT_ALOLA_DETECTED] Processing Alolan form: "${name}"`);
    const alolaSuffixIndex = name.toLowerCase().indexOf('-alola');
    console.log(`🔧 [FORMAT_ALOLA_INDEX] Index of '-alola' in "${name}": ${alolaSuffixIndex}`);
    
    const baseName = name.substring(0, alolaSuffixIndex);
    console.log(`🔧 [FORMAT_ALOLA_BASE] Base name extracted: "${baseName}"`);
    
    const capitalizedBase = capitalizeFirstLetter(baseName);
    console.log(`🔧 [FORMAT_ALOLA_CAPITALIZED] Capitalized base: "${capitalizedBase}"`);
    
    const result = `Alolan ${capitalizedBase}`;
    console.log(`🔧 [FORMAT_ALOLA_RESULT] Final result: "${result}"`);
    console.log(`🔧 [FORMAT_ALOLA_SUCCESS] "${name}" → "${result}"`);
    return result;
  }
  
  // CRITICAL FIX: Handle Miraidon and Koraidon forms NEXT
  if (lowerName.includes('miraidon-')) {
    console.log(`🔧 [FORMAT_MIRAIDON_DETECTED] Processing Miraidon form: "${name}"`);
    const formPart = name.substring(9); // Remove "miraidon-"
    const formattedForm = capitalizeWords(formPart.replace(/-/g, ' '));
    const result = `Miraidon (${formattedForm})`;
    console.log(`🔧 [FORMAT_MIRAIDON_RESULT] "${name}" → "${result}"`);
    return result;
  }
  
  if (lowerName.includes('koraidon-')) {
    console.log(`🔧 [FORMAT_KORAIDON_DETECTED] Processing Koraidon form: "${name}"`);
    const formPart = name.substring(9); // Remove "koraidon-"
    const formattedForm = capitalizeWords(formPart.replace(/-/g, ' '));
    const result = `Koraidon (${formattedForm})`;
    console.log(`🔧 [FORMAT_KORAIDON_RESULT] "${name}" → "${result}"`);
    return result;
  }
  
  // Handle regional forms NEXT - these are the most common in the logs
  if (lowerName.includes('-galar')) {
    console.log(`🔧 [FORMAT_GALAR_DETECTED] Processing Galarian form: "${name}"`);
    const baseName = name.substring(0, name.toLowerCase().indexOf('-galar'));
    const result = `Galarian ${capitalizeFirstLetter(baseName)}`;
    console.log(`🔧 [FORMAT_GALAR_RESULT] "${name}" → "${result}"`);
    return result;
  }
  
  if (lowerName.includes('-hisui')) {
    console.log(`🔧 [FORMAT_HISUI_DETECTED] Processing Hisuian form: "${name}"`);
    const baseName = name.substring(0, name.toLowerCase().indexOf('-hisui'));
    const result = `Hisuian ${capitalizeFirstLetter(baseName)}`;
    console.log(`🔧 [FORMAT_HISUI_RESULT] "${name}" → "${result}"`);
    return result;
  }
  
  if (lowerName.includes('-paldea')) {
    console.log(`🔧 [FORMAT_PALDEA_DETECTED] Processing Paldean form: "${name}"`);
    const baseName = name.substring(0, name.toLowerCase().indexOf('-paldea'));
    const result = `Paldean ${capitalizeFirstLetter(baseName)}`;
    console.log(`🔧 [FORMAT_PALDEA_RESULT] "${name}" → "${result}"`);
    return result;
  }
  
  // Handle specific Paldea breed forms like "tauros-paldea-blaze-breed"
  if (lowerName.includes('-paldea-') && (lowerName.includes('-breed') || lowerName.includes('-form'))) {
    console.log(`🔧 [FORMAT_PALDEA_BREED_DETECTED] Processing Paldean breed form: "${name}"`);
    const parts = name.toLowerCase().split('-');
    if (parts.length >= 4) {
      const baseName = parts[0];
      const breedType = parts[2]; // "blaze", "aqua", "combat"
      const result = `${capitalizeFirstLetter(baseName)} (Paldean ${capitalizeFirstLetter(breedType)})`;
      console.log(`🔧 [FORMAT_PALDEA_BREED_RESULT] "${name}" → "${result}"`);
      return result;
    }
  }
  
  // Handle Pikachu special forms like "pikachu-pop-star"
  if (lowerName.startsWith('pikachu-') && !lowerName.includes('cap')) {
    console.log(`🔧 [FORMAT_PIKACHU_SPECIAL_DETECTED] Processing special Pikachu form: "${name}"`);
    const formPart = name.substring(8); // Remove "pikachu-"
    const formattedForm = capitalizeWords(formPart.replace(/-/g, ' '));
    const result = `Pikachu (${formattedForm})`;
    console.log(`🔧 [FORMAT_PIKACHU_SPECIAL_RESULT] "${name}" → "${result}"`);
    return result;
  }
  
  // Handle Lycanroc forms like "lycanroc-dusk"
  if (lowerName.startsWith('lycanroc-')) {
    console.log(`🔧 [FORMAT_LYCANROC_DETECTED] Processing Lycanroc form: "${name}"`);
    const formPart = name.substring(9); // Remove "lycanroc-"
    const result = `${capitalizeFirstLetter(formPart)} Lycanroc`;
    console.log(`🔧 [FORMAT_LYCANROC_RESULT] "${name}" → "${result}"`);
    return result;
  }
  
  // Handle Indeedee gender forms like "indeedee-female"
  if (lowerName.includes('-female') || lowerName.includes('-male')) {
    console.log(`🔧 [FORMAT_GENDER_DETECTED] Processing gender form: "${name}"`);
    const parts = name.split('-');
    const baseName = parts[0];
    const gender = parts[1];
    const result = `${capitalizeFirstLetter(baseName)} (${capitalizeFirstLetter(gender)})`;
    console.log(`🔧 [FORMAT_GENDER_RESULT] "${name}" → "${result}"`);
    return result;
  }
  
  // CRITICAL FIX: Handle Gigantamax forms - this is the main issue
  if (lowerName.includes('-gmax')) {
    console.log(`🔧 [FORMAT_GMAX_DETECTED] Processing G-Max form: "${name}"`);
    const baseName = name.substring(0, name.toLowerCase().indexOf('-gmax'));
    const capitalizedBaseName = capitalizeFirstLetter(baseName);
    const result = `G-Max ${capitalizedBaseName}`;
    console.log(`🔧 [FORMAT_GMAX_RESULT] "${name}" → "${result}"`);
    return result;
  }
  
  // Handle Mega evolutions - CRITICAL: Must come AFTER G-Max check
  if (lowerName.includes('-mega-x')) {
    console.log(`🔧 [FORMAT_MEGA_X_DETECTED] Processing Mega X form: "${name}"`);
    const baseName = name.substring(0, name.toLowerCase().indexOf('-mega-x'));
    const result = `Mega ${capitalizeFirstLetter(baseName)} X`;
    console.log(`🔧 [FORMAT_MEGA_X_RESULT] "${name}" → "${result}"`);
    return result;
  }
  
  if (lowerName.includes('-mega-y')) {
    console.log(`🔧 [FORMAT_MEGA_Y_DETECTED] Processing Mega Y form: "${name}"`);
    const baseName = name.substring(0, name.toLowerCase().indexOf('-mega-y'));
    const result = `Mega ${capitalizeFirstLetter(baseName)} Y`;
    console.log(`🔧 [FORMAT_MEGA_Y_RESULT] "${name}" → "${result}"`);
    return result;
  }
  
  if (lowerName.includes('-mega')) {
    console.log(`🔧 [FORMAT_MEGA_DETECTED] Processing Mega form: "${name}"`);
    const baseName = name.substring(0, name.toLowerCase().indexOf('-mega'));
    const result = `Mega ${capitalizeFirstLetter(baseName)}`;
    console.log(`🔧 [FORMAT_MEGA_RESULT] "${name}" → "${result}"`);
    return result;
  }
  
  // Handle Primal forms
  if (lowerName.includes('-primal')) {
    console.log(`🔧 [FORMAT_PRIMAL_DETECTED] Processing Primal form: "${name}"`);
    const baseName = name.substring(0, name.toLowerCase().indexOf('-primal'));
    const result = `Primal ${capitalizeFirstLetter(baseName)}`;
    console.log(`🔧 [FORMAT_PRIMAL_RESULT] "${name}" → "${result}"`);
    return result;
  }
  
  // Handle Origin forms
  if (lowerName.includes('-origin')) {
    console.log(`🔧 [FORMAT_ORIGIN_DETECTED] Processing Origin form: "${name}"`);
    const baseName = name.substring(0, name.toLowerCase().indexOf('-origin'));
    const result = `${capitalizeFirstLetter(baseName)} (Origin Forme)`;
    console.log(`🔧 [FORMAT_ORIGIN_RESULT] "${name}" → "${result}"`);
    return result;
  }
  
  // Handle totem forms like "mimikyu-totem-busted"
  if (lowerName.includes('-totem')) {
    console.log(`🔧 [FORMAT_TOTEM_DETECTED] Processing Totem form: "${name}"`);
    const baseName = name.substring(0, name.toLowerCase().indexOf('-totem'));
    const totemPart = name.substring(name.toLowerCase().indexOf('-totem') + 1);
    const result = `${capitalizeFirstLetter(baseName)} (${capitalizeWords(totemPart.replace(/-/g, ' '))})`;
    console.log(`🔧 [FORMAT_TOTEM_RESULT] "${name}" → "${result}"`);
    return result;
  }
  
  // Handle special forms like "palafin-hero", "minior-orange-meteor"
  if (lowerName.includes('-hero')) {
    console.log(`🔧 [FORMAT_HERO_DETECTED] Processing Hero form: "${name}"`);
    const baseName = name.substring(0, name.toLowerCase().indexOf('-hero'));
    const result = `${capitalizeFirstLetter(baseName)} (Hero)`;
    console.log(`🔧 [FORMAT_HERO_RESULT] "${name}" → "${result}"`);
    return result;
  }
  
  if (lowerName.includes('-orange-meteor')) {
    console.log(`🔧 [FORMAT_METEOR_DETECTED] Processing Orange Meteor form: "${name}"`);
    const baseName = name.substring(0, name.toLowerCase().indexOf('-orange-meteor'));
    const result = `${capitalizeFirstLetter(baseName)} (Orange Meteor)`;
    console.log(`🔧 [FORMAT_METEOR_RESULT] "${name}" → "${result}"`);
    return result;
  }
  
  if (lowerName.includes('-large')) {
    console.log(`🔧 [FORMAT_LARGE_DETECTED] Processing Large form: "${name}"`);
    const baseName = name.substring(0, name.toLowerCase().indexOf('-large'));
    const result = `${capitalizeFirstLetter(baseName)} (Large)`;
    console.log(`🔧 [FORMAT_LARGE_RESULT] "${name}" → "${result}"`);
    return result;
  }
  
  if (lowerName.includes('-dada')) {
    console.log(`🔧 [FORMAT_DADA_DETECTED] Processing Dada form: "${name}"`);
    const baseName = name.substring(0, name.toLowerCase().indexOf('-dada'));
    const result = `${capitalizeFirstLetter(baseName)} (Dada)`;
    console.log(`🔧 [FORMAT_DADA_RESULT] "${name}" → "${result}"`);
    return result;
  }
  
  // Handle Pikachu cap variants
  if (lowerName.includes('pikachu') && lowerName.includes('cap')) {
    console.log(`🔧 [FORMAT_PIKACHU_CAP_DETECTED] Processing Pikachu cap variant: "${name}"`);
    if (lowerName.includes('original-cap')) return 'Pikachu (Original Cap)';
    if (lowerName.includes('hoenn-cap')) return 'Pikachu (Hoenn Cap)';
    if (lowerName.includes('sinnoh-cap')) return 'Pikachu (Sinnoh Cap)';
    if (lowerName.includes('unova-cap')) return 'Pikachu (Unova Cap)';
    if (lowerName.includes('kalos-cap')) return 'Pikachu (Kalos Cap)';
    if (lowerName.includes('alola-cap')) return 'Pikachu (Alolan Cap)';
    if (lowerName.includes('partner-cap')) return 'Pikachu (Partner Cap)';
    if (lowerName.includes('world-cap')) return 'Pikachu (World Cap)';
  }
  
  // If no special patterns found, just capitalize the first letter
  console.log(`🔧 [FORMAT_NO_MATCH] No transformation patterns matched for: "${name}"`);
  const result = capitalizeFirstLetter(name);
  console.log(`🔧 [FORMAT_DEFAULT_RESULT] Returning capitalized: "${name}" → "${result}"`);
  return result;
};
