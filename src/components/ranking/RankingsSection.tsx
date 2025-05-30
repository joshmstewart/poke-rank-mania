
import React, { useState, useRef, useCallback, useEffect } from "react";
import PokemonList from "@/components/PokemonList";

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
    <div className="flex flex-col h-full max-h-[calc(100vh-12rem)] overflow-hidden">
      <PokemonList
        title={`Your Rankings (TrueSkill Ordered) - ${displayedRankedCount} of ${displayRankings.length}`}
        pokemonList={displayedRankedPokemon}
        droppableId="ranked"
        isRankingArea={true}
      />
      
      {/* Infinite scroll loading for ranked Pokemon */}
      {displayedRankedCount < displayRankings.length && (
        <div 
          ref={rankedScrollRef}
          className="text-center py-4 text-sm text-muted-foreground"
        >
          Loading more ranked Pokémon... ({displayedRankedCount}/{displayRankings.length})
        </div>
      )}
      
      {/* Show completion message when all ranked Pokemon are loaded */}
      {displayedRankedCount >= displayRankings.length && displayRankings.length > 0 && (
        <div className="text-center text-xs text-muted-foreground mt-1 p-2 bg-green-50 rounded">
          All {displayRankings.length} ranked Pokémon loaded. Rankings based on TrueSkill ratings from Battle Mode.
        </div>
      )}
      
      {/* Show message when no ranked Pokemon */}
      {displayRankings.length === 0 && (
        <div className="text-center text-xs text-muted-foreground mt-1 p-2 bg-blue-50 rounded">
          No ranked Pokémon yet. Complete some battles in Battle Mode to see rankings here.
        </div>
      )}
    </div>
  );
};
