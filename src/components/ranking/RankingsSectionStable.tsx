import React, { useMemo, useCallback } from "react";
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useStableSortable } from "@/hooks/battle/useStableSortable";
import PokemonCard from "@/components/PokemonCard";

interface RankingsSectionStableProps {
  displayRankings: any[];
  onManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  onLocalReorder: (newRankings: any[]) => void;
  pendingRefinements: Set<number>;
  availablePokemon: any[];
}

const SortableRankingCard: React.FC<{
  pokemon: any;
  index: number;
}> = React.memo(({ pokemon, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    style
  } = useStableSortable({
    id: pokemon.id.toString(),
    data: {
      type: 'ranking-pokemon',
      pokemon: pokemon,
      index: index
    }
  });

  console.log(`🎯 [SORTABLE_RANKING_CARD] ${pokemon.name} (${pokemon.id}) - isDragging: ${isDragging}`);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`transition-all duration-200 ${isDragging ? 'opacity-50 scale-105 z-50' : ''}`}
    >
      <PokemonCard
        pokemon={pokemon}
        compact={true}
        viewMode="grid"
        isDragging={isDragging}
      />
    </div>
  );
});

SortableRankingCard.displayName = 'SortableRankingCard';

export const RankingsSectionStable: React.FC<RankingsSectionStableProps> = React.memo(({
  displayRankings,
  onManualReorder,
  onLocalReorder,
  pendingRefinements,
  availablePokemon
}) => {
  console.log(`🏆 [RANKINGS_SECTION_STABLE] Rendering with ${displayRankings.length} rankings`);

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: 'rankings-drop-zone',
    data: {
      type: 'rankings-container',
      accepts: ['available-pokemon', 'ranking-pokemon']
    }
  });

  // Memoize sortable items
  const sortableItems = useMemo(() => 
    displayRankings.map(p => p.id.toString()),
    [displayRankings]
  );

  // Memoized ranking cards
  const rankingCards = useMemo(() => 
    displayRankings.map((pokemon, index) => (
      <SortableRankingCard
        key={pokemon.id}
        pokemon={pokemon}
        index={index}
      />
    )),
    [displayRankings]
  );

  if (displayRankings.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Your Rankings</h2>
          <span className="text-sm text-gray-500">0 Pokémon</span>
        </div>
        
        <div
          ref={setDroppableRef}
          className="flex-1 flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg m-4"
        >
          <div className="text-center">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No Rankings Yet
            </h3>
            <p className="text-gray-500 text-sm">
              Drag Pokémon here to start ranking them
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">Your Rankings</h2>
        <span className="text-sm text-gray-500">{displayRankings.length} Pokémon</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4" ref={setDroppableRef}>
        <SortableContext 
          items={sortableItems}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {rankingCards}
          </div>
        </SortableContext>
      </div>
    </div>
  );
});

RankingsSectionStable.displayName = 'RankingsSectionStable';
