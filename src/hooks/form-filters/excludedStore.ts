
import { Pokemon } from "@/services/pokemon";

// Store for tracking "excluded" pokemon that were previously in battles
const excludedPokemonStore = new Map<number, Pokemon>();

// Store a Pokemon that gets filtered out (for later re-inclusion)
export const storePokemon = (pokemon: Pokemon): void => {
  excludedPokemonStore.set(pokemon.id, pokemon);
};

// Get previously stored Pokemon when a filter is re-enabled
export const getStoredPokemon = (): Pokemon[] => {
  return Array.from(excludedPokemonStore.values());
};

// Clear stored Pokemon (useful when resetting)
export const clearStoredPokemon = (): void => {
  excludedPokemonStore.clear();
};
