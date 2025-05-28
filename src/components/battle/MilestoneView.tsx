
import React from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { Button } from "@/components/ui/button";
import { getPokemonBackgroundColor } from "./utils/PokemonColorUtils";
import InfiniteScrollHandler from "./InfiniteScrollHandler";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";

interface MilestoneViewProps {
  formattedRankings: (Pokemon | RankedPokemon)[];
  battlesCompleted: number;
  activeTier: TopNOption;
  milestoneDisplayCount: number;
  onContinueBattles: () => void;
  onLoadMore: () => void;
  getMaxItemsForTier: () => number;
}

const MilestoneView: React.FC<MilestoneViewProps> = ({
  formattedRankings,
  battlesCompleted,
  activeTier,
  milestoneDisplayCount,
  onContinueBattles,
  onLoadMore,
  getMaxItemsForTier
}) => {
  const maxItems = getMaxItemsForTier();
  const displayRankings = formattedRankings.slice(0, Math.min(milestoneDisplayCount, maxItems));
  const hasMoreToLoad = milestoneDisplayCount < maxItems;
  
  console.log(`🏆 [MILESTONE_RENDER_ULTRA_DEBUG] About to render ${displayRankings.length} Pokemon in milestone view`);
  
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
        </div>
        
        <Button 
          onClick={onContinueBattles}
          className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-lg font-medium"
        >
          Continue Battles
        </Button>
      </div>

      {/* Grid Layout - exactly 5 columns like the reference with softer colors */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {displayRankings.map((pokemon, index) => {
          const backgroundColorClass = getPokemonBackgroundColor(pokemon);
          
          // ULTRA-DETAILED LOGGING FOR EACH RENDERED POKEMON
          console.log(`🏆 [MILESTONE_RENDER_ULTRA_DEBUG] Rendering Pokemon #${index + 1}:`);
          console.log(`🏆 [MILESTONE_RENDER_ULTRA_DEBUG]   Name being displayed: "${pokemon.name}"`);
          console.log(`🏆 [MILESTONE_RENDER_ULTRA_DEBUG]   Name type: ${typeof pokemon.name}`);
          console.log(`🏆 [MILESTONE_RENDER_ULTRA_DEBUG]   ID: ${pokemon.id}`);
          console.log(`🏆 [MILESTONE_RENDER_ULTRA_DEBUG]   Background class: ${backgroundColorClass}`);
          
          return (
            <div 
              key={pokemon.id}
              className={`${backgroundColorClass} rounded-lg border border-gray-200 relative overflow-hidden h-40 flex flex-col`}
            >
              {/* Info Button - positioned in top right */}
              <div className="absolute top-1 right-1 z-30">
                <PokemonInfoModal pokemon={pokemon}>
                  <button 
                    className="w-6 h-6 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-md transition-all duration-200"
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
        })}
      </div>

      <InfiniteScrollHandler 
        hasMoreToLoad={hasMoreToLoad}
        currentCount={displayRankings.length}
        maxItems={maxItems}
        onLoadMore={onLoadMore}
      />
    </div>
  );
};

export default MilestoneView;
