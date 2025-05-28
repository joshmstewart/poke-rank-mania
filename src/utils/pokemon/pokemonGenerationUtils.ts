
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
