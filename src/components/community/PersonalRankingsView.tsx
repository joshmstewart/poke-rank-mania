
import React from 'react';
import { useGenerationState } from '@/hooks/battle/useGenerationState';
import { usePokemonRanker } from '@/hooks/usePokemonRanker';
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useEnhancedRankingDragDrop } from '@/hooks/ranking/useEnhancedRankingDragDrop';
import { useEnhancedManualReorder } from '@/hooks/battle/useEnhancedManualReorder';
import { useReRankingTrigger } from '@/hooks/ranking/useReRankingTrigger';
import DraggablePokemonMilestoneCard from '@/components/battle/DraggablePokemonMilestoneCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import PokemonCard from '@/components/PokemonCard';

export const PersonalRankingsView: React.FC = () => {
  const { selectedGeneration, setSelectedGeneration } = useGenerationState();
  
  const {
    isLoading,
    availablePokemon,
    rankedPokemon,
    setAvailablePokemon,
    setRankedPokemon,
    loadingType,
    loadSize,
    currentPage,
    totalPages,
    loadingRef,
    handlePageChange,
    getPageRange,
    resetRankings
  } = usePokemonRanker();

  // Enhanced manual reorder with manual order preservation
  const { handleEnhancedManualReorder } = useEnhancedManualReorder(
    rankedPokemon,
    setRankedPokemon,
    true
  );

  // Re-ranking trigger for already-ranked Pokemon
  const { triggerReRanking } = useReRankingTrigger(rankedPokemon, setRankedPokemon);

  // Enhanced drag and drop functionality
  const {
    activeDraggedPokemon,
    handleDragStart,
    handleDragEnd
  } = useEnhancedRankingDragDrop(
    availablePokemon,
    rankedPokemon,
    setAvailablePokemon,
    handleEnhancedManualReorder,
    triggerReRanking
  );

  const handleGenerationChange = (gen: number) => {
    setSelectedGeneration(gen);
  };

  const handleReset = () => {
    resetRankings();
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Controls */}
        <div className="bg-white rounded-lg shadow border p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label htmlFor="generation-select">Generation</Label>
              <Select value={selectedGeneration.toString()} onValueChange={(value) => handleGenerationChange(Number(value))}>
                <SelectTrigger id="generation-select" className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Gens</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(gen => (
                    <SelectItem key={gen} value={gen.toString()}>Gen {gen}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={handleReset} variant="outline">
              Reset Rankings
            </Button>
            
            <div className="text-sm text-gray-600">
              Available: {availablePokemon.length} | Ranked: {rankedPokemon.length}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Available Pokemon - Milestone Style Grid */}
          <div className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Available Pokémon ({availablePokemon.length})
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Drag Pokémon to your rankings to trigger battles
              </p>
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto">
              <SortableContext 
                items={availablePokemon.map(p => `available-${p.id}`)} 
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-3 gap-3">
                  {availablePokemon.slice(0, 50).map((pokemon, index) => (
                    <DraggablePokemonMilestoneCard
                      key={`available-${pokemon.id}`}
                      pokemon={pokemon}
                      index={index}
                      isPending={false}
                      showRank={false}
                      isDraggable={true}
                      isAvailable={true}
                      context="available"
                    />
                  ))}
                </div>
              </SortableContext>
              
              {availablePokemon.length > 50 && (
                <div className="text-center text-sm text-gray-500 mt-4">
                  Showing first 50 Pokémon. Use generation filter to narrow results.
                </div>
              )}
            </div>
          </div>

          {/* Ranked Pokemon - Milestone Style Grid */}
          <div className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Your Rankings ({rankedPokemon.length})
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Drag to reorder and trigger battles
              </p>
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto">
              {rankedPokemon.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No Pokémon ranked yet</p>
                  <p className="text-sm">Drag Pokémon from the left to start!</p>
                </div>
              ) : (
                <SortableContext 
                  items={rankedPokemon.map(p => p.id)} 
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-3 gap-3">
                    {rankedPokemon.map((pokemon, index) => (
                      <DraggablePokemonMilestoneCard
                        key={pokemon.id}
                        pokemon={pokemon}
                        index={index}
                        isPending={false}
                        showRank={true}
                        isDraggable={true}
                        isAvailable={false}
                        context="ranked"
                      />
                    ))}
                  </div>
                </SortableContext>
              )}
            </div>
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDraggedPokemon ? (
            <div className="transform rotate-3 scale-105 opacity-90">
              <PokemonCard
                pokemon={activeDraggedPokemon}
                compact={true}
                viewMode="grid"
                isDragging={true}
              />
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};
