
import React, { useEffect, useState } from "react";
import { DndContext, DragEndEvent, DragStartEvent, closestCenter, DragOverlay } from '@dnd-kit/core';
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
import PokemonCard from "@/components/PokemonCard";

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
  
  // Track if we've already initialized from TrueSkill for this generation
  const [trueskillInitialized, setTrueskillInitialized] = useState(false);
  
  // Battle type state (needed for BattleControls compatibility)
  const [battleType, setBattleType] = useState<BattleType>("pairs");
  
  // CRITICAL FIX: Add drag overlay state
  const [activeDraggedPokemon, setActiveDraggedPokemon] = useState<any>(null);
  
  // CRITICAL FIX: Initialize from TrueSkill when switching to Manual mode
  useEffect(() => {
    const trueskillRankings = localRankings.length > 0 ? localRankings : battleModeRankings;
    
    console.log(`🔄 [TRUESKILL_INIT] Checking TrueSkill initialization for gen ${selectedGeneration}`);
    console.log(`🔄 [TRUESKILL_INIT] rankedPokemon.length: ${rankedPokemon.length}`);
    console.log(`🔄 [TRUESKILL_INIT] trueskillRankings.length: ${trueskillRankings.length}`);
    console.log(`🔄 [TRUESKILL_INIT] trueskillInitialized: ${trueskillInitialized}`);
    
    // If we have TrueSkill data but no manual rankings, and haven't initialized yet
    if (trueskillRankings.length > 0 && rankedPokemon.length === 0 && !trueskillInitialized) {
      console.log(`🔄 [TRUESKILL_INIT] ✅ Initializing from TrueSkill: ${trueskillRankings.length} Pokemon`);
      setRankedPokemon(trueskillRankings);
      setTrueskillInitialized(true);
    }
  }, [localRankings, battleModeRankings, rankedPokemon.length, trueskillInitialized, selectedGeneration, setRankedPokemon]);

  // Reset initialization flag when generation changes
  useEffect(() => {
    console.log(`🔄 [TRUESKILL_INIT] Generation changed to ${selectedGeneration}, resetting initialization flag`);
    setTrueskillInitialized(false);
    setHasManualChanges(false);
  }, [selectedGeneration]);

  // CRITICAL FIX: Add persistence effect
  useEffect(() => {
    console.log(`💾 [PERSISTENCE_DEBUG] Saving ranked Pokemon to localStorage: ${rankedPokemon.length} items`);
    if (rankedPokemon.length > 0) {
      localStorage.setItem(`manual-rankings-gen-${selectedGeneration}`, JSON.stringify(rankedPokemon));
    }
  }, [rankedPokemon, selectedGeneration]);

  // CRITICAL FIX: Load persisted rankings on generation change
  useEffect(() => {
    const savedRankings = localStorage.getItem(`manual-rankings-gen-${selectedGeneration}`);
    if (savedRankings) {
      try {
        const parsed = JSON.parse(savedRankings);
        console.log(`💾 [PERSISTENCE_DEBUG] Loading saved rankings for gen ${selectedGeneration}: ${parsed.length} items`);
        setRankedPokemon(parsed);
        setHasManualChanges(true);
        setTrueskillInitialized(true); // Mark as initialized since we loaded manual data
      } catch (error) {
        console.error(`💾 [PERSISTENCE_DEBUG] Failed to load saved rankings:`, error);
      }
    }
  }, [selectedGeneration, setRankedPokemon]);
  
  // Determine what to show on the right side - always use manual state once populated
  const displayRankings = rankedPokemon;
  
  // Filter available Pokemon to exclude those in the display rankings
  const displayRankingsIds = new Set(displayRankings.map(p => p.id));
  const filteredAvailablePokemon = availablePokemon.filter(p => !displayRankingsIds.has(p.id));
  
  console.log(`🔍🔍🔍 [RANKING_UI_DEBUG] Manual rankedPokemon: ${rankedPokemon.length}, localRankings: ${localRankings.length}, battleModeRankings: ${battleModeRankings.length}`);
  console.log(`🔍🔍🔍 [RANKING_UI_DEBUG] displayRankings length: ${displayRankings.length}`);
  console.log(`🔍🔍🔍 [RANKING_UI_DEBUG] hasManualChanges: ${hasManualChanges}, trueskillInitialized: ${trueskillInitialized}`);
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
    console.log(`🔄🔄🔄 [DRAG_DEBUG] === DRAG START ===`);
    console.log(`🔄🔄🔄 [DRAG_DEBUG] Active ID: ${event.active.id}`);
    console.log(`🔄🔄🔄 [DRAG_DEBUG] Active data:`, event.active.data?.current);
    console.log(`🔄🔄🔄 [DRAG_DEBUG] Active element:`, event.active);

    // CRITICAL FIX: Set the dragged Pokemon for overlay
    const activeId = event.active.id.toString();
    let draggedPokemon = null;
    
    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      draggedPokemon = filteredAvailablePokemon.find(p => p.id === pokemonId);
      console.log(`🔄🔄🔄 [DRAG_DEBUG] Found available Pokemon for overlay: ${draggedPokemon?.name}`);
    } else {
      const pokemonId = parseInt(activeId);
      draggedPokemon = displayRankings.find(p => p.id === pokemonId);
      console.log(`🔄🔄🔄 [DRAG_DEBUG] Found ranked Pokemon for overlay: ${draggedPokemon?.name}`);
    }
    
    setActiveDraggedPokemon(draggedPokemon);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    console.log(`🔄🔄🔄 [DRAG_DEBUG] === DRAG END ===`);
    console.log(`🔄🔄🔄 [DRAG_DEBUG] Full event:`, event);
    
    // CRITICAL FIX: Clear the drag overlay
    setActiveDraggedPokemon(null);
    
    const { active, over } = event;
    
    if (!over) {
      console.log(`🔄🔄🔄 [DRAG_DEBUG] ❌ No drop target - drag cancelled`);
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();

    console.log(`🔄🔄🔄 [DRAG_DEBUG] Active ID: ${activeId}`);
    console.log(`🔄🔄🔄 [DRAG_DEBUG] Over ID: ${overId}`);
    console.log(`🔄🔄🔄 [DRAG_DEBUG] Active data:`, active.data?.current);
    console.log(`🔄🔄🔄 [DRAG_DEBUG] Over data:`, over.data?.current);

    // Check if dragging from available to rankings
    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      console.log(`🔄🔄🔄 [DRAG_DEBUG] 🎯 AVAILABLE TO RANKINGS: Pokemon ID: ${pokemonId}`);
      
      // Find the Pokemon in available list
      const pokemon = filteredAvailablePokemon.find(p => p.id === pokemonId);
      if (!pokemon) {
        console.log(`🔄🔄🔄 [DRAG_DEBUG] ❌ Pokemon ${pokemonId} not found in available list`);
        console.log(`🔄🔄🔄 [DRAG_DEBUG] Available Pokemon IDs:`, filteredAvailablePokemon.map(p => p.id));
        return;
      }
      
      console.log(`🔄🔄🔄 [DRAG_DEBUG] ✅ Found Pokemon: ${pokemon.name}`);
      
      if (overId === 'rankings-drop-zone') {
        console.log(`🔄🔄🔄 [DRAG_DEBUG] 🎯 Dropping to rankings drop zone`);
        handleDragToRankings(pokemonId);
        return;
      } else if (!overId.startsWith('available-')) {
        // Dragging over a specific Pokemon in rankings
        const overPokemonId = Number(overId);
        const insertIndex = displayRankings.findIndex(p => p.id === overPokemonId);
        console.log(`🔄🔄🔄 [DRAG_DEBUG] 🎯 Dropping near Pokemon ${overPokemonId} at index ${insertIndex}`);
        if (insertIndex !== -1) {
          handleDragToRankings(pokemonId, insertIndex);
          return;
        }
      }
    }

    // Handle reordering within rankings (both IDs should be numeric for ranked Pokemon)
    if (!activeId.startsWith('available-') && !overId.startsWith('available-') && overId !== 'rankings-drop-zone') {
      const activePokemonId = Number(activeId);
      const overPokemonId = Number(overId);
      
      console.log(`🔄🔄🔄 [DRAG_DEBUG] 🔄 REORDERING WITHIN RANKINGS: ${activePokemonId} -> ${overPokemonId}`);
      
      // Find the indices of the dragged and target Pokemon
      const oldIndex = displayRankings.findIndex(p => p.id === activePokemonId);
      const newIndex = displayRankings.findIndex(p => p.id === overPokemonId);
      
      console.log(`🔄🔄🔄 [DRAG_DEBUG] Old index: ${oldIndex}, New index: ${newIndex}`);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        console.log(`🔄🔄🔄 [DRAG_DEBUG] ✅ Performing reorder from ${oldIndex} to ${newIndex}`);
        
        // Use arrayMove for proper reordering
        const newRankings = arrayMove(displayRankings, oldIndex, newIndex);
        setRankedPokemon(newRankings);
        setHasManualChanges(true);
      }
    }
    
    console.log(`🔄🔄🔄 [DRAG_DEBUG] === DRAG END COMPLETE ===`);
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

      {/* CRITICAL FIX: Add drag overlay for visibility */}
      <DragOverlay>
        {activeDraggedPokemon ? (
          <div className="opacity-90 transform scale-105 shadow-2xl z-50">
            <PokemonCard 
              pokemon={activeDraggedPokemon}
              viewMode="grid"
              compact={true}
              isDragging={true}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

// Missing drag handler functions that were abbreviated:
const handleDragStart = (event: DragStartEvent) => {
  console.log(`🔄🔄🔄 [DRAG_DEBUG] === DRAG START ===`);
  console.log(`🔄🔄🔄 [DRAG_DEBUG] Active ID: ${event.active.id}`);
  console.log(`🔄🔄🔄 [DRAG_DEBUG] Active data:`, event.active.data?.current);
  console.log(`🔄🔄🔄 [DRAG_DEBUG] Active element:`, event.active);

  // CRITICAL FIX: Set the dragged Pokemon for overlay
  const activeId = event.active.id.toString();
  let draggedPokemon = null;
  
  if (activeId.startsWith('available-')) {
    const pokemonId = parseInt(activeId.replace('available-', ''));
    draggedPokemon = filteredAvailablePokemon.find(p => p.id === pokemonId);
    console.log(`🔄🔄🔄 [DRAG_DEBUG] Found available Pokemon for overlay: ${draggedPokemon?.name}`);
  } else {
    const pokemonId = parseInt(activeId);
    draggedPokemon = displayRankings.find(p => p.id === pokemonId);
    console.log(`🔄🔄🔄 [DRAG_DEBUG] Found ranked Pokemon for overlay: ${draggedPokemon?.name}`);
  }
  
  setActiveDraggedPokemon(draggedPokemon);
};

const handleDragEnd = (event: DragEndEvent) => {
  console.log(`🔄🔄🔄 [DRAG_DEBUG] === DRAG END ===`);
  console.log(`🔄🔄🔄 [DRAG_DEBUG] Full event:`, event);
  
  // CRITICAL FIX: Clear the drag overlay
  setActiveDraggedPokemon(null);
  
  const { active, over } = event;
  
  if (!over) {
    console.log(`🔄🔄🔄 [DRAG_DEBUG] ❌ No drop target - drag cancelled`);
    return;
  }

  const activeId = active.id.toString();
  const overId = over.id.toString();

  console.log(`🔄🔄🔄 [DRAG_DEBUG] Active ID: ${activeId}`);
  console.log(`🔄🔄🔄 [DRAG_DEBUG] Over ID: ${overId}`);
  console.log(`🔄🔄🔄 [DRAG_DEBUG] Active data:`, active.data?.current);
  console.log(`🔄🔄🔄 [DRAG_DEBUG] Over data:`, over.data?.current);

  // Check if dragging from available to rankings
  if (activeId.startsWith('available-')) {
    const pokemonId = parseInt(activeId.replace('available-', ''));
    console.log(`🔄🔄🔄 [DRAG_DEBUG] 🎯 AVAILABLE TO RANKINGS: Pokemon ID: ${pokemonId}`);
    
    // Find the Pokemon in available list
    const pokemon = filteredAvailablePokemon.find(p => p.id === pokemonId);
    if (!pokemon) {
      console.log(`🔄🔄🔄 [DRAG_DEBUG] ❌ Pokemon ${pokemonId} not found in available list`);
      console.log(`🔄🔄🔄 [DRAG_DEBUG] Available Pokemon IDs:`, filteredAvailablePokemon.map(p => p.id));
      return;
    }
    
    console.log(`🔄🔄🔄 [DRAG_DEBUG] ✅ Found Pokemon: ${pokemon.name}`);
    
    if (overId === 'rankings-drop-zone') {
      console.log(`🔄🔄🔄 [DRAG_DEBUG] 🎯 Dropping to rankings drop zone`);
      handleDragToRankings(pokemonId);
      return;
    } else if (!overId.startsWith('available-')) {
      // Dragging over a specific Pokemon in rankings
      const overPokemonId = Number(overId);
      const insertIndex = displayRankings.findIndex(p => p.id === overPokemonId);
      console.log(`🔄🔄🔄 [DRAG_DEBUG] 🎯 Dropping near Pokemon ${overPokemonId} at index ${insertIndex}`);
      if (insertIndex !== -1) {
        handleDragToRankings(pokemonId, insertIndex);
        return;
      }
    }
  }

  // Handle reordering within rankings (both IDs should be numeric for ranked Pokemon)
  if (!activeId.startsWith('available-') && !overId.startsWith('available-') && overId !== 'rankings-drop-zone') {
    const activePokemonId = Number(activeId);
    const overPokemonId = Number(overId);
    
    console.log(`🔄🔄🔄 [DRAG_DEBUG] 🔄 REORDERING WITHIN RANKINGS: ${activePokemonId} -> ${overPokemonId}`);
    
    // Find the indices of the dragged and target Pokemon
    const oldIndex = displayRankings.findIndex(p => p.id === activePokemonId);
    const newIndex = displayRankings.findIndex(p => p.id === overPokemonId);
    
    console.log(`🔄🔄🔄 [DRAG_DEBUG] Old index: ${oldIndex}, New index: ${newIndex}`);
    
    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      console.log(`🔄🔄🔄 [DRAG_DEBUG] ✅ Performing reorder from ${oldIndex} to ${newIndex}`);
      
      // Use arrayMove for proper reordering
      const newRankings = arrayMove(displayRankings, oldIndex, newIndex);
      setRankedPokemon(newRankings);
      setHasManualChanges(true);
    }
  }
  
  console.log(`🔄🔄🔄 [DRAG_DEBUG] === DRAG END COMPLETE ===`);
};
