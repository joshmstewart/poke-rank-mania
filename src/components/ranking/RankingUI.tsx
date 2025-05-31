
import React, { useEffect, useState } from "react";
import { DndContext, DragEndEvent, DragStartEvent, closestCenter, DragOverlay } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { LoadingState } from "./LoadingState";
import { AvailablePokemonSection } from "./AvailablePokemonSection";
import { RankingsSection } from "./RankingsSection";
import { useTrueSkillSync } from "@/hooks/ranking/useTrueSkillSync";
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
  rankedPokemon, // This will be ignored in favor of TrueSkill rankings
  selectedGeneration,
  loadingType,
  currentPage,
  totalPages,
  loadSize,
  loadingRef,
  setAvailablePokemon,
  setRankedPokemon, // This will be ignored in favor of TrueSkill rankings
  handlePageChange,
  getPageRange,
  onGenerationChange,
  onReset
}) => {
  // Get TrueSkill-based rankings - this is the ONLY source of truth
  const { localRankings } = useTrueSkillSync();
  
  // Battle type state (needed for BattleControls compatibility)
  const [battleType, setBattleType] = useState<BattleType>("pairs");
  
  // Add drag overlay state
  const [activeDraggedPokemon, setActiveDraggedPokemon] = useState<any>(null);
  
  // Get TrueSkill store functions
  const { clearAllRatings } = useTrueSkillStore();
  
  console.log(`🔥 [RANKING_UI_FIXED] Manual mode using TrueSkill rankings: ${localRankings.length} Pokemon`);
  console.log(`🔥 [RANKING_UI_FIXED] Ignoring separate rankedPokemon state: ${rankedPokemon.length}`);

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
    
    // Step 3: Reset parent React state (but Manual mode will use TrueSkill)
    console.log(`🔄 [COMPREHENSIVE_RESET] Step 3: Resetting parent state`);
    setRankedPokemon([]);
    
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
    localRankings, // Use TrueSkill rankings, not separate state
    (newRankings) => {
      console.log(`🔥 [RANKING_UI_FIXED] Manual reorder completed with ${newRankings.length} Pokemon`);
      // Note: We don't update setRankedPokemon anymore since we use TrueSkill
    },
    true // preventAutoResorting = true to maintain manual order
  );

  // COMPLETELY FIXED: Super simple drag to rankings
  const handleDragToRankings = (pokemonId: number) => {
    console.log(`🔥 [DRAG_FIXED] Simple drag to rankings for Pokemon ${pokemonId}`);
    
    const pokemon = availablePokemon.find(p => p.id === pokemonId);
    if (!pokemon) {
      console.error(`🔥 [DRAG_FIXED] Pokemon ${pokemonId} not found in available list`);
      return;
    }
    
    console.log(`🔥 [DRAG_FIXED] Found Pokemon: ${pokemon.name}, moving to rankings`);
    
    // Simple atomic operations - only remove from available
    setAvailablePokemon(prev => {
      const updated = prev.filter(p => p.id !== pokemonId);
      console.log(`🔥 [DRAG_FIXED] Removed ${pokemon.name} from available (${prev.length} -> ${updated.length})`);
      return updated;
    });
    
    // Pokemon will appear in rankings through TrueSkill sync once it gets rated
    console.log(`🔥 [DRAG_FIXED] Pokemon ${pokemon.name} will appear in rankings via TrueSkill`);
  };

  // Handle manual reordering within the rankings (using enhanced system with fake battles)
  const handleManualReorder = (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
    console.log(`🔥 [RANKING_UI] Manual reorder: Pokemon ${draggedPokemonId} from ${sourceIndex} to ${destinationIndex}`);
    
    // Use the enhanced manual reorder that creates fake battles
    handleEnhancedManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
  };

  // Handle local reordering (for DragDropGrid compatibility)
  const handleLocalReorder = (newRankings: any[]) => {
    console.log(`🔥 [RANKING_UI] Local reorder with ${newRankings.length} Pokemon`);
    // Note: We don't update local state since we use TrueSkill rankings
  };

  // COMPLETELY FIXED: Super simple drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    console.log(`🔥 [DRAG_FIXED] Drag start: ${event.active.id}`);

    const activeId = event.active.id.toString();
    let draggedPokemon = null;
    
    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      draggedPokemon = availablePokemon.find(p => p.id === pokemonId);
      console.log(`🔥 [DRAG_FIXED] Dragging available Pokemon: ${draggedPokemon?.name} (ID: ${pokemonId})`);
    } else {
      const pokemonId = parseInt(activeId);
      draggedPokemon = localRankings.find(p => p.id === pokemonId);
      console.log(`🔥 [DRAG_FIXED] Dragging ranked Pokemon: ${draggedPokemon?.name} (ID: ${pokemonId})`);
    }
    
    setActiveDraggedPokemon(draggedPokemon);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    console.log(`🔥 [DRAG_FIXED] ===== DRAG END =====`);
    
    setActiveDraggedPokemon(null);
    
    const { active, over } = event;
    
    if (!over) {
      console.log(`🔥 [DRAG_FIXED] No drop target - drag cancelled`);
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();

    console.log(`🔥 [DRAG_FIXED] Dropped ${activeId} onto ${overId}`);

    // FIXED: Simplified drag from available to rankings detection
    if (activeId.startsWith('available-')) {
      const pokemonId = parseInt(activeId.replace('available-', ''));
      
      // Accept ANY drop that's not on another available Pokemon
      if (!overId.startsWith('available-')) {
        console.log(`🔥 [DRAG_FIXED] ✅ Valid drop to rankings area - executing move`);
        handleDragToRankings(pokemonId);
        return;
      } else {
        console.log(`🔥 [DRAG_FIXED] ❌ Invalid drop - cannot drop available on available`);
        return;
      }
    }

    // Handle reordering within rankings
    if (!activeId.startsWith('available-') && !overId.startsWith('available-') && overId !== 'rankings-drop-zone') {
      const activePokemonId = Number(activeId);
      const overPokemonId = Number(overId);
      
      const oldIndex = localRankings.findIndex(p => p.id === activePokemonId);
      const newIndex = localRankings.findIndex(p => p.id === overPokemonId);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        console.log(`🔥 [DRAG_FIXED] ✅ Reordering within rankings from ${oldIndex} to ${newIndex}`);
        handleManualReorder(activePokemonId, oldIndex, newIndex);
      } else {
        console.log(`🔥 [DRAG_FIXED] ❌ Invalid reorder attempt: oldIndex=${oldIndex}, newIndex=${newIndex}`);
      }
    }
    
    console.log(`🔥 [DRAG_FIXED] ===== DRAG END COMPLETE =====`);
  };

  // Use TrueSkill rankings as the single source of truth
  const displayRankings = localRankings;
  
  // Filter available Pokemon to exclude those in the display rankings
  const displayRankingsIds = new Set(displayRankings.map(p => p.id));
  const filteredAvailablePokemon = availablePokemon.filter(p => !displayRankingsIds.has(p.id));
  
  console.log(`🔥 [RANKING_UI_FIXED] TrueSkill localRankings: ${localRankings.length}`);
  console.log(`🔥 [RANKING_UI_FIXED] displayRankings length: ${displayRankings.length}`);
  console.log(`🔥 [RANKING_UI_FIXED] Filtered available: ${filteredAvailablePokemon.length}`);

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
