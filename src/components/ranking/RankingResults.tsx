import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pokemon, generations } from "@/services/pokemon"; // ✅ FIXED: generations imported
import { useCompletionTracker } from "@/hooks/battle/useCompletionTracker";

const generationDetails: Record<number, { region: string; games: string }> = {
  1: { region: "Kanto", games: "Red, Blue, Yellow" },
  2: { region: "Johto", games: "Gold, Silver, Crystal" },
  3: { region: "Hoenn", games: "Ruby, Sapphire, Emerald" },
  4: { region: "Sinnoh", games: "Diamond, Pearl, Platinum" },
  5: { region: "Unova", games: "Black, White, Black 2, White 2" },
  6: { region: "Kalos", games: "X, Y" },
  7: { region: "Alola", games: "Sun, Moon, Ultra Sun, Ultra Moon" },
  8: { region: "Galar", games: "Sword, Shield" },
  9: { region: "Paldea", games: "Scarlet, Violet" },
};

const getPokemonGeneration = (pokemonId: number) => {
  return generations.find(
    (gen) => pokemonId >= gen.start && pokemonId <= gen.end && gen.id !== 0
  );
};

interface ImageWithFallbackProps {
  pokemonId: number;
  pokemonName: string;
  initialSrc: string;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  pokemonId,
  pokemonName,
  initialSrc,
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>(initialSrc);
  const [retryCount, setRetryCount] = useState(0);
  const [imageError, setImageError] = useState(false);
  const maxRetries = 3;

  useEffect(() => {
    const preload = (src: string) => {
      const img = new Image();
      img.src = src;
    };

    preload(initialSrc);
    preload(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`);
    preload(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokemonId}.png`);
    preload(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`);
  }, [pokemonId, initialSrc]);

  const handleImageError = () => {
    if (retryCount < maxRetries) {
      setRetryCount((prev) => prev + 1);
      const fallbacks = [
        initialSrc,
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`,
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokemonId}.png`,
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`,
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
      onLoad={() => setImageError(false)}
      onError={handleImageError}
      loading="lazy"
    />
  );
};

export const RankingResults: React.FC = () => {
  const {
    getConfidentRankedPokemon,
    getOverallRankingProgress,
    confidenceScores,
  } = useCompletionTracker();

  const confidentPokemon = getConfidentRankedPokemon(0.8);
  const progress = getOverallRankingProgress();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">
        Your Pokémon Rankings ({confidentPokemon.length} shown, {progress}% complete)
      </h2>
      {confidentPokemon.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Rank</TableHead>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Generation</TableHead>
              <TableHead>Region</TableHead>
              <TableHead className="w-24 text-right">Confidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {confidentPokemon.map((pokemon, index) => {
              const generation = getPokemonGeneration(pokemon.id); // ✅ Correct usage
              const genId = generation?.id || 0;
              const region = generationDetails[genId]?.region || "Unknown";
              const confidence = confidenceScores?.[pokemon.id] ?? 0;

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
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {confidence}%
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>You haven't ranked enough Pokémon to show confident results yet.</p>
          <p className="mt-2">Keep battling to refine your rankings!</p>
        </div>
      )}
    </div>
  );
};
