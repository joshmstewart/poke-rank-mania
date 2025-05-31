
import React from "react";
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import DraggablePokemonMilestoneCard from "./DraggablePokemonMilestoneCard";

interface DraggableMilestoneGridProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  localPendingRefinements: Set<number>;
}

const DraggableMilestoneGrid: React.FC<DraggableMilestoneGridProps> = ({
  displayRankings,
  localPendingRefinements
}) => {
  return (
    <SortableContext 
      items={displayRankings.map(p => p.id)} 
      strategy={rectSortingStrategy}
    >
      <div className="grid grid-cols-5 gap-4 mb-6">
        {displayRankings.map((pokemon, index) => {
          const isPending = localPendingRefinements.has(pokemon.id);
          
          return (
            <DraggablePokemonMilestoneCard
              key={pokemon.id}
              pokemon={pokemon}
              index={index}
              isPending={isPending}
            />
          );
        })}
      </div>
    </SortableContext>
  );
};

export default DraggableMilestoneGrid;
