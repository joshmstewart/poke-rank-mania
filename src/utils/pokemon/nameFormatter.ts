import { capitalizeFirstLetter, capitalizeWords } from './helpers';

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
  
  const lowerName = name.toLowerCase();
  console.log(`🔧 [FORMAT_ULTRA_DEBUG] Lowercase: "${lowerName}"`);
  
  // CRITICAL GMAX CHECK WITH ULTRA LOGGING
  const containsGmax = lowerName.includes('-gmax');
  console.log(`🎯 [GMAX_ULTRA_DEBUG] Contains '-gmax': ${containsGmax}`);
  console.log(`🎯 [GMAX_ULTRA_DEBUG] Exact match check: "${lowerName}" includes "-gmax": ${lowerName.includes('-gmax')}`);
  
  if (containsGmax) {
    console.log(`🎯 [GMAX_ULTRA_DEBUG] GMAX DETECTED! Processing: "${name}"`);
    
    const gmaxIndex = lowerName.indexOf('-gmax');
    console.log(`🎯 [GMAX_ULTRA_DEBUG] GMAX index: ${gmaxIndex}`);
    
    const baseName = name.substring(0, gmaxIndex);
    console.log(`🎯 [GMAX_ULTRA_DEBUG] Base name extracted: "${baseName}"`);
    
    const capitalizedBase = capitalizeFirstLetter(baseName);
    console.log(`🎯 [GMAX_ULTRA_DEBUG] Capitalized base: "${capitalizedBase}"`);
    
    const result = `G-Max ${capitalizedBase}`;
    console.log(`🎯 [GMAX_ULTRA_DEBUG] FINAL GMAX RESULT: "${result}"`);
    console.log(`🎯 [GMAX_ULTRA_DEBUG] Result contains 'G-Max': ${result.includes('G-Max')}`);
    console.log(`🔧 [FORMAT_ULTRA_DEBUG] ===== formatPokemonName EXIT (GMAX) =====`);
    return result;
  }
  
  // Check for Alolan forms
  const includesAlola = lowerName.includes('-alola');
  console.log(`🔧 [FORMAT_ULTRA_DEBUG] Contains '-alola': ${includesAlola}`);
  
  if (includesAlola) {
    console.log(`🔧 [FORMAT_ALOLA_DEBUG] Processing Alolan form: "${name}"`);
    const alolaSuffixIndex = name.toLowerCase().indexOf('-alola');
    const baseName = name.substring(0, alolaSuffixIndex);
    const capitalizedBase = capitalizeFirstLetter(baseName);
    const result = `Alolan ${capitalizedBase}`;
    console.log(`🔧 [FORMAT_ALOLA_DEBUG] Alolan result: "${result}"`);
    console.log(`🔧 [FORMAT_ULTRA_DEBUG] ===== formatPokemonName EXIT (ALOLAN) =====`);
    return result;
  }
  
  // Handle Miraidon and Koraidon forms
  if (lowerName.includes('miraidon-')) {
    console.log(`🔧 [FORMAT_DEBUG] Processing Miraidon form: "${name}"`);
    const formPart = name.substring(9); // Remove "miraidon-"
    const formattedForm = capitalizeWords(formPart.replace(/-/g, ' '));
    const result = `Miraidon (${formattedForm})`;
    console.log(`🔧 [FORMAT_DEBUG] Miraidon result: "${result}"`);
    return result;
  }
  
  if (lowerName.includes('koraidon-')) {
    console.log(`🔧 [FORMAT_DEBUG] Processing Koraidon form: "${name}"`);
    const formPart = name.substring(9); // Remove "koraidon-"
    const formattedForm = capitalizeWords(formPart.replace(/-/g, ' '));
    const result = `Koraidon (${formattedForm})`;
    console.log(`🔧 [FORMAT_DEBUG] Koraidon result: "${result}"`);
    return result;
  }
  
  // Handle other regional forms
  if (lowerName.includes('-galar')) {
    const baseName = name.substring(0, name.toLowerCase().indexOf('-galar'));
    const result = `Galarian ${capitalizeFirstLetter(baseName)}`;
    console.log(`🔧 [FORMAT_DEBUG] Galar result: "${result}"`);
    return result;
  }
  
  if (lowerName.includes('-hisui')) {
    const baseName = name.substring(0, name.toLowerCase().indexOf('-hisui'));
    const result = `Hisuian ${capitalizeFirstLetter(baseName)}`;
    console.log(`🔧 [FORMAT_DEBUG] Hisui result: "${result}"`);
    return result;
  }
  
  if (lowerName.includes('-paldea')) {
    const baseName = name.substring(0, name.toLowerCase().indexOf('-paldea'));
    const result = `Paldean ${capitalizeFirstLetter(baseName)}`;
    console.log(`🔧 [FORMAT_DEBUG] Paldea result: "${result}"`);
    return result;
  }
  
  // Handle specific Paldea breed forms like "tauros-paldea-blaze-breed"
  if (lowerName.includes('-paldea-') && (lowerName.includes('-breed') || lowerName.includes('-form'))) {
    const parts = name.toLowerCase().split('-');
    if (parts.length >= 4) {
      const baseName = parts[0];
      const breedType = parts[2]; // "blaze", "aqua", "combat"
      const result = `${capitalizeFirstLetter(baseName)} (Paldean ${capitalizeFirstLetter(breedType)})`;
      console.log(`🔧 [FORMAT_DEBUG] Paldea breed result: "${result}"`);
      return result;
    }
  }
  
  // Handle Mega evolutions
  if (lowerName.includes('-mega-x')) {
    const baseName = name.substring(0, name.toLowerCase().indexOf('-mega-x'));
    const result = `Mega ${capitalizeFirstLetter(baseName)} X`;
    console.log(`🔧 [FORMAT_DEBUG] Mega X result: "${result}"`);
    return result;
  }
  
  if (lowerName.includes('-mega-y')) {
    const baseName = name.substring(0, name.toLowerCase().indexOf('-mega-y'));
    const result = `Mega ${capitalizeFirstLetter(baseName)} Y`;
    console.log(`🔧 [FORMAT_DEBUG] Mega Y result: "${result}"`);
    return result;
  }
  
  if (lowerName.includes('-mega')) {
    const baseName = name.substring(0, name.toLowerCase().indexOf('-mega'));
    const result = `Mega ${capitalizeFirstLetter(baseName)}`;
    console.log(`🔧 [FORMAT_DEBUG] Mega result: "${result}"`);
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
  console.log(`🔧 [FORMAT_ULTRA_DEBUG] No patterns matched for: "${name}"`);
  const result = capitalizeFirstLetter(name);
  console.log(`🔧 [FORMAT_ULTRA_DEBUG] Default capitalization result: "${result}"`);
  console.log(`🔧 [FORMAT_ULTRA_DEBUG] ===== formatPokemonName EXIT (DEFAULT) =====`);
  return result;
};
