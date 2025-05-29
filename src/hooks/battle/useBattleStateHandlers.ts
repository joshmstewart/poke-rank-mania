
import { useCallback, useState, useMemo } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { toast } from "sonner";

export const useBattleStateHandlers = (
  allPokemon: Pokemon[],
  currentBattle: Pokemon[],
  selectedPokemon: number[],
  battleType: BattleType,
  selectedGeneration: number,
  battlesCompleted: number,
  milestones: number[],
  finalRankings: RankedPokemon[],
  frozenPokemon: number[],
  battleHistory: { battle: Pokemon[], selected: number[] }[],
  startNewBattle: (battleType: BattleType) => Pokemon[],
  getCurrentRankings: () => RankedPokemon[],
  refinementQueue: any,
  setBattleHistory: any,
  setBattlesCompleted: any,
  setBattleResults: any,
  setSelectedPokemon: any,
  setCurrentBattle: any,
  setMilestoneInProgress: any,
  setShowingMilestone: any,
  setRankingGenerated: any,
  setIsBattleTransitioning: any,
  setIsAnyProcessing: any,
  processBattleResultWithRefinement: any,
  clearAllSuggestions: any,
  clearRefinementQueue: any,
  generateRankings: any
) => {
  console.log(`🔧 [HANDLERS_DEBUG] useBattleStateHandlers called`);

  // Create pending refinements set from the refinement queue
  const pendingRefinements = useMemo(() => {
    const pending = new Set<number>();
    if (refinementQueue?.queue) {
      refinementQueue.queue.forEach((item: any) => {
        if (item.targetPokemonId) {
          pending.add(item.targetPokemonId);
        }
      });
    }
    console.log(`🔧 [HANDLERS_DEBUG] Pending refinements:`, Array.from(pending));
    return pending;
  }, [refinementQueue?.queue]);

  const refinementBattleCount = refinementQueue?.queue?.length || 0;

  const handlePokemonSelect = useCallback((pokemonId: number) => {
    console.log(`🎯 [POKEMON_SELECT_ULTRA_DEBUG] Pokemon ${pokemonId} selected. Current selections: ${JSON.stringify(selectedPokemon)}`);
    
    if (selectedPokemon.includes(pokemonId)) {
      console.log(`🎯 [POKEMON_SELECT_ULTRA_DEBUG] Pokemon ${pokemonId} already selected, ignoring`);
      return;
    }

    const newSelection = [...selectedPokemon, pokemonId];
    console.log(`🎯 [POKEMON_SELECT_ULTRA_DEBUG] Adding Pokemon ${pokemonId}. New selection: ${JSON.stringify(newSelection)}`);
    
    setSelectedPokemon(newSelection);

    if (battleType === "pairs" && newSelection.length === 1) {
      console.log(`🎯 [POKEMON_SELECT_ULTRA_DEBUG] Pairs battle completed with selection: ${newSelection}`);
      processBattleResultWithRefinement(newSelection, currentBattle, battleType, selectedGeneration);
    }
  }, [selectedPokemon, setSelectedPokemon, battleType, currentBattle, selectedGeneration, processBattleResultWithRefinement]);

  const goBack = useCallback(() => {
    if (battleHistory.length === 0) return;

    const newHistory = [...battleHistory];
    const lastBattle = newHistory.pop();
    setBattleHistory(newHistory);

    if (lastBattle) {
      setCurrentBattle(lastBattle.battle);
      setSelectedPokemon([]);
    }

    setBattlesCompleted((prev: number) => Math.max(0, prev - 1));
  }, [battleHistory, setBattleHistory, setCurrentBattle, setSelectedPokemon, setBattlesCompleted]);

  const startNewBattleWrapper = useCallback(() => {
    console.log(`🚀 [START_NEW_BATTLE] startNewBattleWrapper called`);
    const result = startNewBattle(battleType);
    console.log(`🚀 [START_NEW_BATTLE] Result:`, result?.map(p => p.name) || 'null');
    return result;
  }, [startNewBattle, battleType]);

  const performFullBattleReset = useCallback(() => {
    console.log(`🔄 [RESET_DEBUG] Performing full battle reset`);
    
    setBattlesCompleted(0);
    setBattleResults([]);
    setBattleHistory([]);
    setSelectedPokemon([]);
    setMilestoneInProgress(false);
    setShowingMilestone(false);
    setRankingGenerated(false);
    setIsBattleTransitioning(false);
    setIsAnyProcessing(false);
    
    clearAllSuggestions();
    clearRefinementQueue();
    
    localStorage.removeItem('pokemon-battle-count');
    localStorage.removeItem('pokemon-battle-results');
    
    setTimeout(() => {
      startNewBattleWrapper();
    }, 100);
    
    toast.success("Battle progress reset", {
      description: "Starting fresh with a new battle"
    });
  }, [
    setBattlesCompleted, setBattleResults, setBattleHistory, setSelectedPokemon,
    setMilestoneInProgress, setShowingMilestone, setRankingGenerated,
    setIsBattleTransitioning, setIsAnyProcessing, clearAllSuggestions, 
    clearRefinementQueue, startNewBattleWrapper
  ]);

  const handleManualReorder = useCallback((draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
    console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] ===== MANUAL REORDER STARTED =====`);
    console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] draggedPokemonId: ${draggedPokemonId}`);
    console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] sourceIndex: ${sourceIndex}`);
    console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] destinationIndex: ${destinationIndex}`);
    console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] refinementQueue object:`, refinementQueue);
    console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] refinementQueue type: ${typeof refinementQueue}`);
    console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] refinementQueue exists: ${!!refinementQueue}`);
    
    if (refinementQueue) {
      console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] refinementQueue keys:`, Object.keys(refinementQueue));
      console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] addValidationBattle exists: ${!!refinementQueue.addValidationBattle}`);
      console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] addValidationBattle type: ${typeof refinementQueue.addValidationBattle}`);
    }
    
    const draggedPokemon = finalRankings.find(p => p.id === draggedPokemonId);
    console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] draggedPokemon found: ${!!draggedPokemon}`);
    console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] draggedPokemon:`, draggedPokemon);
    
    if (!draggedPokemon) {
      console.error(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] ❌ Pokemon ${draggedPokemonId} not found in rankings`);
      console.error(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] Available rankings:`, finalRankings.map(p => ({ id: p.id, name: p.name })));
      return;
    }

    // Add to refinement queue
    console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] About to call addValidationBattle...`);
    
    try {
      if (refinementQueue && typeof refinementQueue.addValidationBattle === 'function') {
        console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] ✅ Calling addValidationBattle for ${draggedPokemon.name}`);
        console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] Parameters: ${draggedPokemonId}, "${draggedPokemon.name}", ${sourceIndex}, ${destinationIndex}`);
        
        refinementQueue.addValidationBattle(draggedPokemonId, draggedPokemon.name, sourceIndex, destinationIndex);
        
        console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] ✅ addValidationBattle called successfully`);
        console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] Queue after adding:`, refinementQueue.queue || refinementQueue.refinementQueue);
      } else {
        console.error(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] ❌ addValidationBattle is not a function or refinementQueue is null`);
        console.error(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] refinementQueue:`, refinementQueue);
        console.error(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] This means the drag functionality won't work`);
        return;
      }
    } catch (error) {
      console.error(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] ❌ Error calling addValidationBattle:`, error);
      console.error(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] Error stack:`, error.stack);
      return;
    }
    
    // Show toast notification
    console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] Showing toast notification`);
    toast.info(`Validation queued for ${draggedPokemon.name}`, {
      description: `Position will be tested in upcoming battles`
    });

    // Force start a new battle to begin validation
    console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] Dispatching force-next-battle event`);
    const forceNextBattleEvent = new CustomEvent('force-next-battle', {
      detail: { 
        pokemonId: draggedPokemonId,
        pokemonName: draggedPokemon.name,
        source: 'manual-reorder'
      }
    });
    document.dispatchEvent(forceNextBattleEvent);
    
    console.log(`🔄 [MANUAL_REORDER_ULTRA_DEBUG] ===== MANUAL REORDER COMPLETED =====`);
  }, [finalRankings, refinementQueue]);

  return {
    handlePokemonSelect,
    goBack,
    startNewBattleWrapper,
    performFullBattleReset,
    handleManualReorder,
    pendingRefinements,
    refinementBattleCount,
    clearRefinementQueue
  };
};
