
import React, { useState, useRef, useCallback, useEffect } from "react";
import { PokemonCardGrid } from "./PokemonCardGrid";
import { ViewToggle } from "./ViewToggle";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface RankingsSectionProps {
  displayRankings: any[];
}

export const RankingsSection: React.FC<RankingsSectionProps> = ({
  displayRankings
}) => {
  const [displayedRankedCount, setDisplayedRankedCount] = useState(50);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const rankedScrollRef = useRef<HTMLDivElement>(null);

  // Load more ranked Pokemon when scrolling
  const loadMoreRanked = useCallback(() => {
    if (displayedRankedCount < displayRankings.length) {
      setDisplayedRankedCount(prev => Math.min(prev + 50, displayRankings.length));
    }
  }, [displayedRankedCount, displayRankings.length]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const currentRef = rankedScrollRef.current;
    if (!currentRef || isCollapsed) return;

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
  }, [displayedRankedCount, displayRankings.length, loadMoreRanked, isCollapsed]);

  // Reset displayed count when ranked Pokemon list changes
  useEffect(() => {
    setDisplayedRankedCount(Math.min(50, displayRankings.length));
  }, [displayRankings.length]);

  const displayedRankedPokemon = displayRankings.slice(0, displayedRankedCount);

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Your Rankings (TrueSkill Ordered)
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {displayedRankedCount} of {displayRankings.length} shown
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="flex items-center gap-2"
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
                {isCollapsed ? 'Expand' : 'Collapse'}
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        {!isCollapsed && (
          <div className="p-4">
            {displayRankings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-sm">No ranked Pokémon yet. Complete some battles in Battle Mode to see rankings here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {displayedRankedPokemon.map((pokemon, index) => (
                  <div key={pokemon.id} className="relative group">
                    <div className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 overflow-hidden">
                      {/* Rank Badge */}
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center py-1.5">
                        <span className="text-sm font-bold">#{index + 1}</span>
                      </div>

                      {/* Pokemon Image */}
                      <div className="aspect-square bg-gray-50 p-3 flex items-center justify-center">
                        <img
                          src={pokemon.image}
                          alt={pokemon.name}
                          className="w-full h-full object-contain max-w-16 max-h-16"
                          loading="lazy"
                        />
                      </div>

                      {/* Pokemon Info */}
                      <div className="p-3 space-y-2">
                        <div className="text-center">
                          <h3 className="text-sm font-medium text-gray-800 line-clamp-1">
                            {pokemon.name}
                          </h3>
                          <p className="text-xs text-gray-500">#{pokemon.id}</p>
                        </div>

                        {/* Score */}
                        {'score' in pokemon && (
                          <div className="text-center">
                            <p className="text-xs text-gray-600">
                              Score: <span className="font-medium">{pokemon.score.toFixed(1)}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Infinite scroll loading */}
      {!isCollapsed && displayedRankedCount < displayRankings.length && (
        <div 
          ref={rankedScrollRef}
          className="text-center py-4 text-sm text-gray-500 bg-white rounded-lg border border-gray-200"
        >
          Loading more ranked Pokémon... ({displayedRankedCount}/{displayRankings.length})
        </div>
      )}
      
      {/* Completion message */}
      {!isCollapsed && displayedRankedCount >= displayRankings.length && displayRankings.length > 0 && (
        <div className="text-center text-sm text-gray-600 bg-green-50 border border-green-200 rounded-lg p-3">
          ✅ All {displayRankings.length} ranked Pokémon loaded. Rankings based on TrueSkill ratings from Battle Mode.
        </div>
      )}
    </div>
  );
};
