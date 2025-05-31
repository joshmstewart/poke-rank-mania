
import React, { useState, useEffect } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { Button } from "@/components/ui/button";
import { getPokemonBackgroundColor } from "./utils/PokemonColorUtils";
import InfiniteScrollHandler from "./InfiniteScrollHandler";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";
import AutoBattleLogsModal from "./AutoBattleLogsModal";
import { usePendingRefinementsManager } from "@/hooks/battle/usePendingRefinementsManager";
import { useDragAndDrop } from "@/hooks/battle/useDragAndDrop";
import {
  DndContext,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DraggableMilestoneViewProps {
  formattedRankings: (Pokemon | RankedPokemon)[];
  battlesCompleted: number;
  activeTier: TopNOption;
  milestoneDisplayCount: number;
  onContinueBattles: () => void;
  onLoadMore: () => void;
  getMaxItemsForTier: () => number;
  onManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  pendingRefinements?: Set<number>;
}

// Individual draggable Pokemon card component that looks EXACTLY like the original
const DraggablePokemonMilestoneCard: React.FC<{
  pokemon: Pokemon | RankedPokemon;
  index: number;
  isPending: boolean;
}> = ({ pokemon, index, isPending }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: pokemon.id,
    data: {
      pokemon,
      index
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
  };

  const backgroundColorClass = getPokemonBackgroundColor(pokemon);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${backgroundColorClass} rounded-lg border border-gray-200 relative overflow-hidden h-40 flex flex-col cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-60 z-50 scale-105 shadow-2xl' : 'hover:shadow-lg transition-all duration-200'
      } ${isPending ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
      {...attributes}
      {...listeners}
    >
      {/* Pending banner if needed */}
      {isPending && (
        <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white text-xs py-1 px-2 z-20">
          Pending Battle
        </div>
      )}

      {/* Info Button - more subtle design */}
      <div className="absolute top-1 right-1 z-30">
        <PokemonInfoModal pokemon={pokemon}>
          <button 
            className="w-5 h-5 rounded-full bg-white/80 hover:bg-white border border-gray-300 text-gray-600 hover:text-gray-800 flex items-center justify-center text-xs font-medium shadow-sm transition-all duration-200 backdrop-blur-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            i
          </button>
        </PokemonInfoModal>
      </div>

      {/* Ranking number - white circle with black text in top left exactly like image */}
      <div className="absolute top-2 left-2 w-7 h-7 bg-white rounded-full flex items-center justify-center text-sm font-bold z-10 shadow-sm border border-gray-200">
        <span className="text-black">{index + 1}</span>
      </div>
      
      {/* Pokemon image - larger and taking up more space */}
      <div className="flex-1 flex justify-center items-center px-2 pt-6 pb-1">
        <img 
          src={pokemon.image} 
          alt={pokemon.name}
          className="w-20 h-20 object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
      
      {/* Pokemon info - white section at bottom exactly like image */}
      <div className="bg-white text-center py-2 px-2 mt-auto border-t border-gray-100">
        <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1">
          {pokemon.name}
        </h3>
        <div className="text-xs text-gray-600">
          #{pokemon.id}
        </div>
      </div>
    </div>
  );
};

const DraggableMilestoneView: React.FC<DraggableMilestoneViewProps> = ({
  formattedRankings,
  battlesCompleted,
  activeTier,
  milestoneDisplayCount,
  onContinueBattles,
  onLoadMore,
  getMaxItemsForTier,
  onManualReorder,
  pendingRefinements = new Set()
}) => {
  const [localRankings, setLocalRankings] = useState(formattedRankings);
  
  const {
    localPendingRefinements,
    pendingBattleCounts,
    markAsPending,
    updateFromProps
  } = usePendingRefinementsManager(pendingRefinements);
  
  const maxItems = getMaxItemsForTier();
  const displayRankings = localRankings.slice(0, Math.min(milestoneDisplayCount, maxItems));
  const hasMoreToLoad = milestoneDisplayCount < maxItems;

  // Update local state when props change
  useEffect(() => {
    setLocalRankings(formattedRankings);
  }, [formattedRankings]);

  const { sensors, handleDragEnd } = useDragAndDrop({
    displayRankings,
    onManualReorder,
    onLocalReorder: setLocalRankings
  });

  return (
    <div className="bg-white p-6 w-full max-w-7xl mx-auto">
      {/* Header - exactly matching the image */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <h1 className="text-xl font-bold text-gray-800">
            Milestone: {battlesCompleted} Battles
          </h1>
          <span className="text-gray-500 text-sm">
            (Showing {displayRankings.length} of {activeTier === "All" ? maxItems : Math.min(Number(activeTier), maxItems)})
          </span>
          <AutoBattleLogsModal />
        </div>
        
        <Button 
          onClick={onContinueBattles}
          className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-lg font-medium"
        >
          Continue Battles
        </Button>
      </div>

      {/* Draggable Grid Layout - exactly 5 columns like the reference with softer colors */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
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
      </DndContext>

      <InfiniteScrollHandler 
        hasMoreToLoad={hasMoreToLoad}
        currentCount={displayRankings.length}
        maxItems={maxItems}
        onLoadMore={onLoadMore}
      />
    </div>
  );
};

export default DraggableMilestoneView;
