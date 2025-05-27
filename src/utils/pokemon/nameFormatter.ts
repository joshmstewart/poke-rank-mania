
import { capitalizeFirstLetter, capitalizeWords } from './helpers';

/**
 * Format Pokémon names to properly display regional forms
 * For example: "graveler-alola" -> "Alolan Graveler"
 * @param name The Pokémon name to format
 * @returns Formatted name with proper regional forms
 */
export const formatPokemonName = (name: string): string => {
  if (!name) return '';
  
  console.log(`🚀 [FORMAT_POKEMON_NAME] Input: "${name}"`);
  
  const lowerName = name.toLowerCase();
  console.log(`🔍 [EXECUTION_STEP_1] Lowercase conversion: "${lowerName}"`);
  
  // Handle regional forms FIRST - these are the most common in the logs
  if (lowerName.includes('-alola')) {
    const baseName = name.substring(0, name.toLowerCase().indexOf('-alola'));
    const result = `Alolan ${capitalizeFirstLetter(baseName)}`;
    console.log(`🌍 [REGIONAL_ALOLAN] "${name}" -> "${result}"`);
    return result;
  }
  
  if (lowerName.includes('-galar')) {
    const baseName = name.substring(0, name.toLowerCase().indexOf('-galar'));
    const result = `Galarian ${capitalizeFirstLetter(baseName)}`;
    console.log(`🌍 [REGIONAL_GALARIAN] "${name}" -> "${result}"`);
    return result;
  }
  
  if (lowerName.includes('-hisui')) {
    const baseName = name.substring(0, name.toLowerCase().indexOf('-hisui'));
    const result = `Hisuian ${capitalizeFirstLetter(baseName)}`;
    console.log(`🌍 [REGIONAL_HISUIAN] "${name}" -> "${result}"`);
    return result;
  }
  
  if (lowerName.includes('-paldea')) {
    const baseName = name.substring(0, name.toLowerCase().indexOf('-paldea'));
    const result = `Paldean ${capitalizeFirstLetter(baseName)}`;
    console.log(`🌍 [REGIONAL_PALDEAN] "${name}" -> "${result}"`);
    return result;
  }
  
  // Handle Gigantamax forms
  if (lowerName.includes('-gmax')) {
    const baseName = name.substring(0, name.toLowerCase().indexOf('-gmax'));
    const result = `G-Max ${capitalizeFirstLetter(baseName)}`;
    console.log(`✅ [GMAX] "${name}" -> "${result}"`);
    return result;
  }
  
  // Handle Mega evolutions
  if (lowerName.includes('-mega-x')) {
    const baseName = name.substring(0, name.toLowerCase().indexOf('-mega-x'));
    const result = `Mega ${capitalizeFirstLetter(baseName)} X`;
    console.log(`✅ [MEGA_X] "${name}" -> "${result}"`);
    return result;
  }
  
  if (lowerName.includes('-mega-y')) {
    const baseName = name.substring(0, name.toLowerCase().indexOf('-mega-y'));
    const result = `Mega ${capitalizeFirstLetter(baseName)} Y`;
    console.log(`✅ [MEGA_Y] "${name}" -> "${result}"`);
    return result;
  }
  
  if (lowerName.includes('-mega')) {
    const baseName = name.substring(0, name.toLowerCase().indexOf('-mega'));
    const result = `Mega ${capitalizeFirstLetter(baseName)}`;
    console.log(`✅ [MEGA] "${name}" -> "${result}"`);
    return result;
  }
  
  // Handle Primal forms
  if (lowerName.includes('-primal')) {
    const baseName = name.substring(0, name.toLowerCase().indexOf('-primal'));
    const result = `Primal ${capitalizeFirstLetter(baseName)}`;
    console.log(`✅ [PRIMAL] "${name}" -> "${result}"`);
    return result;
  }
  
  // Handle Origin forms
  if (lowerName.includes('-origin')) {
    const baseName = name.substring(0, name.toLowerCase().indexOf('-origin'));
    const result = `${capitalizeFirstLetter(baseName)} (Origin Forme)`;
    console.log(`✅ [ORIGIN] "${name}" -> "${result}"`);
    return result;
  }
  
  // Handle totem forms like "mimikyu-totem-busted"
  if (lowerName.includes('-totem')) {
    const baseName = name.substring(0, name.toLowerCase().indexOf('-totem'));
    const totemPart = name.substring(name.toLowerCase().indexOf('-totem') + 1);
    const result = `${capitalizeFirstLetter(baseName)} (${capitalizeWords(totemPart.replace(/-/g, ' '))})`;
    console.log(`✅ [TOTEM] "${name}" -> "${result}"`);
    return result;
  }
  
  // Handle special forms like "palafin-hero", "minior-orange-meteor"
  if (lowerName.includes('-hero')) {
    const baseName = name.substring(0, name.toLowerCase().indexOf('-hero'));
    const result = `${capitalizeFirstLetter(baseName)} (Hero)`;
    console.log(`✅ [HERO_FORM] "${name}" -> "${result}"`);
    return result;
  }
  
  if (lowerName.includes('-orange-meteor')) {
    const baseName = name.substring(0, name.toLowerCase().indexOf('-orange-meteor'));
    const result = `${capitalizeFirstLetter(baseName)} (Orange Meteor)`;
    console.log(`✅ [METEOR_FORM] "${name}" -> "${result}"`);
    return result;
  }
  
  if (lowerName.includes('-large')) {
    const baseName = name.substring(0, name.toLowerCase().indexOf('-large'));
    const result = `${capitalizeFirstLetter(baseName)} (Large)`;
    console.log(`✅ [SIZE_FORM] "${name}" -> "${result}"`);
    return result;
  }
  
  if (lowerName.includes('-dada')) {
    const baseName = name.substring(0, name.toLowerCase().indexOf('-dada'));
    const result = `${capitalizeFirstLetter(baseName)} (Dada)`;
    console.log(`✅ [DADA_FORM] "${name}" -> "${result}"`);
    return result;
  }
  
  // Handle Pikachu cap variants
  if (lowerName.includes('pikachu') && lowerName.includes('cap')) {
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
  const result = capitalizeFirstLetter(name);
  console.log(`🏷️ [NO_TRANSFORM] No transformation patterns matched, returning capitalized: "${name}" -> "${result}"`);
  return result;
};
