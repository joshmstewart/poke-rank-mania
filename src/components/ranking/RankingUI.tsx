import React, { useEffect, useState } from "react";
import { DndContext, DragEndEvent, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { LoadingState } from "./LoadingState";
import { AvailablePokemonSection } from "./AvailablePokemonSection";
import { RankingsSection } from "./RankingsSection";
import { useTrueSkillSync } from "@/hooks/ranking/useTrueSkillSync";
import { useRankings } from "@/hooks/battle/useRankings";
import { LoadingType } from "@/hooks/usePokemonRanker";
import { ITEMS_PER_PAGE } from "@/services/pokemon";
import BattleControls from "@/components/battle/BattleControls";
import { BattleType } from "@/hooks/battle/types";

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
  onGenerationChange: (gen: number) => void;
  onReset: () => void;
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
  getPageRange,
  onGenerationChange,
  onReset
}) => {
  // Get TrueSkill-based rankings from Battle Mode system
  const { finalRankings: battleModeRankings } = useRankings();
  
  // Get local rankings from TrueSkill sync
  const { localRankings } = useTrueSkillSync();
  
  // Local state to track if user has made manual changes
  const [hasManualChanges, setHasManualChanges] = useState(false);
  
  // Battle type state (needed for BattleControls compatibility)
  const [battleType, setBattleType] = useState<BattleType>("pairs");
  
  // Initialize rankings from TrueSkill when available (but only if no manual changes yet)
  useEffect(() => {
    // Only auto-populate if we don't have manual rankings AND we have TrueSkill data
    if (rankedPokemon.length === 0 && !hasManualChanges) {
      const trueskillRankings = localRankings.length > 0 ? localRankings : battleModeRankings;
      if (trueskillRankings.length > 0) {
        console.log(`🔍🔍🔍 [RANKING_UI_INIT] Auto-populating from TrueSkill: ${trueskillRankings.length} Pokemon`);
        setRankedPokemon(trueskillRankings);
      }
    }
  }, [localRankings, battleModeRankings, rankedPokemon.length, hasManualChanges, setRankedPokemon]);
  
  // Determine what to show on the right side - always use manual state once populated
  const displayRankings = rankedPokemon;
  
  // Filter available Pokemon to exclude those in the display rankings
  const displayRankingsIds = new Set(displayRankings.map(p => p.id));
  const filteredAvailablePokemon = availablePokemon.filter(p => !displayRankingsIds.has(p.id));
  
  console.log(`🔍🔍🔍 [RANKING_UI_DEBUG] Manual rankedPokemon: ${rankedPokemon.length}, localRankings: ${localRankings.length}, battleModeRankings: ${battleModeRankings.length}`);
  console.log(`🔍🔍🔍 [RANKING_UI_DEBUG] displayRankings length: ${displayRankings.length}`);
  console.log(`🔍🔍🔍 [RANKING_UI_DEBUG] hasManualChanges: ${hasManualChanges}`);
  console.log(`🔍🔍🔍 [RANKING_UI_DEBUG] filteredAvailablePokemon length: ${filteredAvailablePokemon.length}`);

  // Handle drag from available to rankings
  const handleDragToRankings = (pokemonId: number, insertIndex?: number) => {
    console.log(`🔄 [RANKING_UI] Moving Pokemon ${pokemonId} to rankings at index ${insertIndex}`);
    
    const pokemon = filteredAvailablePokemon.find(p => p.id === pokemonId);
    if (!pokemon) {
      console.error(`🔄 [RANKING_UI] Pokemon ${pokemonId} not found in available list`);
      return;
    }
    
    // Remove from available
    const newAvailable = availablePokemon.filter(p => p.id !== pokemonId);
    
    // Add to ranked at specified position or at the end
    const newRanked = [...rankedPokemon];
    const targetIndex = insertIndex !== undefined ? insertIndex : newRanked.length;
    newRanked.splice(targetIndex, 0, pokemon);
    
    // Update states
    setAvailablePokemon(newAvailable);
    setRankedPokemon(newRanked);
    setHasManualChanges(true);
    
    console.log(`🔄 [RANKING_UI] Successfully moved ${pokemon.name} to rankings`);
  };

  // Handle manual reordering within the rankings
  const handleManualReorder = (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
    console.log(`🔍🔍🔍 [RANKING_UI_DEBUG] Manual reorder: Pokemon ${draggedPokemonId} from ${sourceIndex} to ${destinationIndex}`);
    setHasManualChanges(true);
    
    const newRankings = [...rankedPokemon];
    const [movedPokemon] = newRankings.splice(sourceIndex, 1);
    newRankings.splice(destinationIndex, 0, movedPokemon);
    
    setRankedPokemon(newRankings);
  };

  // Handle local reordering (for DragDropGrid compatibility)
  const handleLocalReorder = (newRankings: any[]) => {
    console.log(`🔍🔍🔍 [RANKING_UI_DEBUG] Local reorder with ${newRankings.length} Pokemon`);
    setHasManualChanges(true);
    setRankedPokemon(newRankings);
  };

  // Unified drag handlers for the shared DndContext
  const handleDragStart = (event: DragStartEvent) => {
    console.log(`🔄 [RANKING_UI] Drag started for item:`, event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    console.log(`🔄 [RANKING_UI] Drag ended:`, event);
    
    const { active, over } = event;
    
    if (!over) {
      console.log(`🔄 [RANKING_UI] No drop target`);
      return;
    }

    // Check if dragging from available to rankings
    if (active.id.toString().startsWith('available-') && over.id === 'rankings-drop-zone') {
      const pokemonId = parseInt(active.id.toString().replace('available-', ''));
      console.log(`🔄 [RANKING_UI] Dragging Pokemon ${pokemonId} from available to rankings`);
      handleDragToRankings(pokemonId);
      return;
    }

    // Handle reordering within rankings
    if (!active.id.toString().startsWith('available-') && !over.id.toString().startsWith('available-')) {
      const activeId = Number(active.id);
      const overId = Number(over.id);
      
      // Find the indices of the dragged and target Pokemon
      const oldIndex = displayRankings.findIndex(p => p.id === activeId);
      const newIndex = displayRankings.findIndex(p => p.id === overId);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        console.log(`🔄 [RANKING_UI] Reordering within rankings: ${activeId} from ${oldIndex} to ${newIndex}`);
        
        // Use arrayMove for proper reordering
        const newRankings = arrayMove(displayRankings, oldIndex, newIndex);
        setRankedPokemon(newRankings);
        setHasManualChanges(true);
      }
    }
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
    <DndContext 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
      collisionDetection={closestCenter}
    >
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen p-1">
        {/* Battle Controls Header - same as Battle Mode */}
        <div className="max-w-7xl mx-auto mb-4">
          <BattleControls
            selectedGeneration={selectedGeneration}
            battleType={battleType}
            onGenerationChange={(gen) => onGenerationChange(Number(gen))}
            onBattleTypeChange={setBattleType}
            onRestartBattles={onReset}
          />
        </div>
        
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-2" style={{ height: 'calc(100vh - 8rem)' }}>
            {/* Left side - Available Pokemon (unrated) with enhanced styling */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden flex flex-col">
              <AvailablePokemonSection
                availablePokemon={filteredAvailablePokemon}
                isLoading={isLoading}
                selectedGeneration={selectedGeneration}
                loadingType={loadingType}
                currentPage={currentPage}
                totalPages={totalPages}
                loadingRef={loadingRef}
                handlePageChange={handlePageChange}
                getPageRange={getPageRange}
              />
            </div>
            
            {/* Right side - Rankings with enhanced styling */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden flex flex-col">
              <RankingsSection 
                displayRankings={displayRankings}
                onManualReorder={handleManualReorder}
                onLocalReorder={handleLocalReorder}
                pendingRefinements={new Set()}
              />
            </div>
          </div>
        </div>
      </div>
    </DndContext>
  );
};
