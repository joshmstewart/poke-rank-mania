
import { capitalizeFirstLetter, capitalizeWords } from './helpers';

/**
 * Handle specific Pokemon variants and special cases
 */
export const handlePokemonVariants = (name: string): string | null => {
  const lowerName = name.toLowerCase();
  
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
  
  // Handle totem forms like "mimikyu-totem-busted"
  if (lowerName.includes('-totem')) {
    console.log(`🔧 [FORMAT_TOTEM_DETECTED] Processing Totem form: "${name}"`);
    const baseName = name.substring(0, name.toLowerCase().indexOf('-totem'));
    const totemPart = name.substring(name.toLowerCase().indexOf('-totem') + 1);
    const capitalizedBase = capitalizeFirstLetter(baseName);
    const result = `${capitalizedBase} (${capitalizeWords(totemPart.replace(/-/g, ' '))})`;
    console.log(`🔧 [FORMAT_TOTEM_RESULT] "${name}" → "${result}"`);
    return result;
  }
  
  // Handle special forms like "palafin-hero", "minior-orange-meteor"
  if (lowerName.includes('-hero')) {
    console.log(`🔧 [FORMAT_HERO_DETECTED] Processing Hero form: "${name}"`);
    const baseName = name.substring(0, name.toLowerCase().indexOf('-hero'));
    const capitalizedBase = capitalizeFirstLetter(baseName);
    const result = `${capitalizedBase} (Hero)`;
    console.log(`🔧 [FORMAT_HERO_RESULT] "${name}" → "${result}"`);
    return result;
  }
  
  if (lowerName.includes('-orange-meteor')) {
    console.log(`🔧 [FORMAT_METEOR_DETECTED] Processing Orange Meteor form: "${name}"`);
    const baseName = name.substring(0, name.toLowerCase().indexOf('-orange-meteor'));
    const capitalizedBase = capitalizeFirstLetter(baseName);
    const result = `${capitalizedBase} (Orange Meteor)`;
    console.log(`🔧 [FORMAT_METEOR_RESULT] "${name}" → "${result}"`);
    return result;
  }
  
  if (lowerName.includes('-large')) {
    console.log(`🔧 [FORMAT_LARGE_DETECTED] Processing Large form: "${name}"`);
    const baseName = name.substring(0, name.toLowerCase().indexOf('-large'));
    const capitalizedBase = capitalizeFirstLetter(baseName);
    const result = `${capitalizedBase} (Large)`;
    console.log(`🔧 [FORMAT_LARGE_RESULT] "${name}" → "${result}"`);
    return result;
  }
  
  if (lowerName.includes('-dada')) {
    console.log(`🔧 [FORMAT_DADA_DETECTED] Processing Dada form: "${name}"`);
    const baseName = name.substring(0, name.toLowerCase().indexOf('-dada'));
    const capitalizedBase = capitalizeFirstLetter(baseName);
    const result = `${capitalizedBase} (Dada)`;
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
  
  return null;
};
