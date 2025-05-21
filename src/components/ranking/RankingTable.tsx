
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress"; 
import { RankedPokemon, TopNOption } from "@/services/pokemon";
import { getPokemonGeneration } from "./rankingUtils";
import { PokemonSuggestionCard } from "./PokemonSuggestionCard";

interface RankingTableProps {
  displayRankings: RankedPokemon[];
  activeTier: TopNOption;
  onSuggestRanking?: (pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => void;
  onRemoveSuggestion?: (pokemonId: number) => void;
}

// Get the confidence level as a string
const getConfidenceLevel = (confidenceValue: number) => {
  if (confidenceValue >= 75) return "High";
  if (confidenceValue >= 40) return "Medium";
  return "Low";
};

export const RankingTable: React.FC<RankingTableProps> = ({ 
  displayRankings, 
  activeTier,
  onSuggestRanking = () => {}, 
  onRemoveSuggestion = () => {} 
}) => {
  if (displayRankings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>You haven't ranked enough Pokémon to show confident results yet.</p>
        <p className="mt-2">Keep battling to refine your rankings!</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Rank</TableHead>
          <TableHead className="w-16">Image</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="w-16">ID</TableHead>
          <TableHead>Generation</TableHead>
          <TableHead className="w-36 text-right">Rating</TableHead>
          <TableHead className="w-36">Confidence</TableHead>
          <TableHead className="w-16 text-right">Battles</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {displayRankings.map((pokemon, index) => {
          const generation = getPokemonGeneration(pokemon.id);
          const confidence = pokemon.confidence || 0;
          const confidenceLevel = getConfidenceLevel(confidence);
          const isFrozen = pokemon.isFrozenForTier && pokemon.isFrozenForTier[activeTier.toString()];
          
          return (
            <TableRow 
              key={pokemon.id} 
              className={isFrozen ? "text-gray-400 italic" : ""}
            >
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                <PokemonSuggestionCard
                  pokemon={pokemon}
                  onSuggestRanking={onSuggestRanking}
                  onRemoveSuggestion={onRemoveSuggestion}
                >
                  <img 
                    src={pokemon.image} 
                    alt={pokemon.name} 
                    className={`w-10 h-10 object-contain ${isFrozen ? "opacity-50" : ""}`}
                  />
                </PokemonSuggestionCard>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  {pokemon.name}
                  {isFrozen && (
                    <span className="ml-2 text-xs text-gray-500">(Frozen)</span>
                  )}
                </div>
              </TableCell>
              <TableCell>#{pokemon.id}</TableCell>
              <TableCell>{generation?.name || "Unknown"}</TableCell>
              <TableCell className="text-right font-mono">
                {pokemon.score ? pokemon.score.toFixed(1) : "N/A"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={confidence} 
                    className={`h-2 ${
                      confidenceLevel === "High" ? "bg-green-100" : 
                      confidenceLevel === "Medium" ? "bg-yellow-100" : "bg-red-100"
                    }`}
                  />
                  <span 
                    className={`text-xs ${
                      confidenceLevel === "High" ? "text-green-600" : 
                      confidenceLevel === "Medium" ? "text-yellow-600" : "text-red-600"
                    }`}
                    title={`Confidence: ${confidenceLevel} (σ=${pokemon.rating?.sigma.toFixed(2) || "N/A"})`}
                  >
                    {confidence.toFixed(0)}% ({confidenceLevel})
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                {pokemon.count || 0}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
