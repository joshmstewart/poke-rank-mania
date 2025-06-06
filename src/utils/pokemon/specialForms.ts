
import { capitalizeFirstLetter } from './helpers';

/**
 * Handle special forms like Mega, Gigantamax, Primal, Origin, Deoxys, etc.
 * These forms should be moved to the front of the name
 */
export const handleSpecialForms = (name: string): string | null => {
  if (!name) return null;

  // Handle Deoxys forms specifically (must come first before general mega/primal handling)
  if (name.toLowerCase().includes('deoxys')) {
    console.log(`🎯 [SPECIAL_FORMS_DEOXYS_DEBUG] Processing Deoxys: "${name}"`);
    
    // Handle all Deoxys forms
    if (name.match(/deoxys-normal/i)) {
      console.log(`🎯 [SPECIAL_FORMS_DEOXYS_DEBUG] Found normal form: "${name}" -> "Deoxys"`);
      return 'Deoxys';
    }
    if (name.match(/deoxys-attack/i)) {
      console.log(`🎯 [SPECIAL_FORMS_DEOXYS_DEBUG] Found attack form: "${name}" -> "Attack Deoxys"`);
      return 'Attack Deoxys';
    }
    if (name.match(/deoxys-defense/i)) {
      console.log(`🎯 [SPECIAL_FORMS_DEOXYS_DEBUG] Found defense form: "${name}" -> "Defense Deoxys"`);
      return 'Defense Deoxys';
    }
    if (name.match(/deoxys-speed/i)) {
      console.log(`🎯 [SPECIAL_FORMS_DEOXYS_DEBUG] Found speed form: "${name}" -> "Speed Deoxys"`);
      return 'Speed Deoxys';
    }
    
    // Fallback for any other Deoxys form
    console.log(`🎯 [SPECIAL_FORMS_DEOXYS_DEBUG] Fallback for: "${name}" -> "Deoxys"`);
    return 'Deoxys';
  }

  // Gigantamax forms (G-Max)
  if (name.match(/(.+)-gmax$/i)) {
    const baseName = name.replace(/-gmax$/i, '');
    return `G-Max ${capitalizeFirstLetter(baseName)}`;
  }

  // Mega forms
  if (name.match(/(.+)-mega(-[xy])?$/i)) {
    const match = name.match(/(.+)-mega(-[xy])?$/i);
    if (match) {
      const baseName = match[1];
      const variant = match[2] ? ` ${match[2].replace('-', '').toUpperCase()}` : '';
      return `Mega ${capitalizeFirstLetter(baseName)}${variant}`;
    }
  }

  // Primal forms
  if (name.match(/(.+)-primal$/i)) {
    const baseName = name.replace(/-primal$/i, '');
    return `Primal ${capitalizeFirstLetter(baseName)}`;
  }

  // Origin forms
  if (name.match(/(.+)-origin$/i)) {
    const baseName = name.replace(/-origin$/i, '');
    return `Origin ${capitalizeFirstLetter(baseName)}`;
  }

  // Ultra Necrozma
  if (name.match(/necrozma-ultra/i)) {
    return 'Ultra Necrozma';
  }

  // Dawn Wings / Dusk Mane Necrozma
  if (name.match(/necrozma-dawn-wings/i)) {
    return 'Dawn Wings Necrozma';
  }
  if (name.match(/necrozma-dusk-mane/i)) {
    return 'Dusk Mane Necrozma';
  }

  // Crowned forms (Zacian/Zamazenta)
  if (name.match(/(.+)-crowned$/i)) {
    const baseName = name.replace(/-crowned$/i, '');
    return `${capitalizeFirstLetter(baseName)} (Crowned)`;
  }

  // Eternamax Eternatus
  if (name.match(/eternatus-eternamax/i)) {
    return 'Eternamax Eternatus';
  }

  // White/Black Kyurem
  if (name.match(/kyurem-white/i)) {
    return 'White Kyurem';
  }
  if (name.match(/kyurem-black/i)) {
    return 'Black Kyurem';
  }

  return null; // No special form pattern matched
};
