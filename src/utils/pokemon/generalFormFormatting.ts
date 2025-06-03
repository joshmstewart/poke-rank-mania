
import { capitalizeFirstLetter } from './helpers';

/**
 * Handle general form formatting where the form descriptor should be moved to front
 * Examples: "giratina-altered" -> "Altered Giratina", "calyrex-ice" -> "Ice Calyrex"
 */
export const handleGeneralFormFormatting = (name: string): string | null => {
  if (!name) return null;
  
  const lowerName = name.toLowerCase();
  
  // Skip if this is a regional form (handled elsewhere)
  if (lowerName.includes('-alola') || lowerName.includes('-galar') || 
      lowerName.includes('-hisui') || lowerName.includes('-paldea')) {
    return null;
  }
  
  // Skip if this is a special form (handled elsewhere)
  if (lowerName.includes('-mega') || lowerName.includes('-primal') || 
      lowerName.includes('-gmax') || lowerName.includes('-origin')) {
    return null;
  }
  
  // Skip if this is handled by specific handlers
  if (lowerName.includes('deoxys-') || lowerName.includes('rotom-') || 
      lowerName.includes('giratina-origin') || lowerName.includes('shaymin-sky')) {
    return null;
  }
  
  // Skip variant formatting cases (iron-, great-, etc.)
  if (lowerName.startsWith('iron-') || lowerName.startsWith('great-') || 
      lowerName.startsWith('roaring-') || lowerName.startsWith('walking-') || 
      lowerName.startsWith('scream-')) {
    return null;
  }
  
  // General pattern: pokemon-form -> Form Pokemon
  const parts = name.split('-');
  if (parts.length === 2) {
    const [baseName, formName] = parts;
    
    // Special cases to skip
    if (lowerName.includes('-totem') || lowerName.includes('-hero') || 
        lowerName.includes('-large') || lowerName.includes('-dada')) {
      return null;
    }
    
    const capitalizedBase = capitalizeFirstLetter(baseName);
    const capitalizedForm = capitalizeFirstLetter(formName);
    
    console.log(`🔧 [GENERAL_FORM_DEBUG] Processing: "${name}" -> "${capitalizedForm} ${capitalizedBase}"`);
    return `${capitalizedForm} ${capitalizedBase}`;
  }
  
  return null;
};
