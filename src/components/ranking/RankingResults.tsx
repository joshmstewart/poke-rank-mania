
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
import { generations } from "@/services/pokemon";
import { Progress } from "@/components/ui/progress"; 

interface RankingResultsProps {
  confidentRankedPokemon: RankedPokemon[];
  confidenceScores: Record<number, number>;
}

const getPokemonGeneration = (pokemonId: number) => {
  return generations.find(
    (gen) => pokemonId >= gen.start && pokemonId <= gen.end && gen.id !== 0
  );
};

export const RankingResults: React.FC<RankingResultsProps> = ({
  confidentRankedPokemon,
  confidenceScores,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">
        Your Pokémon Rankings ({confidentRankedPokemon.length} shown)
      </h2>
      
      <div className="mb-4 p-4 bg-gray-50 rounded-md">
        <h3 className="text-sm font-medium mb-2">About TrueSkill™ Rankings</h3>
        <p className="text-sm text-gray-600">
          Rankings use the TrueSkill™ Bayesian rating system, similar to what Xbox Live uses for matchmaking.
          Each Pokémon has a skill rating (μ) and uncertainty (σ). The displayed score is a conservative estimate (μ - 3σ),
          and the confidence increases as more battles are completed.
        </p>
      </div>
      
      {confidentRankedPokemon.length > 0 ? (
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
            {confidentRankedPokemon.map((pokemon, index) => {
              const generation = getPokemonGeneration(pokemon.id);
              const confidence = pokemon.confidence || confidenceScores[pokemon.id] || 0;
              
              return (
                <TableRow key={pokemon.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <img src={pokemon.image} alt={pokemon.name} className="w-10 h-10 object-contain"/>
                  </TableCell>
                  <TableCell>{pokemon.name}</TableCell>
                  <TableCell>#{pokemon.id}</TableCell>
                  <TableCell>{generation?.name || "Unknown"}</TableCell>
                  <TableCell className="text-right font-mono">
                    {pokemon.score ? pokemon.score.toFixed(1) : "N/A"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={confidence} className="h-2" />
                      <span className="text-xs">{confidence.toFixed(0)}%</span>
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
    </div>
  );
};
