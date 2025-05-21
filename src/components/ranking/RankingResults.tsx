
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RankedPokemon } from "@/hooks/battle/useRankings";
import { generations, TopNOption } from "@/services/pokemon";
import { Progress } from "@/components/ui/progress"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy } from "lucide-react";

interface RankingResultsProps {
  confidentRankedPokemon: RankedPokemon[];
  confidenceScores: Record<number, number>;
  activeTier?: TopNOption;
  onTierChange?: (tier: TopNOption) => void;
}

const getPokemonGeneration = (pokemonId: number) => {
  return generations.find(
    (gen) => pokemonId >= gen.start && pokemonId <= gen.end && gen.id !== 0
  );
};

export const RankingResults: React.FC<RankingResultsProps> = ({
  confidentRankedPokemon,
  confidenceScores,
  activeTier = "All",
  onTierChange
}) => {
  const tierOptions: TopNOption[] = [10, 25, 50, 100, "All"];
  
  // Filter rankings based on active tier
  const displayRankings = activeTier === "All" 
    ? confidentRankedPokemon
    : confidentRankedPokemon.slice(0, Number(activeTier));
  
  // Calculate just missed cutoff - top 10 outside the current tier
  const justMissedCutoff = activeTier !== "All" 
    ? confidentRankedPokemon.slice(Number(activeTier), Number(activeTier) + 10)
    : [];
  
  // Get the confidence level as a string
  const getConfidenceLevel = (confidenceValue: number) => {
    if (confidenceValue >= 75) return "High";
    if (confidenceValue >= 40) return "Medium";
    return "Low";
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">
          {activeTier === "All" 
            ? "Complete Pokémon Rankings" 
            : `Top ${activeTier} Pokémon Rankings`}
        </h2>
        
        {onTierChange && (
          <div className="flex items-center gap-2 border rounded-md p-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <Select
              value={activeTier.toString()}
              onValueChange={(value) => {
                const newTier = value === "All" ? "All" : Number(value) as TopNOption;
                onTierChange(newTier);
              }}
            >
              <SelectTrigger className="w-[100px] h-8 text-sm">
                <SelectValue placeholder="Select tier" />
              </SelectTrigger>
              <SelectContent>
                {tierOptions.map((tier) => (
                  <SelectItem key={tier} value={tier.toString()}>
                    {tier === "All" ? "All Pokémon" : `Top ${tier}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      <div className="mb-4 p-4 bg-gray-50 rounded-md">
        <h3 className="text-sm font-medium mb-2">About TrueSkill™ Rankings</h3>
        <p className="text-sm text-gray-600">
          Rankings use the TrueSkill™ Bayesian rating system, similar to what Xbox Live uses for matchmaking.
          Each Pokémon has a skill rating (μ) and uncertainty (σ). The displayed score is a conservative estimate (μ - 3σ),
          and the confidence increases as more battles are completed.
        </p>
      </div>
      
      {displayRankings.length > 0 ? (
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
              const confidence = pokemon.confidence || confidenceScores[pokemon.id] || 0;
              const confidenceLevel = getConfidenceLevel(confidence);
              const isFrozen = pokemon.isFrozenForTier && pokemon.isFrozenForTier[activeTier.toString()];
              
              return (
                <TableRow 
                  key={pokemon.id} 
                  className={isFrozen ? "text-gray-400 italic" : ""}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <img 
                      src={pokemon.image} 
                      alt={pokemon.name} 
                      className={`w-10 h-10 object-contain ${isFrozen ? "opacity-50" : ""}`}
                    />
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
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>You haven't ranked enough Pokémon to show confident results yet.</p>
          <p className="mt-2">Keep battling to refine your rankings!</p>
        </div>
      )}

      {/* Just Missed the Cut Section */}
      {justMissedCutoff.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold mb-4">Just Missed The Cut</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-36 text-right">Rating</TableHead>
                <TableHead className="w-16 text-right">Battles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {justMissedCutoff.map((pokemon, index) => {
                const actualRank = Number(activeTier) + index + 1;
                return (
                  <TableRow key={pokemon.id} className="bg-gray-50">
                    <TableCell>{actualRank}</TableCell>
                    <TableCell>
                      <img src={pokemon.image} alt={pokemon.name} className="w-8 h-8 object-contain" />
                    </TableCell>
                    <TableCell>{pokemon.name}</TableCell>
                    <TableCell className="text-right font-mono">
                      {pokemon.score ? pokemon.score.toFixed(1) : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      {pokemon.count || 0}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
