
import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { Button } from "@/components/ui/button";
import { getPokemonBackgroundColor } from "./utils/PokemonColorUtils";
import InfiniteScrollHandler from "./InfiniteScrollHandler";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";

interface DraggablePokemonCardProps {
  pokemon: Pokemon | RankedPokemon;
  index: number;
  isPending?: boolean;
}

const DraggablePokemonCard: React.FC<DraggablePokemonCardProps> = ({ 
  pokemon, 
  index, 
  isPending = false 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: pokemon.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const backgroundColorClass = getPokemonBackgroundColor(pokemon);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${backgroundColorClass} rounded-lg border border-gray-200 relative overflow-hidden h-40 flex flex-col cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 z-50' : ''
      } ${isPending ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}`}
    >
      {/* Pending indicator */}
      {isPending && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 text-center font-medium">
          Position pending validation
        </div>
      )}

      {/* Info Button */}
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

      {/* Ranking number */}
      <div className={`absolute top-2 left-2 w-7 h-7 bg-white rounded-full flex items-center justify-center text-sm font-bold z-10 shadow-sm border border-gray-200 ${isPending ? 'mt-6' : ''}`}>
        <span className="text-black">{index + 1}</span>
      </div>
      
      {/* Pokemon image */}
      <div className={`flex-1 flex justify-center items-center px-2 pb-1 ${isPending ? 'pt-8' : 'pt-6'}`}>
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
      
      {/* Pokemon info */}
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
  const maxItems = getMaxItemsForTier();
  const displayRankings = localRankings.slice(0, Math.min(milestoneDisplayCount, maxItems));
  const hasMoreToLoad = milestoneDisplayCount < maxItems;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update local rankings when formattedRankings changes
  React.useEffect(() => {
    setLocalRankings(formattedRankings);
  }, [formattedRankings]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = displayRankings.findIndex(pokemon => pokemon.id === active.id);
      const newIndex = displayRankings.findIndex(pokemon => pokemon.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        console.log(`🔄 [DRAG_REORDER] Moving Pokemon ${active.id} from position ${oldIndex + 1} to ${newIndex + 1}`);
        
        // Update local rankings immediately for visual feedback
        setLocalRankings(current => {
          const newRankings = [...current];
          const [removed] = newRankings.splice(oldIndex, 1);
          newRankings.splice(newIndex, 0, removed);
          return newRankings;
        });

        // Trigger refinement battles
        onManualReorder(active.id as number, oldIndex, newIndex);
      }
    }
  };

  console.log(`🏆 [MILESTONE_RENDER_ULTRA_DEBUG] About to render ${displayRankings.length} Pokemon in draggable milestone view`);
  
  return (
    <div className="bg-white p-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <h1 className="text-xl font-bold text-gray-800">
            Milestone: {battlesCompleted} Battles
          </h1>
          <span className="text-gray-500 text-sm">
            (Showing {displayRankings.length} of {activeTier === "All" ? maxItems : Math.min(Number(activeTier), maxItems)})
          </span>
          {pendingRefinements.size > 0 && (
            <span className="text-yellow-600 text-sm font-medium">
              • {pendingRefinements.size} pending validation{pendingRefinements.size > 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        <Button 
          onClick={onContinueBattles}
          className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-lg font-medium"
        >
          Continue Battles
        </Button>
      </div>

      {/* Draggable Grid Layout */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={displayRankings.map(p => p.id)} 
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-5 gap-4 mb-6">
            {displayRankings.map((pokemon, index) => (
              <DraggablePokemonCard
                key={pokemon.id}
                pokemon={pokemon}
                index={index}
                isPending={pendingRefinements.has(pokemon.id)}
              />
            ))}
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
