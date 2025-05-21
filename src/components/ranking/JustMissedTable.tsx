
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RankedPokemon, TopNOption } from "@/services/pokemon";

interface JustMissedTableProps {
  justMissedCutoff: RankedPokemon[];
  activeTier: TopNOption;
}

export const JustMissedTable: React.FC<JustMissedTableProps> = ({ 
  justMissedCutoff, 
  activeTier 
}) => {
  if (justMissedCutoff.length === 0) {
    return null;
  }

  return (
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
            const actualRank = activeTier !== "All" ? Number(activeTier) + index + 1 : index + 1;
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
  );
};
