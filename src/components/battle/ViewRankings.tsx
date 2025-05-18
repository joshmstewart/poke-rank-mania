
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { loadRankings as getSavedRankings } from "@/services/pokemon";
import { Pokemon } from "@/services/pokemon";

interface ViewRankingsProps {
  selectedGeneration: number;
  onClose: () => void;
}

// Component for image with fallbacks
const RankingPokemonImage: React.FC<{ pokemon: Pokemon }> = ({ pokemon }) => {
  const [currentSrc, setCurrentSrc] = useState<string>(pokemon.image);
  const [retryCount, setRetryCount] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const maxRetries = 3;

  const handleImageError = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      
      const fallbacks = [
        // Original URL (already failed)
        pokemon.image,
        // PokeAPI official artwork
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`,
        // Home artwork
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokemon.id}.png`,
        // Default sprite as last resort
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
      ];
      
      const nextSrc = fallbacks[Math.min(retryCount + 1, fallbacks.length - 1)];
      setCurrentSrc(nextSrc);
    } else {
      setImageError(true);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <div className="w-10 h-10 flex-shrink-0 relative">
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse rounded"></div>
      )}
      {!imageError ? (
        <img 
          src={currentSrc} 
          alt={pokemon.name} 
          className={`w-full h-full object-contain transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      ) : (
        <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500 p-1">
          #{pokemon.id}
        </div>
      )}
    </div>
  );
};

const ViewRankings: React.FC<ViewRankingsProps> = ({ selectedGeneration: defaultGeneration, onClose }) => {
  const [rankings, setRankings] = useState<Pokemon[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState<number>(defaultGeneration || 0);
  const [hasRankings, setHasRankings] = useState<boolean>(false);
  const [rankingType, setRankingType] = useState<"battle" | "manual">("battle");

  // Load rankings when generation or ranking type changes
  useEffect(() => {
    const savedRankings = getSavedRankings(selectedGeneration, rankingType);
    if (savedRankings && savedRankings.length > 0) {
      setRankings(savedRankings);
      setHasRankings(true);
    } else {
      setRankings([]);
      setHasRankings(false);
    }
  }, [selectedGeneration, rankingType]);

  const handleGenerationChange = (value: string) => {
    setSelectedGeneration(Number(value));
  };

  const handleRankingTypeChange = (value: string) => {
    if (value === "battle" || value === "manual") {
      setRankingType(value);
    }
  };

  return (
    <Card className="container max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" className="mr-2" onClick={onClose}>
            <ChevronLeft className="mr-1" />
            Back
          </Button>
          <CardTitle>Saved Rankings</CardTitle>
        </div>
        <div className="flex gap-2">
          <Select value={rankingType} onValueChange={handleRankingTypeChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Ranking Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="battle">Battle Mode</SelectItem>
              <SelectItem value="manual">Manual Rank</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedGeneration.toString()} onValueChange={handleGenerationChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Generation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">All Generations</SelectItem>
              <SelectItem value="1">Generation I</SelectItem>
              <SelectItem value="2">Generation II</SelectItem>
              <SelectItem value="3">Generation III</SelectItem>
              <SelectItem value="4">Generation IV</SelectItem>
              <SelectItem value="5">Generation V</SelectItem>
              <SelectItem value="6">Generation VI</SelectItem>
              <SelectItem value="7">Generation VII</SelectItem>
              <SelectItem value="8">Generation VIII</SelectItem>
              <SelectItem value="9">Generation IX</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {hasRankings ? (
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {rankings.map((pokemon, index) => (
              <div key={pokemon.id} className="flex items-center p-2 border rounded-md">
                <div className="font-bold text-sm mr-2">#{index + 1}</div>
                <RankingPokemonImage pokemon={pokemon} />
                <div className="ml-2 overflow-hidden">
                  <div className="font-medium text-sm truncate">{pokemon.name}</div>
                  <div className="text-xs text-gray-500">#{pokemon.id}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No {rankingType} rankings saved for {selectedGeneration === 0 ? "All Generations" : `Generation ${selectedGeneration}`}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ViewRankings;
