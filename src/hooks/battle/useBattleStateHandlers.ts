
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

  // CRITICAL FIX: Create pending refinements set from the refinement queue with proper reactivity
  const pendingRefinements = useMemo(() => {
    const pending = new Set<number>();
    
    console.log(`🔧 [PENDING_REFINEMENTS_FIX] Creating pending refinements set`);
    console.log(`🔧 [PENDING_REFINEMENTS_FIX] refinementQueue exists:`, !!refinementQueue);
    console.log(`🔧 [PENDING_REFINEMENTS_FIX] refinementQueue.queue exists:`, !!refinementQueue?.queue);
    console.log(`🔧 [PENDING_REFINEMENTS_FIX] refinementQueue.refinementQueue exists:`, !!refinementQueue?.refinementQueue);
    
    // Check both possible queue locations
    const queue = refinementQueue?.queue || refinementQueue?.refinementQueue || [];
    console.log(`🔧 [PENDING_REFINEMENTS_FIX] Queue contents:`, queue);
    console.log(`🔧 [PENDING_REFINEMENTS_FIX] Queue length:`, queue.length);
    
    if (Array.isArray(queue)) {
      queue.forEach((item: any) => {
        console.log(`🔧 [PENDING_REFINEMENTS_FIX] Processing queue item:`, item);
        
        // Check different possible property names for the Pokemon ID
        const pokemonId = item.targetPokemonId || item.primaryPokemonId || item.pokemonId;
        
        if (pokemonId) {
          console.log(`🔧 [PENDING_REFINEMENTS_FIX] Adding Pokemon ${pokemonId} to pending set`);
          pending.add(pokemonId);
        } else {
          console.log(`🔧 [PENDING_REFINEMENTS_FIX] No Pokemon ID found in item:`, Object.keys(item));
        }
      });
    }
    
    console.log(`🔧 [PENDING_REFINEMENTS_FIX] Final pending refinements:`, Array.from(pending));
    return pending;
  }, [refinementQueue?.queue, refinementQueue?.refinementQueue, refinementQueue?.refinementBattleCount]);

  const refinementBattleCount = refinementQueue?.queue?.length || refinementQueue?.refinementQueue?.length || refinementQueue?.refinementBattleCount || 0;

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
    console.log(`🚀🚀🚀 [START_NEW_BATTLE_TRACE] startNewBattleWrapper called`);
    console.log(`🚀🚀🚀 [START_NEW_BATTLE_TRACE] Timestamp: ${new Date().toISOString()}`);
    console.log(`🚀🚀🚀 [START_NEW_BATTLE_TRACE] Call stack:`, new Error().stack?.split('\n').slice(1, 5));
    console.log(`🚀🚀🚀 [START_NEW_BATTLE_TRACE] battleType: ${battleType}`);
    
    const result = startNewBattle(battleType);
    
    console.log(`🚀🚀🚀 [START_NEW_BATTLE_TRACE] Result:`, result?.map(p => `${p.name}(${p.id})`).join(' vs ') || 'null');
    console.log(`🚀🚀🚀 [START_NEW_BATTLE_TRACE] Result length: ${result?.length || 0}`);
    
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
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ===== MANUAL REORDER STARTED =====`);
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] Timestamp: ${new Date().toISOString()}`);
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] draggedPokemonId: ${draggedPokemonId} (type: ${typeof draggedPokemonId})`);
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] sourceIndex: ${sourceIndex} (type: ${typeof sourceIndex})`);
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] destinationIndex: ${destinationIndex} (type: ${typeof destinationIndex})`);
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] finalRankings length: ${finalRankings?.length || 0}`);
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] Call stack:`, new Error().stack?.split('\n').slice(1, 5));
    
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] RefinementQueue validation:`);
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] - refinementQueue exists: ${!!refinementQueue}`);
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] - refinementQueue type: ${typeof refinementQueue}`);
    
    if (refinementQueue) {
      console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] - refinementQueue keys:`, Object.keys(refinementQueue));
      console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] - addValidationBattle exists: ${!!refinementQueue.addValidationBattle}`);
      console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] - addValidationBattle type: ${typeof refinementQueue.addValidationBattle}`);
      console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] - current queue size: ${refinementQueue.refinementBattleCount || 0}`);
      console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] - current queue contents:`, refinementQueue.queue || refinementQueue.refinementQueue || []);
    }
    
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] Pokemon lookup:`);
    const draggedPokemon = finalRankings.find(p => p.id === draggedPokemonId);
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] - draggedPokemon found: ${!!draggedPokemon}`);
    
    if (draggedPokemon) {
      console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] - draggedPokemon details:`, {
        id: draggedPokemon.id,
        name: draggedPokemon.name,
        score: draggedPokemon.score
      });
    } else {
      console.error(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ❌ Pokemon ${draggedPokemonId} not found in finalRankings`);
      console.error(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] Available rankings (first 20):`, finalRankings.slice(0, 20).map(p => ({ id: p.id, name: p.name })));
      
      // Try to find with string conversion
      const draggedPokemonString = finalRankings.find(p => String(p.id) === String(draggedPokemonId));
      console.error(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] String conversion search result:`, !!draggedPokemonString);
      
      if (draggedPokemonString) {
        console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ✅ Found via string conversion - using this Pokemon`);
        
        if (refinementQueue && typeof refinementQueue.addValidationBattle === 'function') {
          console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ✅ About to call addValidationBattle...`);
          
          try {
            console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] 🚀 CALLING addValidationBattle(${draggedPokemonString.id}, "${draggedPokemonString.name}", ${sourceIndex}, ${destinationIndex})`);
            refinementQueue.addValidationBattle(draggedPokemonString.id, draggedPokemonString.name, sourceIndex, destinationIndex);
            console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ✅ addValidationBattle completed successfully`);
            
            // Force UI update
            setTimeout(() => {
              console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] 🔄 FORCING UI UPDATE for pending refinements`);
              
              const updateEvent = new CustomEvent('refinement-queue-updated', {
                detail: { 
                  pokemonId: draggedPokemonString.id,
                  pokemonName: draggedPokemonString.name,
                  queueSize: refinementQueue.refinementBattleCount || 0
                }
              });
              document.dispatchEvent(updateEvent);
              
              console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ✅ UI update event dispatched`);
            }, 100);
            
          } catch (error) {
            console.error(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ❌ Error calling addValidationBattle:`, error);
            return;
          }
        } else {
          console.error(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ❌ addValidationBattle is not available`);
          return;
        }
        
        toast.info(`Validation queued for ${draggedPokemonString.name}`, {
          description: `Position will be tested in upcoming battles`
        });

        console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] 🚀 DISPATCHING FORCE-NEXT-BATTLE EVENT`);
        const forceNextBattleEvent = new CustomEvent('force-next-battle', {
          detail: { 
            pokemonId: draggedPokemonString.id,
            pokemonName: draggedPokemonString.name,
            source: 'manual-reorder'
          }
        });
        
        document.dispatchEvent(forceNextBattleEvent);
        console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ✅ force-next-battle event dispatched`);
        
        console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ===== MANUAL REORDER COMPLETED (STRING CONVERSION) =====`);
        return;
      }
      
      console.error(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ❌ Could not find Pokemon even with string conversion - aborting`);
      return;
    }

    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] Calling addValidationBattle with found Pokemon`);
    if (refinementQueue && typeof refinementQueue.addValidationBattle === 'function') {
      console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ✅ About to call addValidationBattle...`);
      
      try {
        console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] 🚀 CALLING addValidationBattle(${draggedPokemonId}, "${draggedPokemon.name}", ${sourceIndex}, ${destinationIndex})`);
        refinementQueue.addValidationBattle(draggedPokemonId, draggedPokemon.name, sourceIndex, destinationIndex);
        console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ✅ addValidationBattle completed successfully`);
        
        // Force UI update
        setTimeout(() => {
          console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] 🔄 FORCING UI UPDATE for pending refinements`);
          
          const updateEvent = new CustomEvent('refinement-queue-updated', {
            detail: { 
              pokemonId: draggedPokemonId,
              pokemonName: draggedPokemon.name,
              queueSize: refinementQueue.refinementBattleCount || 0
            }
          });
          document.dispatchEvent(updateEvent);
          
          console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ✅ UI update event dispatched`);
        }, 100);
        
      } catch (error) {
        console.error(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ❌ Error calling addValidationBattle:`, error);
        return;
      }
    } else {
      console.error(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ❌ addValidationBattle is not available`);
      return;
    }
    
    toast.info(`Validation queued for ${draggedPokemon.name}`, {
      description: `Position will be tested in upcoming battles`
    });

    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] 🚀 DISPATCHING FORCE-NEXT-BATTLE EVENT`);
    const forceNextBattleEvent = new CustomEvent('force-next-battle', {
      detail: { 
        pokemonId: draggedPokemonId,
        pokemonName: draggedPokemon.name,
        source: 'manual-reorder'
      }
    });
    
    document.dispatchEvent(forceNextBattleEvent);
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ✅ force-next-battle event dispatched`);
    
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ===== MANUAL REORDER COMPLETED =====`);
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
