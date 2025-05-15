
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pokemon } from "@/services/pokemon";

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankedPokemon.map((pokemon, index) => (
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
              </TableRow>
            ))}
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
