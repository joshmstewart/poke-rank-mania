
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
    console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] ===== MANUAL REORDER STARTED =====`);
    console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] Step 1: Input validation`);
    console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] - draggedPokemonId: ${draggedPokemonId} (type: ${typeof draggedPokemonId})`);
    console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] - sourceIndex: ${sourceIndex} (type: ${typeof sourceIndex})`);
    console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] - destinationIndex: ${destinationIndex} (type: ${typeof destinationIndex})`);
    console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] - finalRankings length: ${finalRankings?.length || 0}`);
    
    console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] Step 2: RefinementQueue validation`);
    console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] - refinementQueue exists: ${!!refinementQueue}`);
    console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] - refinementQueue type: ${typeof refinementQueue}`);
    
    if (refinementQueue) {
      console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] - refinementQueue keys:`, Object.keys(refinementQueue));
      console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] - addValidationBattle exists: ${!!refinementQueue.addValidationBattle}`);
      console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] - addValidationBattle type: ${typeof refinementQueue.addValidationBattle}`);
      console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] - current queue size: ${refinementQueue.refinementBattleCount || 0}`);
      console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] - current queue contents:`, refinementQueue.queue || refinementQueue.refinementQueue || []);
    }
    
    console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] Step 3: Pokemon lookup`);
    const draggedPokemon = finalRankings.find(p => p.id === draggedPokemonId);
    console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] - draggedPokemon found: ${!!draggedPokemon}`);
    if (draggedPokemon) {
      console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] - draggedPokemon details:`, {
        id: draggedPokemon.id,
        name: draggedPokemon.name,
        score: draggedPokemon.score
      });
    } else {
      console.error(`🔄 [MANUAL_REORDER_MEGA_TRACE] ❌ Pokemon ${draggedPokemonId} not found in finalRankings`);
      console.error(`🔄 [MANUAL_REORDER_MEGA_TRACE] Available rankings:`, finalRankings.slice(0, 10).map(p => ({ id: p.id, name: p.name })));
      console.error(`🔄 [MANUAL_REORDER_MEGA_TRACE] Searching in finalRankings with different ID types...`);
      
      // Try to find with string conversion
      const draggedPokemonString = finalRankings.find(p => String(p.id) === String(draggedPokemonId));
      console.error(`🔄 [MANUAL_REORDER_MEGA_TRACE] String conversion search result:`, !!draggedPokemonString);
      
      if (draggedPokemonString) {
        console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] ✅ Found via string conversion - using this Pokemon`);
        console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] Pokemon details:`, {
          id: draggedPokemonString.id,
          name: draggedPokemonString.name,
          originalId: draggedPokemonId,
          foundId: draggedPokemonString.id
        });
        // Update the reference to use the found Pokemon
        const correctedPokemon = draggedPokemonString;
        
        console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] Step 4: Calling addValidationBattle with corrected Pokemon`);
        if (refinementQueue && typeof refinementQueue.addValidationBattle === 'function') {
          console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] ✅ About to call addValidationBattle...`);
          
          try {
            console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] 🚀 CALLING addValidationBattle(${correctedPokemon.id}, "${correctedPokemon.name}", ${sourceIndex}, ${destinationIndex})`);
            refinementQueue.addValidationBattle(correctedPokemon.id, correctedPokemon.name, sourceIndex, destinationIndex);
            console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] ✅ addValidationBattle completed successfully`);
            
            // Log the queue state after adding
            console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] Queue state after adding:`, {
              queueSize: refinementQueue.refinementBattleCount || 0,
              queueContents: refinementQueue.queue || refinementQueue.refinementQueue || []
            });
            
          } catch (error) {
            console.error(`🔄 [MANUAL_REORDER_MEGA_TRACE] ❌ Error calling addValidationBattle:`, error);
            console.error(`🔄 [MANUAL_REORDER_MEGA_TRACE] Error details:`, {
              message: error.message,
              stack: error.stack
            });
            return;
          }
        } else {
          console.error(`🔄 [MANUAL_REORDER_MEGA_TRACE] ❌ addValidationBattle is not available`);
          console.error(`🔄 [MANUAL_REORDER_MEGA_TRACE] refinementQueue structure:`, refinementQueue);
          return;
        }
        
        console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] Step 5: Toast notification`);
        toast.info(`Validation queued for ${correctedPokemon.name}`, {
          description: `Position will be tested in upcoming battles`
        });
        console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] ✅ Toast shown`);

        console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] Step 6: Dispatching force-next-battle event`);
        const forceNextBattleEvent = new CustomEvent('force-next-battle', {
          detail: { 
            pokemonId: correctedPokemon.id,
            pokemonName: correctedPokemon.name,
            source: 'manual-reorder'
          }
        });
        
        console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] Event details:`, forceNextBattleEvent.detail);
        document.dispatchEvent(forceNextBattleEvent);
        console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] ✅ Event dispatched`);
        
        console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] Step 7: Final validation`);
        console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] Final queue size: ${refinementQueue.refinementBattleCount || 0}`);
        console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] Pending refinements should now include: ${correctedPokemon.id}`);
        
        console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] ===== MANUAL REORDER COMPLETED =====`);
        return;
      }
      
      console.error(`🔄 [MANUAL_REORDER_MEGA_TRACE] ❌ Could not find Pokemon even with string conversion - aborting`);
      return;
    }

    console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] Step 4: Calling addValidationBattle`);
    if (refinementQueue && typeof refinementQueue.addValidationBattle === 'function') {
      console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] ✅ About to call addValidationBattle...`);
      
      try {
        console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] 🚀 CALLING addValidationBattle(${draggedPokemonId}, "${draggedPokemon.name}", ${sourceIndex}, ${destinationIndex})`);
        refinementQueue.addValidationBattle(draggedPokemonId, draggedPokemon.name, sourceIndex, destinationIndex);
        console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] ✅ addValidationBattle completed successfully`);
        
        // Log the queue state after adding
        console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] Queue state after adding:`, {
          queueSize: refinementQueue.refinementBattleCount || 0,
          queueContents: refinementQueue.queue || refinementQueue.refinementQueue || []
        });
        
      } catch (error) {
        console.error(`🔄 [MANUAL_REORDER_MEGA_TRACE] ❌ Error calling addValidationBattle:`, error);
        console.error(`🔄 [MANUAL_REORDER_MEGA_TRACE] Error details:`, {
          message: error.message,
          stack: error.stack
        });
        return;
      }
    } else {
      console.error(`🔄 [MANUAL_REORDER_MEGA_TRACE] ❌ addValidationBattle is not available`);
      console.error(`🔄 [MANUAL_REORDER_MEGA_TRACE] refinementQueue structure:`, refinementQueue);
      return;
    }
    
    console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] Step 5: Toast notification`);
    toast.info(`Validation queued for ${draggedPokemon.name}`, {
      description: `Position will be tested in upcoming battles`
    });
    console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] ✅ Toast shown`);

    console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] Step 6: Dispatching force-next-battle event`);
    const forceNextBattleEvent = new CustomEvent('force-next-battle', {
      detail: { 
        pokemonId: draggedPokemonId,
        pokemonName: draggedPokemon.name,
        source: 'manual-reorder'
      }
    });
    
    console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] Event details:`, forceNextBattleEvent.detail);
    document.dispatchEvent(forceNextBattleEvent);
    console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] ✅ Event dispatched`);
    
    console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] Step 7: Final validation`);
    console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] Final queue size: ${refinementQueue.refinementBattleCount || 0}`);
    console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] Pending refinements should now include: ${draggedPokemonId}`);
    
    console.log(`🔄 [MANUAL_REORDER_MEGA_TRACE] ===== MANUAL REORDER COMPLETED =====`);
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
