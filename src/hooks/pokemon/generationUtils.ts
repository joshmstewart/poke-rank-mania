
// Function to determine generation based on Pokemon ID with better fallback logic
export const determineGenerationFromId = (pokemonId: number): number => {
  // Standard generation ranges
  if (pokemonId >= 1 && pokemonId <= 151) return 1;
  if (pokemonId >= 152 && pokemonId <= 251) return 2;
  if (pokemonId >= 252 && pokemonId <= 386) return 3;
  if (pokemonId >= 387 && pokemonId <= 493) return 4;
  if (pokemonId >= 494 && pokemonId <= 649) return 5;
  if (pokemonId >= 650 && pokemonId <= 721) return 6;
  if (pokemonId >= 722 && pokemonId <= 809) return 7;
  if (pokemonId >= 810 && pokemonId <= 905) return 8;
  if (pokemonId >= 906 && pokemonId <= 1025) return 9;
  
  // For Pokemon with IDs outside normal ranges (variants, forms, etc.)
  // Try to map them based on the last 3-4 digits or patterns
  if (pokemonId > 10000) {
    // Very high IDs - try modulo 1000 first, then modulo 10000
    const mod1000 = pokemonId % 1000;
    const mod10000 = pokemonId % 10000;
    
    if (mod1000 >= 1 && mod1000 <= 1025) {
      return determineGenerationFromId(mod1000);
    }
    if (mod10000 >= 1 && mod10000 <= 1025) {
      return determineGenerationFromId(mod10000);
    }
  }
  
  // For IDs like 10001-10999, extract the base ID
  if (pokemonId >= 10000 && pokemonId < 11000) {
    const baseId = pokemonId - 10000;
    if (baseId >= 1 && baseId <= 1025) {
      return determineGenerationFromId(baseId);
    }
  }
  
  // Default to latest generation for unknown IDs
  return 9;
};
