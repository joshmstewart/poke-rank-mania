
import React from "react";
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
        className={`absolute top-2 right-2 z-10 p-1 rounded-full transition-opacity duration-300 ${
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
          className={`w-5 h-5 transition-colors duration-300 ${
            isPendingRefinement 
              ? 'text-yellow-500 fill-yellow-500' 
              : 'text-gray-500 hover:text-yellow-500'
          }`}
        />
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

// Create a sortable wrapper that handles opacity correctly
const SortableRankingCard: React.FC<{
  pokemon: RankedPokemon;
  index: number;
  allRankedPokemon: RankedPokemon[];
}> = ({ pokemon, index, allRankedPokemon }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: String(pokemon.id),
    data: {
      type: 'ranked-pokemon',
      pokemon: pokemon,
      context: 'ranked',
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1, // Keep cards visible when dragging
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DraggablePokemonMilestoneCard
        pokemon={pokemon}
        index={index}
        isPending={false}
        showRank={true}
        isDraggable={true}
        isAvailable={false}
        context="ranked"
        allRankedPokemon={allRankedPokemon}
      />
    </div>
  );
};

export const RankingGrid: React.FC<RankingGridProps> = ({
  rankedPokemon,
  onReorder,
  isDraggable = true
}) => {
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
    <SortableContext items={rankedPokemon.map(p => String(p.id))} strategy={verticalListSortingStrategy}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {rankedPokemon.map((pokemon, index) => (
          <SortableRankingCard
            key={pokemon.id}
            pokemon={pokemon}
            index={index}
            allRankedPokemon={rankedPokemon}
          />
        ))}
      </div>
    </SortableContext>
  );
};
