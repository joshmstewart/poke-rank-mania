
import React from "react";
import { DragDropContext } from "react-beautiful-dnd";
import { ITEMS_PER_PAGE } from "@/services/pokemon";
import PokemonList from "@/components/PokemonList";
import { LoadingState } from "./LoadingState";
import { PaginationControls } from "./PaginationControls";
import { InfiniteScrollLoader } from "./InfiniteScrollLoader";
import { useDragHandler } from "./useDragHandler";
import { LoadingType } from "@/hooks/usePokemonRanker";

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
        
        {/* Right side - Rankings (TrueSkill ordered) with independent scroll */}
        <div className="flex flex-col h-full max-h-[calc(100vh-12rem)] overflow-hidden">
          <PokemonList
            title="Your Rankings (TrueSkill Ordered)"
            pokemonList={rankedPokemon}
            droppableId="ranked"
            isRankingArea={true}
          />
          
          {/* Temporary notice about disabled drag-and-drop */}
          {rankedPokemon.length > 0 && (
            <div className="text-center text-xs text-muted-foreground mt-1 p-2 bg-yellow-50 rounded">
              Drag-and-drop temporarily disabled. Rankings based on TrueSkill ratings from Battle Mode.
            </div>
          )}
        </div>
      </div>
    </DragDropContext>
  );
};
