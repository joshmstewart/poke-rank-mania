
import { capitalizeFirstLetter } from './helpers';

/**
 * Handle special form Pokemon names (Mega, Primal, Origin, G-Max, etc.)
 */
export const handleSpecialForms = (name: string): string | null => {
  const lowerName = name.toLowerCase();
  
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
    return result;
  }
  
  // Handle Mega evolutions - properly capitalize the Pokemon name
  if (lowerName.includes('-mega-x')) {
    console.log(`🔧 [MEGA_DEBUG] Processing Mega X form: "${name}"`);
    const baseName = name.substring(0, name.toLowerCase().indexOf('-mega-x'));
    const capitalizedBase = capitalizeFirstLetter(baseName);
    const result = `Mega ${capitalizedBase} X`;
    console.log(`🔧 [MEGA_DEBUG] Mega X result: "${result}"`);
    return result;
  }
  
  if (lowerName.includes('-mega-y')) {
    console.log(`🔧 [MEGA_DEBUG] Processing Mega Y form: "${name}"`);
    const baseName = name.substring(0, name.toLowerCase().indexOf('-mega-y'));
    const capitalizedBase = capitalizeFirstLetter(baseName);
    const result = `Mega ${capitalizedBase} Y`;
    console.log(`🔧 [MEGA_DEBUG] Mega Y result: "${result}"`);
    return result;
  }
  
  if (lowerName.includes('-mega')) {
    console.log(`🔧 [MEGA_DEBUG] Processing Mega form: "${name}"`);
    const baseName = name.substring(0, name.toLowerCase().indexOf('-mega'));
    const capitalizedBase = capitalizeFirstLetter(baseName);
    const result = `Mega ${capitalizedBase}`;
    console.log(`🔧 [MEGA_DEBUG] Mega result: "${result}"`);
    return result;
  }
  
  // Handle Primal forms
  if (lowerName.includes('-primal')) {
    console.log(`🔧 [FORMAT_PRIMAL_DETECTED] Processing Primal form: "${name}"`);
    const baseName = name.substring(0, name.toLowerCase().indexOf('-primal'));
    const capitalizedBase = capitalizeFirstLetter(baseName);
    const result = `Primal ${capitalizedBase}`;
    console.log(`🔧 [FORMAT_PRIMAL_RESULT] "${name}" → "${result}"`);
    return result;
  }
  
  // Handle Origin forms
  if (lowerName.includes('-origin')) {
    console.log(`🔧 [FORMAT_ORIGIN_DETECTED] Processing Origin form: "${name}"`);
    const baseName = name.substring(0, name.toLowerCase().indexOf('-origin'));
    const capitalizedBase = capitalizeFirstLetter(baseName);
    const result = `${capitalizedBase} (Origin Forme)`;
    console.log(`🔧 [FORMAT_ORIGIN_RESULT] "${name}" → "${result}"`);
    return result;
  }
  
  return null;
};
