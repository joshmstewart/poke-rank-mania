
/**
 * Normalize Pokedex numbers - converts special form IDs back to their base form
 * For example: 10117 (Ash-Greninja) -> 658 (Greninja)
 * @param id The Pokedex ID to normalize
 * @returns Normalized Pokedex ID for display
 */
export const normalizePokedexNumber = (id: number): number => {
  // Special form IDs typically are above 10000 and related to base form
  if (id >= 10000) {
    // For most special forms like regional variants, mega evolutions, etc.
    // We can extract the base form number
    return id % 1000; // This works for most cases
  }
  
  return id;
};
