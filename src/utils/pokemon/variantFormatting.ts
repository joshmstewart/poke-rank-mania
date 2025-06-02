
import { capitalizeFirstLetter } from './helpers';

/**
 * Handle variants that should be moved to front (like "Iron Moth" from "iron-moth")
 */
export const handleVariantFormatting = (name: string): string | null => {
  if (!name) return null;
  
  // Handle Iron variants (iron-moth -> Iron Moth)
  if (name.startsWith('iron-')) {
    const baseName = name.replace('iron-', '');
    return `Iron ${capitalizeFirstLetter(baseName)}`;
  }
  
  // Handle Great Tusk variants (great-tusk -> Great Tusk)
  if (name.startsWith('great-')) {
    const baseName = name.replace('great-', '');
    return `Great ${capitalizeFirstLetter(baseName)}`;
  }
  
  // Handle Roaring Moon variants (roaring-moon -> Roaring Moon) 
  if (name.startsWith('roaring-')) {
    const baseName = name.replace('roaring-', '');
    return `Roaring ${capitalizeFirstLetter(baseName)}`;
  }
  
  // Handle Walking Wake variants (walking-wake -> Walking Wake)
  if (name.startsWith('walking-')) {
    const baseName = name.replace('walking-', '');
    return `Walking ${capitalizeFirstLetter(baseName)}`;
  }
  
  // Handle Scream Tail variants (scream-tail -> Scream Tail)
  if (name.startsWith('scream-')) {
    const baseName = name.replace('scream-', '');
    return `Scream ${capitalizeFirstLetter(baseName)}`;
  }
  
  return null;
};
