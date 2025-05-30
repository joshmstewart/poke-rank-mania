import React from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { arrayMove } from "@/utils/arrayMove";
import { DragEndEvent, DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListStrategy } from "@dnd-kit/sortable";
import { SortableItem } from "./SortableItem";
import { PokemonCard } from "./PokemonCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface PokemonRankerContentProps {
  showRankings: boolean;
  isLoading: boolean;
  availablePokemon: Pokemon[];
  rankedPokemon: Pokemon[];
  typedRankedPokemon: RankedPokemon[];
  confidenceScores: Record<number, number>;
  selectedGeneration: number;
  loadingType: string;
  currentPage: number;
  totalPages: number;
  loadSize: number;
  loadingRef: React.RefObject<HTMLDivElement>;
  setAvailablePokemon: React.Dispatch<React.SetStateAction<Pokemon[]>>;
  setRankedPokemon: React.Dispatch<React.SetStateAction<Pokemon[]>>;
  handlePageChange: (page: number) => void;
  getPageRange: () => number[];
  suggestRanking: (pokemon: RankedPokemon, direction: "promote" | "demote") => void;
  removeSuggestion: (pokemon: RankedPokemon) => void;
  clearAllSuggestions: () => void;
  handleEnhancedManualReorder?: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
}

export const PokemonRankerContent: React.FC<PokemonRankerContentProps> = ({
  showRankings,
  isLoading,
  availablePokemon,
  rankedPokemon,
  typedRankedPokemon,
  confidenceScores,
  selectedGeneration,
  loadingType,
  currentPage,
  totalPages,
  loadSize,
  loadingRef,
  setAvailablePokemon,
  setRankedPokemon,
  handlePageChange,
  getPageRange,
  suggestRanking,
  removeSuggestion,
  clearAllSuggestions,
  handleEnhancedManualReorder
}) => {
  const isRankedListEmpty = rankedPokemon.length === 0;
  const isAvailableListEmpty = availablePokemon.length === 0;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    if (active.id !== over.id) {
      const draggedPokemonId = Number(active.id);
      const activeIndex = typedRankedPokemon.findIndex(pokemon => pokemon.id === draggedPokemonId);
      const overIndex = typedRankedPokemon.findIndex(pokemon => pokemon.id === Number(over.id));
      
      if (activeIndex !== -1 && overIndex !== -1) {
        console.log(`🔥 [DRAG_END] Dragging Pokemon ${draggedPokemonId} from index ${activeIndex} to ${overIndex}`);
        
        // Call the enhanced manual reorder if available
        if (handleEnhancedManualReorder) {
          console.log(`🔥 [DRAG_END] Calling handleEnhancedManualReorder`);
          handleEnhancedManualReorder(draggedPokemonId, activeIndex, overIndex);
        } else {
          console.warn(`🔥 [DRAG_END] handleEnhancedManualReorder not available, falling back to basic reorder`);
          // Fallback to basic reorder
          const newRankedPokemon = arrayMove(typedRankedPokemon, activeIndex, overIndex);
          setRankedPokemon(newRankedPokemon as Pokemon[]);
        }
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Ranked Pokemon Section */}
      <div className="w-full md:w-1/2">
        <h2 className="text-xl font-semibold mb-2">Ranked Pokémon</h2>
        <DndContext onDragEnd={handleDragEnd}>
          <SortableContext
            items={typedRankedPokemon.map((pokemon) => pokemon.id.toString())}
            strategy={verticalListStrategy}
          >
            <div className="space-y-2">
              {isLoading ? (
                <>
                  <Skeleton className="w-full h-20 rounded-md" />
                  <Skeleton className="w-full h-20 rounded-md" />
                  <Skeleton className="w-full h-20 rounded-md" />
                </>
              ) : isRankedListEmpty ? (
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                  <p className="text-gray-500">No Pokémon ranked yet. Drag Pokémon from the Available Pokémon list here to rank them.</p>
                </div>
              ) : (
                typedRankedPokemon.map((pokemon) => (
                  <SortableItem key={pokemon.id} id={pokemon.id.toString()}>
                    <PokemonCard
                      pokemon={pokemon}
                      confidence={confidenceScores[pokemon.id]}
                      showRankings={showRankings}
                      suggestRanking={suggestRanking}
                      removeSuggestion={removeSuggestion}
                    />
                  </SortableItem>
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Available Pokemon Section */}
      <div className="w-full md:w-1/2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Available Pokémon</h2>
          <div className="join">
            <Button
              className="join-item btn-xs sm:btn-sm md:btn-md"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              className="join-item btn-xs sm:btn-sm md:btn-md"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {isLoading ? (
            <>
              <Skeleton className="w-full h-20 rounded-md" />
              <Skeleton className="w-full h-20 rounded-md" />
              <Skeleton className="w-full h-20 rounded-md" />
            </>
          ) : isAvailableListEmpty ? (
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
              <p className="text-gray-500">No Pokémon available in this generation. Please select a different generation.</p>
            </div>
          ) : (
            availablePokemon.map((pokemon) => (
              <PokemonCard key={pokemon.id} pokemon={pokemon} />
            ))
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-center mt-4">
          <div className="btn-group">
            {getPageRange().map((page) => (
              <button
                key={page}
                className={cn(
                  "btn btn-sm",
                  currentPage === page ? "btn-active" : ""
                )}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
