
import React from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { SortableContext, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import SortablePokemonCard from "./SortablePokemonCard";

interface DragDropGridProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  localPendingRefinements: Set<number>;
  pendingBattleCounts?: Map<number, number>;
  onMarkAsPending?: (pokemonId: number) => void;
  onManualReorder?: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  onLocalReorder?: (newRankings: (Pokemon | RankedPokemon)[]) => void;
  availablePokemon?: any[];
}

const DragDropGrid: React.FC<DragDropGridProps> = ({
  displayRankings,
  localPendingRefinements,
  pendingBattleCounts = new Map(),
  onMarkAsPending,
  onManualReorder,
  onLocalReorder,
  availablePokemon = []
}) => {
  console.log(`[DRAG_DROP_GRID] Rendering with ${displayRankings.length} ranked Pokemon`);

  if (displayRankings.length === 0) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <div className="text-gray-500 text-center">
          <p className="text-lg mb-2">No Pokémon ranked yet</p>
          <p className="text-sm">Drag Pokémon from the Available section to start ranking</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[400px]">
      <SortableContext 
        items={displayRankings.map(p => `ranked-${p.id}`)} 
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2 mb-6">
          {displayRankings.map((pokemon, index) => (
            <SortablePokemonCard
              key={pokemon.id}
              id={`ranked-${pokemon.id}`}
              pokemon={pokemon}
              index={index}
              isPending={localPendingRefinements.has(pokemon.id)}
              allRankedPokemon={displayRankings}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

export default DragDropGrid;
