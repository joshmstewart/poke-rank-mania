
import { generations } from "@/services/pokemon";

export const getPokemonGeneration = (pokemonId: number) => {
  return generations.find(
    (gen) => pokemonId >= gen.start && pokemonId <= gen.end && gen.id !== 0
  );
};
