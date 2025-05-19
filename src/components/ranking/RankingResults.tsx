import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RankedPokemon } from "@/hooks/ranking/useRankings";
import { generations } from "@/services/pokemon";

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
      {confidentRankedPokemon.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Rank</TableHead>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Generation</TableHead>
              <TableHead className="w-24 text-right">Confidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {confidentRankedPokemon.map((pokemon, index) => {
              const generation = getPokemonGeneration(pokemon.id);
              const confidence = confidenceScores[pokemon.id] || 0;

              return (
                <TableRow key={pokemon.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <img src={pokemon.image} alt={pokemon.name} className="w-10 h-10 object-contain"/>
                  </TableCell>
                  <TableCell>{pokemon.name}</TableCell>
                  <TableCell>#{pokemon.id}</TableCell>
                  <TableCell>{generation?.name || "Unknown"}</TableCell>
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
