
import { generations } from "@/services/pokemon";

// Get base Pokemon ID for variant forms
export const getBasePokemonId = (pokemonId: number) => {
  if (pokemonId > 1025) {
    return Math.min(pokemonId, 1025);
  }
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
