
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
import { useEnhancedManualReorder } from "@/hooks/battle/useEnhancedManualReorder";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { toast } from "@/hooks/use-toast";

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
  
  // Add drag overlay state
  const [activeDraggedPokemon, setActiveDraggedPokemon] = useState<any>(null);
  
  // Get TrueSkill store functions
  const { clearAllRatings } = useTrueSkillStore();
  
  // CRITICAL FIX: Initialize from TrueSkill when switching to Manual mode
  useEffect(() => {
    const trueskillRankings = localRankings.length > 0 ? localRankings : battleModeRankings;
    
    console.log(`🔄 [TRUESKILL_INIT] Manual mode initialization check for gen ${selectedGeneration}`);
    console.log(`🔄 [TRUESKILL_INIT] rankedPokemon.length: ${rankedPokemon.length}`);
    console.log(`🔄 [TRUESKILL_INIT] trueskillRankings.length: ${trueskillRankings.length}`);
    console.log(`🔄 [TRUESKILL_INIT] hasManualChanges: ${hasManualChanges}`);
    
    // Check for saved manual rankings first
    const savedRankings = localStorage.getItem(`manual-rankings-gen-${selectedGeneration}`);
    
    if (savedRankings) {
      try {
        const parsed = JSON.parse(savedRankings);
        console.log(`🔄 [TRUESKILL_INIT] Loading saved manual rankings: ${parsed.length} items`);
        setRankedPokemon(parsed);
        setHasManualChanges(true);
        return;
      } catch (error) {
        console.error(`🔄 [TRUESKILL_INIT] Failed to load saved rankings:`, error);
      }
    }
    
    // If no saved rankings and no current manual rankings, initialize from TrueSkill
    if (trueskillRankings.length > 0 && rankedPokemon.length === 0) {
      console.log(`🔄 [TRUESKILL_INIT] ✅ Initializing from TrueSkill: ${trueskillRankings.length} Pokemon`);
      setRankedPokemon(trueskillRankings);
    }
  }, [localRankings, battleModeRankings, selectedGeneration, rankedPokemon.length, setRankedPokemon]);

  // Reset state when generation changes
  useEffect(() => {
    console.log(`🔄 [TRUESKILL_INIT] Generation changed to ${selectedGeneration}, resetting state`);
    setHasManualChanges(false);
  }, [selectedGeneration]);

  // Persistence effect
  useEffect(() => {
    console.log(`💾 [PERSISTENCE_DEBUG] Saving ranked Pokemon to localStorage: ${rankedPokemon.length} items`);
    if (rankedPokemon.length > 0 && hasManualChanges) {
      localStorage.setItem(`manual-rankings-gen-${selectedGeneration}`, JSON.stringify(rankedPokemon));
    }
  }, [rankedPokemon, selectedGeneration, hasManualChanges]);
  
  // Determine what to show on the right side - always use manual state once populated
  const displayRankings = rankedPokemon;
  
  // FIXED: Filter available Pokemon to exclude those in the display rankings
  const displayRankingsIds = new Set(displayRankings.map(p => p.id));
  const filteredAvailablePokemon = availablePokemon.filter(p => !displayRankingsIds.has(p.id));
  
  console.log(`🔍🔍🔍 [RANKING_UI_DEBUG] Manual rankedPokemon: ${rankedPokemon.length}, localRankings: ${localRankings.length}, battleModeRankings: ${battleModeRankings.length}`);
  console.log(`🔍🔍🔍 [RANKING_UI_DEBUG] displayRankings length: ${displayRankings.length}`);
  console.log(`🔍🔍🔍 [RANKING_UI_DEBUG] hasManualChanges: ${hasManualChanges}`);
  console.log(`🔍🔍🔍 [RANKING_UI_DEBUG] filteredAvailablePokemon length: ${filteredAvailablePokemon.length}`);

  // COMPREHENSIVE RESET: Same as Battle Mode
  const handleComprehensiveReset = () => {
    const timestamp = new Date().toISOString();
    
    console.log(`🔄 [COMPREHENSIVE_RESET] ===== COMPREHENSIVE RESTART INITIATED =====`);
    console.log(`🔄 [COMPREHENSIVE_RESET] Timestamp: ${timestamp}`);
    
    // Step 1: Clear TrueSkill store first (this affects both modes)
    console.log(`🔄 [COMPREHENSIVE_RESET] Step 1: Clearing TrueSkill store`);
    clearAllRatings();
    
    // Step 2: Clear all localStorage items
    console.log(`🔄 [COMPREHENSIVE_RESET] Step 2: Clearing localStorage`);
    const keysToRemove = [
      'pokemon-active-suggestions',
      'pokemon-battle-count',
      'pokemon-battle-results',
      'pokemon-battle-tracking',
      'pokemon-battle-history',
      'pokemon-battles-completed',
      'pokemon-battle-seen',
      'suggestionUsageCounts',
      'pokemon-ranker-rankings',
      'pokemon-ranker-confidence'
    ];
    
    // Also clear generation-specific manual rankings
    for (let gen = 0; gen <= 9; gen++) {
      keysToRemove.push(`manual-rankings-gen-${gen}`);
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🔄 [COMPREHENSIVE_RESET] Cleared: ${key}`);
    });
    
    // Step 3: Reset React state
    console.log(`🔄 [COMPREHENSIVE_RESET] Step 3: Resetting React state`);
    setRankedPokemon([]);
    setHasManualChanges(false);
    
    // Step 4: Call the original reset from the parent
    onReset();
    
    // Step 5: Dispatch events to notify other components
    console.log(`🔄 [COMPREHENSIVE_RESET] Step 5: Dispatching reset events`);
    setTimeout(() => {
      // Notify both modes
      const manualModeEvent = new CustomEvent('trueskill-store-cleared');
      document.dispatchEvent(manualModeEvent);
      
      // General reset event
      const resetEvent = new CustomEvent('battle-system-reset', {
        detail: { timestamp, source: 'manual-mode-restart' }
      });
      document.dispatchEvent(resetEvent);
      
      console.log(`🔄 [COMPREHENSIVE_RESET] ✅ Events dispatched`);
    }, 50);
    
    // Step 6: Show success toast
    toast({
      title: "Complete Reset",
      description: "All battles, rankings, and progress have been completely reset across both modes.",
      duration: 3000
    });
    
    console.log(`🔄 [COMPREHENSIVE_RESET] ===== COMPREHENSIVE RESET COMPLETE =====`);
  };

  // Enhanced manual reorder with fake battles (preserving the existing system)
  const { handleEnhancedManualReorder } = useEnhancedManualReorder(
    displayRankings,
    setRankedPokemon,
    true // preventAutoResorting = true to maintain manual order
  );

  // CRITICAL DEBUG: Completely rewrite drag to rankings to be bulletproof
  const handleDragToRankings = (pokemonId: number) => {
    console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] ===== BULLETPROOF DRAG TO RANKINGS =====`);
    console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] Step 1: Find Pokemon ${pokemonId} in available list`);
    console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] Available Pokemon count: ${availablePokemon.length}`);
    console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] Available Pokemon IDs: ${availablePokemon.map(p => p.id).slice(0, 10).join(', ')}...`);
    
    const pokemon = availablePokemon.find(p => p.id === pokemonId);
    if (!pokemon) {
      console.error(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] ❌ CRITICAL ERROR: Pokemon ${pokemonId} not found in available list!`);
      console.error(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] Available IDs:`, availablePokemon.map(p => p.id));
      return;
    }
    
    console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] Step 2: Found Pokemon: ${pokemon.name}`);
    console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] Current ranked Pokemon count: ${rankedPokemon.length}`);
    console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] Current ranked Pokemon IDs: ${rankedPokemon.map(p => p.id).join(', ')}`);
    
    // Check if Pokemon is already in ranked list (defensive)
    const alreadyRanked = rankedPokemon.find(p => p.id === pokemonId);
    if (alreadyRanked) {
      console.error(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] ❌ CRITICAL ERROR: Pokemon ${pokemonId} is already in ranked list!`);
      return;
    }
    
    console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] Step 3: Calculating new state`);
    
    // Calculate new state
    const newAvailable = availablePokemon.filter(p => p.id !== pokemonId);
    const newRanked = [...rankedPokemon, pokemon];
    
    console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] New available count: ${newAvailable.length} (removed 1)`);
    console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] New ranked count: ${newRanked.length} (added 1)`);
    console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] Sanity check: ${availablePokemon.length} - 1 = ${newAvailable.length} ✓`);
    console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] Sanity check: ${rankedPokemon.length} + 1 = ${newRanked.length} ✓`);
    
    console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] Step 4: Applying state updates`);
    
    try {
      setAvailablePokemon(newAvailable);
      console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] ✅ Available Pokemon state updated`);
      
      setRankedPokemon(newRanked);
      console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] ✅ Ranked Pokemon state updated`);
      
      setHasManualChanges(true);
      console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] ✅ Manual changes flag set`);
      
      console.log(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] ===== SUCCESS: ${pokemon.name} moved to rankings =====`);
      
    } catch (error) {
      console.error(`🔥🔥🔥 [DRAG_TO_RANKINGS_CRITICAL] ❌ CRITICAL ERROR during state update:`, error);
    }
  };

  // Handle manual reordering within the rankings (using enhanced system with fake battles)
  const handleManualReorder = (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
    console.log(`🔍🔍🔍 [RANKING_UI_DEBUG] Manual reorder: Pokemon ${draggedPokemonId} from ${sourceIndex} to ${destinationIndex}`);
    setHasManualChanges(true);
    
    // Use the enhanced manual reorder that creates fake battles
    handleEnhancedManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
  };

  // Handle local reordering (for DragDropGrid compatibility)
  const handleLocalReorder = (newRankings: any[]) => {
    console.log(`🔍🔍🔍 [RANKING_UI_DEBUG] Local reorder with ${newRankings.length} Pokemon`);
    setHasManualChanges(true);
    setRankedPokemon(newRankings);
  };

  // CRITICAL DEBUG: Enhanced drag handlers with comprehensive logging
  const handleDragStart = (event: DragStartEvent) => {
    console.log(`🌟🌟🌟 [DRAG_DEBUG_CRITICAL] ===== DRAG START DETAILED =====`);
    console.log(`🌟🌟🌟 [DRAG_DEBUG_CRITICAL] Active ID: ${event.active.id}`);
    console.log(`🌟🌟🌟 [DRAG_DEBUG_CRITICAL] Active data:`, event.active.data);
    console.log(`🌟🌟🌟 [DRAG_DEBUG_CRITICAL] Event:`, event);

    // Set the dragged Pokemon for overlay
    const activeId = event.active.id.toString();
    let draggedPokemon = null;
    
    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      draggedPokemon = availablePokemon.find(p => p.id === pokemonId);
      console.log(`🌟🌟🌟 [DRAG_DEBUG_CRITICAL] Found available Pokemon for overlay: ${draggedPokemon?.name} (ID: ${pokemonId})`);
    } else {
      const pokemonId = parseInt(activeId);
      draggedPokemon = displayRankings.find(p => p.id === pokemonId);
      console.log(`🌟🌟🌟 [DRAG_DEBUG_CRITICAL] Found ranked Pokemon for overlay: ${draggedPokemon?.name} (ID: ${pokemonId})`);
    }
    
    setActiveDraggedPokemon(draggedPokemon);
    console.log(`🌟🌟🌟 [DRAG_DEBUG_CRITICAL] Overlay Pokemon set:`, draggedPokemon?.name || 'null');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    console.log(`💥💥💥 [DRAG_END_CRITICAL] ===== DRAG END DETAILED =====`);
    
    // Clear the drag overlay FIRST
    setActiveDraggedPokemon(null);
    console.log(`💥💥💥 [DRAG_END_CRITICAL] Drag overlay cleared`);
    
    const { active, over } = event;
    
    console.log(`💥💥💥 [DRAG_END_CRITICAL] Active:`, active);
    console.log(`💥💥💥 [DRAG_END_CRITICAL] Over:`, over);
    
    if (!over) {
      console.log(`💥💥💥 [DRAG_END_CRITICAL] ❌ No drop target - drag cancelled`);
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();

    console.log(`💥💥💥 [DRAG_END_CRITICAL] Active ID: ${activeId}`);
    console.log(`💥💥💥 [DRAG_END_CRITICAL] Over ID: ${overId}`);
    console.log(`💥💥💥 [DRAG_END_CRITICAL] Over data:`, over.data);

    // CRITICAL: Check for dragging from available to rankings
    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      console.log(`💥💥💥 [DRAG_END_CRITICAL] 🎯 AVAILABLE TO RANKINGS: Pokemon ID: ${pokemonId}`);
      console.log(`💥💥💥 [DRAG_END_CRITICAL] 🎯 Drop target: ${overId}`);
      
      // Accept ANY drop target in rankings area
      if (overId === 'rankings-drop-zone' || !overId.startsWith('available-')) {
        console.log(`💥💥💥 [DRAG_END_CRITICAL] ✅ Valid drop target - calling handleDragToRankings`);
        handleDragToRankings(pokemonId);
      } else {
        console.log(`💥💥💥 [DRAG_END_CRITICAL] ❌ Invalid drop target for available Pokemon`);
      }
      return;
    }

    // Handle reordering within rankings
    if (!activeId.startsWith('available-') && !overId.startsWith('available-') && overId !== 'rankings-drop-zone') {
      const activePokemonId = Number(activeId);
      const overPokemonId = Number(overId);
      
      console.log(`💥💥💥 [DRAG_END_CRITICAL] 🔄 REORDERING WITHIN RANKINGS: ${activePokemonId} -> ${overPokemonId}`);
      
      const oldIndex = displayRankings.findIndex(p => p.id === activePokemonId);
      const newIndex = displayRankings.findIndex(p => p.id === overPokemonId);
      
      console.log(`💥💥💥 [DRAG_END_CRITICAL] Old index: ${oldIndex}, New index: ${newIndex}`);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        console.log(`💥💥💥 [DRAG_END_CRITICAL] ✅ Performing reorder from ${oldIndex} to ${newIndex}`);
        handleManualReorder(activePokemonId, oldIndex, newIndex);
      } else {
        console.log(`💥💥💥 [DRAG_END_CRITICAL] ❌ Invalid reorder indices or same position`);
      }
    }
    
    console.log(`💥💥💥 [DRAG_END_CRITICAL] ===== DRAG END COMPLETE =====`);
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
            onRestartBattles={handleComprehensiveReset}
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

      {/* Add drag overlay for visibility */}
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
