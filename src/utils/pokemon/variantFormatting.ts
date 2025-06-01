
import { capitalizeWords } from './helpers';

/**
 * Handle Pokemon variants that should have their form moved to the front
 */
export const handleVariantFormatting = (name: string): string | null => {
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
      
      // Check if this is a regional form or special form (handle these separately)
      if (['alola', 'galar', 'hisui', 'paldea'].includes(variant.toLowerCase()) ||
          ['mega', 'gmax', 'origin', 'primal'].some(special => 
            name.toLowerCase().includes(special))) {
        return null; // Let other handlers take care of this
      }
      
      // This is a color/flavor/variant that should be moved to front
      const formattedBase = capitalizeWords(baseName);
      const formattedVariant = capitalizeWords(variant);
      const result = `${formattedVariant} ${formattedBase}`;
      console.log(`🔧 [FORMAT_DEBUG] Hyphen variant: "${name}" -> "${result}"`);
      return result;
    } else if (parts.length >= 3) {
      const baseName = parts[0];
      const variantParts = parts.slice(1);
      
      // Don't format regional forms this way
      if (!['alola', 'galar', 'hisui', 'paldea'].includes(variantParts[0].toLowerCase())) {
        const formattedBase = capitalizeWords(baseName);
        const formattedVariant = capitalizeWords(variantParts.join(' '));
        const result = `${formattedBase} (${formattedVariant})`;
        console.log(`🔧 [FORMAT_DEBUG] Multi-hyphen variant: "${name}" -> "${result}"`);
        return result;
      }
    }
  }
  
  return null;
};
