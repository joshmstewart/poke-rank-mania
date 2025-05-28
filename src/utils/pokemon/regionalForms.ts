
import { capitalizeFirstLetter, capitalizeWords } from './helpers';

/**
 * Handle regional form Pokemon names (Alolan, Galarian, Hisuian, Paldean)
 */
export const handleRegionalForms = (name: string): string | null => {
  const lowerName = name.toLowerCase();
  
  // Check for Alolan forms
  if (lowerName.includes('-alola')) {
    console.log(`🔧 [FORMAT_ALOLA_DEBUG] Processing Alolan form: "${name}"`);
    const alolaSuffixIndex = name.toLowerCase().indexOf('-alola');
    const baseName = name.substring(0, alolaSuffixIndex);
    const capitalizedBase = capitalizeFirstLetter(baseName);
    const result = `Alolan ${capitalizedBase}`;
    console.log(`🔧 [FORMAT_ALOLA_DEBUG] Alolan result: "${result}"`);
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
  
  return null;
};
