
/**
 * Pokemon filtering logic for forms that should be hidden
 */
export const shouldFilterPokemon = (name: string): boolean => {
  const lowerName = name.toLowerCase();
  
  // Hide Rockruff (Own Tempo)
  if (lowerName.includes('rockruff') && lowerName.includes('own-tempo')) {
    console.log(`🔧 [FORMAT_DEBUG] Filtering out Rockruff (Own Tempo): "${name}"`);
    return true;
  }
  
  // Hide Busted Mimikyu
  if (lowerName.includes('mimikyu') && lowerName.includes('busted')) {
    console.log(`🔧 [FORMAT_DEBUG] Filtering out Busted Mimikyu: "${name}"`);
    return true;
  }
  
  // Hide all Minior meteor forms (e.g., "Minior (Green Meteor)", "minior-red-meteor", etc.)
  if (lowerName.includes('minior') && lowerName.includes('meteor')) {
    console.log(`🔧 [FORMAT_DEBUG] Filtering out Minior meteor form: "${name}"`);
    return true;
  }
  
  // Hide special modes of Koraidon and Miraidon
  if ((lowerName.includes('koraidon') || lowerName.includes('miraidon')) && 
      (lowerName.includes('apex') || lowerName.includes('limited') || 
       lowerName.includes('build') || lowerName.includes('mode'))) {
    console.log(`🔧 [FORMAT_DEBUG] Filtering out special Koraidon/Miraidon mode: "${name}"`);
    return true;
  }
  
  return false;
};
