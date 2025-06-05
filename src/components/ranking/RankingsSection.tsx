
import React from "react";
import DroppableRankingCard from "@/components/pokemon/DroppableRankingCard";

interface RankingsSectionProps {
  displayRankings: any[];
  onManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  onLocalReorder: (newRankings: any[]) => void;
  pendingRefinements: Set<number>;
  availablePokemon: any[];
}

export const RankingsSection: React.FC<RankingsSectionProps> = ({
  displayRankings,
  onManualReorder,
  onLocalReorder,
  pendingRefinements,
  availablePokemon
}) => {
  const maxSlots = Math.max(displayRankings.length, 10); // Show at least 10 slots

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span className="text-xl">🏆</span>
          Rankings ({displayRankings.length})
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Drag Pokémon here to rank them
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: maxSlots }, (_, index) => {
            const pokemon = displayRankings[index];
            return (
              <DroppableRankingCard
                key={`ranking-slot-${index}`}
                pokemon={pokemon}
                rank={index}
                showRank={true}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
