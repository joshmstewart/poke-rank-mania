
import React, { useState, useRef, useCallback, useEffect } from "react";
import { DragDropContext } from "react-beautiful-dnd";
import { ITEMS_PER_PAGE } from "@/services/pokemon";
import PokemonList from "@/components/PokemonList";
import { LoadingState } from "./LoadingState";
import { PaginationControls } from "./PaginationControls";
import { InfiniteScrollLoader } from "./InfiniteScrollLoader";
import { useDragHandler } from "./useDragHandler";
import { LoadingType } from "@/hooks/usePokemonRanker";
import { useRankings } from "@/hooks/battle/useRankings";

interface RankingUIProps {
  isLoading: boolean;
  availablePokemon: any[];
  rankedPokemon: any[];
  selectedGeneration: number;
  loadingType: LoadingType;
  currentPage: number;
  totalPages: number;
  loadSize: number;
  loadingRef: React.RefObject<HTMLDivElement>;
  setAvailablePokemon: React.Dispatch<React.SetStateAction<any[]>>;
  setRankedPokemon: React.Dispatch<React.SetStateAction<any[]>>;
  handlePageChange: (page: number) => void;
  getPageRange: () => number[];
}

export const RankingUI: React.FC<RankingUIProps> = ({
  isLoading,
  availablePokemon,
  rankedPokemon,
  selectedGeneration,
  loadingType,
  currentPage,
  totalPages,
  loadSize,
  loadingRef,
  setAvailablePokemon,
  setRankedPokemon,
  handlePageChange,
  getPageRange
}) => {
  // Get TrueSkill-based rankings from Battle Mode system
  const { finalRankings: battleModeRankings } = useRankings();
  
  // Use Battle Mode rankings for the right panel instead of manual rankings
  const displayRankings = battleModeRankings.length > 0 ? battleModeRankings : rankedPokemon;
  
  // Infinite scroll state for ranked Pokemon
  const [displayedRankedCount, setDisplayedRankedCount] = useState(50);
  const rankedScrollRef = useRef<HTMLDivElement>(null);

  const { handleDragEnd } = useDragHandler(
    availablePokemon,
    rankedPokemon,
    setAvailablePokemon,
    setRankedPokemon
  );

  // Temporarily disable drag-and-drop for Manual Mode TrueSkill integration
  const handleDisabledDragEnd = () => {
    console.log("[TRUESKILL_MANUAL] Drag-and-drop temporarily disabled in Manual Mode");
    // Do nothing - drag is disabled
  };

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
  }, [displayRankings.length]);

  // Get the currently displayed ranked Pokemon
  const displayedRankedPokemon = displayRankings.slice(0, displayedRankedCount);

  if (isLoading && availablePokemon.length === 0) {
    return (
      <LoadingState 
        selectedGeneration={selectedGeneration} 
        loadSize={loadSize} 
        itemsPerPage={ITEMS_PER_PAGE}
        loadingType={loadingType}
      />
    );
  }

  return (
    <DragDropContext onDragEnd={handleDisabledDragEnd}>
      <div className="grid md:grid-cols-2 gap-6 h-full">
        {/* Left side - Available Pokemon (unrated) with independent scroll */}
        <div className="flex flex-col h-full max-h-[calc(100vh-12rem)] overflow-hidden">
          <PokemonList
            title="Available Pokémon (Unrated)"
            pokemonList={availablePokemon}
            droppableId="available"
          />
          
          {/* Infinite scroll loading indicator */}
          {loadingType === "infinite" && (
            <InfiniteScrollLoader
              isLoading={isLoading}
              currentPage={currentPage}
              totalPages={totalPages}
              loadingRef={loadingRef}
            />
          )}
          
          {/* Pagination controls */}
          {selectedGeneration === 0 && loadingType === "pagination" && totalPages > 1 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              pageRange={getPageRange()}
              onPageChange={handlePageChange}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          )}
          
          {/* Single load info */}
          {loadingType === "single" && (
            <div className="text-center text-sm text-muted-foreground mt-2">
              Loaded {availablePokemon.length} Pokémon
            </div>
          )}
        </div>
        
        {/* Right side - Rankings (TrueSkill ordered) with infinite scroll */}
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
      </div>
    </DragDropContext>
  );
};
