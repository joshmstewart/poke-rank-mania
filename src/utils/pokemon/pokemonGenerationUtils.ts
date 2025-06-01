import { generations } from "@/services/pokemon";

// Mapping of variant Pokemon IDs to their base species IDs
const variantToBaseMapping: Record<number, number> = {
  // Aegislash forms
  10026: 681, // Aegislash-blade -> Aegislash
  10027: 681, // Aegislash-shield -> Aegislash
  
  // Add more mappings as needed for other variant forms
  // This ensures each variant gets the correct species data
};

// Get base Pokemon ID for variant forms
export const getBasePokemonId = (pokemonId: number) => {
  // Check if this is a known variant form
  if (variantToBaseMapping[pokemonId]) {
    console.log(`🔧 [BASE_ID_DEBUG] Mapping variant ${pokemonId} to base ${variantToBaseMapping[pokemonId]}`);
    return variantToBaseMapping[pokemonId];
  }
  
  // For IDs above 1025, try to find the base form
  if (pokemonId > 1025) {
    // For now, return the Pokemon ID as-is and let the API handle it
    // This prevents incorrect mappings
    console.log(`🔧 [BASE_ID_DEBUG] High ID ${pokemonId} - using as-is`);
    return pokemonId;
  }
  
  console.log(`🔧 [BASE_ID_DEBUG] Standard Pokemon ${pokemonId} - using as-is`);
  return pokemonId;
};

// Get generation name from Pokemon ID
export const getGenerationName = (pokemonId: number) => {
  const baseId = getBasePokemonId(pokemonId);
  const generation = generations.find(gen => 
    gen.id !== 0 && baseId >= gen.start && baseId <= gen.end
  );
  return generation ? generation.name : "Unknown Generation";
};

/**
 * Extract the base Pokemon name from any variant form
 * For example: "charizard-mega-x" -> "charizard"
 */
export const getBasePokemonName = (pokemonName: string): string => {
  // Handle special cases first
  if (pokemonName.toLowerCase().includes('wooper-paldea')) {
    return 'wooper-paldea'; // Special case for Paldean Wooper
  }
  
  // Remove common prefixes for regional forms
  let name = pokemonName.toLowerCase();
  
  // Strip regional prefixes
  const regionalPrefixes = ['alolan-', 'galarian-', 'hisuian-', 'paldean-'];
  for (const prefix of regionalPrefixes) {
    if (name.startsWith(prefix)) {
      name = name.substring(prefix.length);
      break;
    }
  }
  
  // Remove form suffixes (mega-, gmax-, etc)
  name = name.replace(/-mega(-[xy])?$|-gmax$|-gigantamax$|-primal$|-origin$|-blade$|-shield$|-altered$|-white$|-black$|-sky$|-therian$|-incarnate$|-complete$|-50$|-10$|-crowned$/, '');
  
  // Handle special format with hyphens (we want to keep base name only)
  if (name.includes('-')) {
    // Only take the part before the first hyphen, which is usually the base Pokemon name
    name = name.split('-')[0];
  }
  
  return name;
};
