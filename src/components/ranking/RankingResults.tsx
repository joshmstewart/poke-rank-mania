
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pokemon, generations } from "@/services/pokemon";

// Mapping of generation IDs to regions and games
const generationDetails: Record<number, { region: string, games: string }> = {
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
const getPokemonGeneration = (pokemonId: number) => {
  return generations.find(gen => 
    pokemonId >= gen.start && pokemonId <= gen.end && gen.id !== 0
  );
};

interface RankingResultsProps {
  rankedPokemon: Pokemon[];
}

export const RankingResults: React.FC<RankingResultsProps> = ({ rankedPokemon }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Your Pokémon Rankings</h2>
      {rankedPokemon.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Rank</TableHead>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Generation</TableHead>
              <TableHead>Region</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankedPokemon.map((pokemon, index) => {
              const generation = getPokemonGeneration(pokemon.id);
              const genId = generation?.id || 0;
              const region = generationDetails[genId]?.region || "Unknown";
              
              return (
                <TableRow key={pokemon.id}>
                  <TableCell className="font-bold">{index + 1}</TableCell>
                  <TableCell>
                    <div className="w-10 h-10">
                      <img 
                        src={pokemon.image} 
                        alt={pokemon.name} 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </TableCell>
                  <TableCell>{pokemon.name}</TableCell>
                  <TableCell>#{pokemon.id}</TableCell>
                  <TableCell>{generation?.name || "Unknown"}</TableCell>
                  <TableCell>{region}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>You haven't ranked any Pokémon yet.</p>
          <p className="mt-2">Go to the "Rank Pokémon" tab to get started!</p>
        </div>
      )}
    </div>
  );
};
