
import React, { useState } from "react";
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

interface ImageWithFallbackProps {
  pokemonId: number;
  pokemonName: string;
  initialSrc: string;
}

// Component for image with fallbacks
const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ pokemonId, pokemonName, initialSrc }) => {
  const [currentSrc, setCurrentSrc] = useState<string>(initialSrc);
  const [retryCount, setRetryCount] = useState(0);
  const [imageError, setImageError] = useState(false);
  const maxRetries = 3;

  const handleImageError = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      
      const fallbacks = [
        // Original URL (already failed)
        initialSrc,
        // PokeAPI official artwork
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`,
        // Home artwork
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokemonId}.png`,
        // Default sprite as last resort
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`
      ];
      
      const nextSrc = fallbacks[Math.min(retryCount + 1, fallbacks.length - 1)];
      setCurrentSrc(nextSrc);
    } else {
      setImageError(true);
    }
  };

  if (imageError) {
    return (
      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
        #{pokemonId}
      </div>
    );
  }

  return (
    <img 
      src={currentSrc} 
      alt={pokemonName} 
      className="w-full h-full object-contain"
      onError={handleImageError}
    />
  );
};

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
                      <ImageWithFallback 
                        pokemonId={pokemon.id}
                        pokemonName={pokemon.name}
                        initialSrc={pokemon.image}
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
