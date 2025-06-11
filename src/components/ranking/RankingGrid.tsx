
import React from "react";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, TouchSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import DraggablePokemonMilestoneCard from "@/components/battle/DraggablePokemonMilestoneCard";
import { RankedPokemon } from "@/services/pokemon";
import { Star } from "lucide-react";
import { useCloudPendingBattles } from "@/hooks/battle/useCloudPendingBattles";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { usePokemonContext } from "@/contexts/PokemonContext";

interface RankingGridProps {
  rankedPokemon: RankedPokemon[];
  onReorder: (newOrder: RankedPokemon[]) => void;
  isDraggable?: boolean;
}

const RankingGridCard: React.FC<{ pokemon: RankedPokemon; index: number }> = ({ pokemon, index }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  
  // Use cloud pending battles and Zustand store for queue operations
  const { isPokemonPending, addPendingPokemon, removePendingPokemon } = useCloudPendingBattles();
  const { queueBattlesForReorder } = useTrueSkillStore();
  const { allPokemon } = usePokemonContext();
  
  const isPendingRefinement = isPokemonPending(pokemon.id);

  const handlePrioritizeClick = (e: React.MouseEvent) => {
    // CRITICAL: This MUST be the first line to prevent event bubbling
    e.stopPropagation();
    e.preventDefault();

    console.log(`⭐ [RANKING_GRID_STAR_TOGGLE] Star clicked for ${pokemon.name} - current pending: ${isPendingRefinement}`);

    if (!isPendingRefinement) {
      console.log(`⭐ [RANKING_GRID_STAR_TOGGLE] Adding ${pokemon.name} to CLOUD pending state`);
      addPendingPokemon(pokemon.id);

      if (allPokemon.length > 1) {
        const pool = allPokemon.filter(p => p.id !== pokemon.id);
        const opponents: number[] = [];
        const copy = [...pool];
        while (opponents.length < 3 && copy.length > 0) {
          const rand = Math.floor(Math.random() * copy.length);
          opponents.push(copy.splice(rand, 1)[0].id);
        }
        try {
          queueBattlesForReorder(pokemon.id, opponents, -1);
        } catch (error) {
          console.error('Failed to queue refinement battles from ranking grid', error);
        }
      }
    } else {
      console.log(`⭐ [RANKING_GRID_STAR_TOGGLE] Removing ${pokemon.name} from CLOUD pending state`);
      removePendingPokemon(pokemon.id);
    }
  };

  return (
    <div 
      className="relative bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow p-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Rank badge */}
      <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center z-10">
        {index + 1}
      </div>

      {/* Prioritize button - only visible on card hover */}
      <button
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
        }}
        onClick={handlePrioritizeClick}
        className={`absolute top-2 right-2 z-10 p-1 rounded-full transition-all duration-300 ${
          isPendingRefinement
            ? 'opacity-100'
            : isHovered
              ? 'opacity-100'
              : 'opacity-0 pointer-events-none'
        }`}
        title={isPendingRefinement ? "Remove from refinement queue" : "Prioritize for refinement battle"}
        type="button"
      >
        <Star
          className={`w-5 h-5 transition-all duration-300 ${
            isPendingRefinement 
              ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] filter brightness-125' 
              : 'text-gray-500 hover:text-yellow-500'
          }`}
          fill={isPendingRefinement ? "url(#rankingGridStarGradient)" : "none"}
        />
        {/* SVG gradient definition for shiny star effect */}
        {isPendingRefinement && (
          <svg width="0" height="0" className="absolute">
            <defs>
              <linearGradient id="rankingGridStarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="25%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="75%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
            </defs>
          </svg>
        )}
      </button>

      {/* Pokemon content */}
      <div className="text-center">
        <img 
          src={pokemon.image} 
          alt={pokemon.name} 
          className="w-16 h-16 mx-auto mb-2 object-contain"
        />
        <div className="text-sm font-medium truncate">{pokemon.name}</div>
        <div className="text-xs text-gray-500">#{pokemon.id}</div>
        {pokemon.score && (
          <div className="text-xs text-gray-600 mt-1">
            {pokemon.score.toFixed(1)}
          </div>
        )}
      </div>
    </div>
  );
};

export const RankingGrid: React.FC<RankingGridProps> = ({
  rankedPokemon,
  onReorder,
  isDraggable = true
}) => {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = rankedPokemon.findIndex(pokemon => String(pokemon.id) === String(active.id));
    const newIndex = rankedPokemon.findIndex(pokemon => String(pokemon.id) === String(over.id));

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(rankedPokemon, oldIndex, newIndex);
      onReorder(newOrder);
    }
  };

  const activePokemon = activeId ? rankedPokemon.find(p => String(p.id) === activeId) : null;

  console.log(`🎯 [RANKING_GRID_DEBUG] Rendering RankingGrid with ${rankedPokemon.length} Pokemon`);
  console.log(`🎯 [RANKING_GRID_DEBUG] Passing allRankedPokemon array with length: ${rankedPokemon.length}`);

  if (!isDraggable) {
    // Simple grid without drag and drop
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {rankedPokemon.map((pokemon, index) => (
          <RankingGridCard
            key={pokemon.id}
            pokemon={pokemon}
            index={index}
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext items={rankedPokemon.map(p => String(p.id))} strategy={verticalListSortingStrategy}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {rankedPokemon.map((pokemon, index) => (
            <DraggablePokemonMilestoneCard
              key={pokemon.id}
              pokemon={pokemon}
              index={index}
              showRank={true}
              isDraggable={isDraggable}
              context="ranked"
              allRankedPokemon={rankedPokemon}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activePokemon && (
          <DraggablePokemonMilestoneCard
            pokemon={activePokemon}
            index={rankedPokemon.findIndex(p => p.id === activePokemon.id)}
            showRank={true}
            isDraggable={false}
            context="ranked"
            allRankedPokemon={rankedPokemon}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
};
