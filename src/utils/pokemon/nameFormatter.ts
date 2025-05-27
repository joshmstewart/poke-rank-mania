
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
  
  // DETAILED LOGGING: Check each transformation condition
  
  // Handle regional forms FIRST - these are the most common in the logs
  if (lowerName.includes('-alola')) {
    console.log(`🔧 [FORMAT_ALOLA_DETECTED] Processing Alolan form: "${name}"`);
    const baseName = name.substring(0, name.toLowerCase().indexOf('-alola'));
    const result = `Alolan ${capitalizeFirstLetter(baseName)}`;
    console.log(`🔧 [FORMAT_ALOLA_RESULT] "${name}" → "${result}"`);
    return result;
  }
  
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
  
  // Handle Gigantamax forms
  if (lowerName.includes('-gmax')) {
    console.log(`🔧 [FORMAT_GMAX_DETECTED] Processing G-Max form: "${name}"`);
    const baseName = name.substring(0, name.toLowerCase().indexOf('-gmax'));
    const result = `G-Max ${capitalizeFirstLetter(baseName)}`;
    console.log(`🔧 [FORMAT_GMAX_RESULT] "${name}" → "${result}"`);
    return result;
  }
  
  // Handle Mega evolutions
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
    console.log(`🔧 [FORMAT_MEGA_Y_RESULT] "${name}" → "${result)"`);
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
