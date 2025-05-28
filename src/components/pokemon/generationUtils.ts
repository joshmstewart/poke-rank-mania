
import { generations } from "@/services/pokemon";

// Mapping of generation IDs to regions and games
export const generationDetails: Record<number, { region: string, games: string }> = {
  1: { region: "Kanto", games: "Red, Blue, Yellow" },
  2: { region: "Johto", games: "Gold, Silver, Crystal" },
  3: { region: "Hoenn", games: "Ruby, Sapphire, Emerald" },
  4: { region: "Sinnoh", games: "Diamond, Pearl, Platinum" },
  5: { region: "Unova", games: "Black, White, Black 2, White 2" },
  6: { region: "Kalos", games: "X, Y" },
  7: { region: "Alola", games: "Sun, Moon, Ultra Sun, Ultra Moon" },
  8: { region: "Galar", games: "Sword, Shield" },
  9: { region: "Paldea", games: "Scarlet, Violet" }
};

// Function to get generation info for a Pokemon
export const getPokemonGeneration = (pokemonId: number) => {
  return generations.find(gen => 
    pokemonId >= gen.start && pokemonId <= gen.end && gen.id !== 0
  );
};
