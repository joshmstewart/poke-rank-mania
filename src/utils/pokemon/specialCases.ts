
import { capitalizeWords } from './helpers';

/**
 * Handle special Pokemon cases that don't fit other categories
 */
export const handleSpecialCases = (name: string): string | null => {
  const lowerName = name.toLowerCase();
  
  // SPECIAL CASE: Handle Zygarde forms
  if (lowerName.includes('zygarde')) {
    console.log(`🔧 [FORMAT_DEBUG] Processing Zygarde form: "${name}"`);
    
    if (lowerName.includes('10') || lowerName.includes('ten')) {
      return "Zygarde 10% Power";
    }
    if (lowerName.includes('50') || lowerName.includes('fifty')) {
      return "Zygarde 50%";
    }
    if (lowerName.includes('complete') || lowerName.includes('100')) {
      return "Zygarde 100% Power";
    }
    
    // Default Zygarde (assume it's the 50% form)
    if (name.toLowerCase() === 'zygarde') {
      return "Zygarde 50%";
    }
  }
  
  // SPECIAL CASE: Handle Nidoran with gender symbols
  if (lowerName.includes('nidoran')) {
    if (lowerName.includes('male') || lowerName.includes('-m')) {
      console.log(`🔧 [FORMAT_DEBUG] Nidoran male case: "${name}"`);
      return "Nidoran♂";
    }
    if (lowerName.includes('female') || lowerName.includes('-f')) {
      console.log(`🔧 [FORMAT_DEBUG] Nidoran female case: "${name}"`);
      return "Nidoran♀";
    }
    // If it's just "nidoran" without gender specification
    if (lowerName === 'nidoran') {
      return "Nidoran";
    }
  }
  
  // SPECIAL CASE: Handle Greninja Ash
  if (lowerName.includes('greninja') && lowerName.includes('ash')) {
    console.log(`🔧 [FORMAT_DEBUG] Special Greninja Ash case: "${name}"`);
    return "Ash's Greninja";
  }
  
  // SPECIAL CASE: Handle Maushold family variants
  if (lowerName.includes('maushold') && lowerName.includes('family')) {
    console.log(`🔧 [FORMAT_DEBUG] Processing Maushold family variant: "${name}"`);
    if (lowerName.includes('family-of-three')) {
      return "Maushold (Family of Three)";
    }
    if (lowerName.includes('family-of-four')) {
      return "Maushold (Family of Four)";
    }
    // If it's just a generic family reference, handle it generically
    const parts = name.split('-');
    if (parts.length > 2) {
      const baseName = parts[0];
      const familyParts = parts.slice(1);
      const formattedBase = capitalizeWords(baseName);
      const formattedVariant = capitalizeWords(familyParts.join(' '));
      const result = `${formattedBase} (${formattedVariant})`;
      console.log(`🔧 [FORMAT_DEBUG] Maushold family result: "${result}"`);
      return result;
    }
  }
  
  return null;
};
