import React, { useState, useRef, useCallback, useEffect } from "react";
import PokemonList from "@/components/PokemonList";
import { Trophy, Star } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RankingsSectionProps {
  displayRankings: any[];
}

export const RankingsSection: React.FC<RankingsSectionProps> = ({
  displayRankings
}) => {
  const [displayedRankedCount, setDisplayedRankedCount] = useState(50);
  const rankedScrollRef = useRef<HTMLDivElement>(null);

  // Load more ranked Pokemon when scrolling
  const loadMoreRanked = useCallback(() => {
    if (displayedRankedCount < displayRankings.length) {
      setDisplayedRankedCount(prev => Math.min(prev + 50, displayRankings.length));
      console.log(`[RANKED_INFINITE_SCROLL] Loading more ranked Pokemon: ${displayedRankedCount} -> ${Math.min(displayedRankedCount + 50, displayRankings.length)}`);
    }
  }, [displayedRankedCount, displayRankings.length]);

  // Set up intersection observer for ranked Pokemon infinite scroll
  useEffect(() => {
    const currentRef = rankedScrollRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayedRankedCount < displayRankings.length) {
          loadMoreRanked();
        }
      },
      { rootMargin: '200px', threshold: 0.1 }
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [displayedRankedCount, displayRankings.length, loadMoreRanked]);

  // Reset displayed count when ranked Pokemon list changes
  useEffect(() => {
    setDisplayedRankedCount(Math.min(50, displayRankings.length));
    console.log(`🔍🔍🔍 [RANKING_UI_DEBUG] Reset displayedRankedCount to: ${Math.min(50, displayRankings.length)}`);
  }, [displayRankings.length]);

  // Get the currently displayed ranked Pokemon
  const displayedRankedPokemon = displayRankings.slice(0, displayedRankedCount);
  
  console.log(`🔍🔍🔍 [RANKING_UI_DEBUG] displayedRankedPokemon length: ${displayedRankedPokemon.length}`);
  console.log(`🔍🔍🔍 [RANKING_UI_DEBUG] displayedRankedPokemon sample:`, displayedRankedPokemon.slice(0, 2));

  return (
    <>
      {/* Header with gradient background and enhanced styling */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-4 border-b flex-shrink-0">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-200" />
          Your Rankings ({displayRankings.length})
        </h2>
        <p className="text-amber-100 text-sm mt-1">
          {displayRankings.length > 0 ? 'TrueSkill Ordered • Battle Mode synced' : 'No rankings yet'}
        </p>
      </div>

      {/* Content area with proper scrolling */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="bg-gray-50 min-h-full">
            <PokemonList
              title=""
              pokemonList={displayedRankedPokemon}
              droppableId="ranked"
              isRankingArea={true}
            />
          </div>
        </ScrollArea>
      </div>
      
      {/* Footer with status information */}
      <div className="border-t bg-white p-3 flex-shrink-0">
        {/* Infinite scroll loading for ranked Pokemon */}
        {displayedRankedCount < displayRankings.length && (
          <div 
            ref={rankedScrollRef}
            className="text-center py-2 text-sm text-gray-600 bg-blue-50 rounded-md border border-blue-200"
          >
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              Loading more... ({displayedRankedCount}/{displayRankings.length})
            </div>
          </div>
        )}
        
        {/* Show completion message when all ranked Pokemon are loaded */}
        {displayedRankedCount >= displayRankings.length && displayRankings.length > 0 && (
          <div className="text-center text-sm bg-green-50 border border-green-200 rounded-md p-3">
            <div className="flex items-center justify-center gap-2 text-green-700">
              <Star className="w-4 h-4 fill-current" />
              All {displayRankings.length} ranked Pokémon loaded
            </div>
            <p className="text-green-600 text-xs mt-1">Rankings based on TrueSkill ratings from Battle Mode</p>
          </div>
        )}
        
        {/* Show message when no ranked Pokemon */}
        {displayRankings.length === 0 && (
          <div className="text-center bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="text-blue-700 text-sm font-medium mb-1">No ranked Pokémon yet</div>
            <p className="text-blue-600 text-xs">Complete some battles in Battle Mode to see rankings here</p>
          </div>
        )}
      </div>
    </>
  );
};
