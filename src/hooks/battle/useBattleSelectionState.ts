
import { useMemo, useCallback, useEffect } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { useBattleTypeSelection } from "./useBattleTypeSelection";
import { useBattleStateSelection } from "./useBattleStateSelection";
import { useBattleResults } from "./useBattleResults";
import { useBattleStarterIntegration } from "./useBattleStarterIntegration";
import { useBattleOutcomeProcessor } from "./useBattleOutcomeProcessor";
import { toast } from "sonner";

export const useBattleSelectionState = () => {
  const { currentBattleType, setCurrentBattleType } = useBattleTypeSelection();

  const {
    currentBattle,
    setCurrentBattle,
    allPokemon,
    setAllPokemon,
    selectedPokemon,
    setSelectedPokemon,
    battlesCompleted,
    setBattlesCompleted,
    battleHistory,
    setBattleHistory
  } = useBattleStateSelection();

  const {
    battleResults,
    setBattleResults,
    getCurrentRankings
  } = useBattleResults();

  // Ensure currentRankings always has full RankedPokemon structure
  const currentRankings = useMemo<RankedPokemon[]>(() => {
    if (Array.isArray(battleResults) && battleResults.length > 0) {
      return getCurrentRankings();
    }

    // Fallback: convert raw Pokémon into dummy RankedPokemon
    return (allPokemon || []).map(pokemon => ({
      ...pokemon,
      score: 0,
      count: 0,
      confidence: 0
    }));
  }, [battleResults, allPokemon, getCurrentRankings]);

  const { battleStarter, startNewBattle, refinementQueue } = useBattleStarterIntegration(
    allPokemon,
    currentRankings,
    setCurrentBattle,
    setSelectedPokemon
  );

  // CRITICAL DEBUG: Verify the startNewBattle function has refinement queue access
  console.log("🚨 [CRITICAL_CONNECTION_DEBUG] useBattleSelectionState hook initialization:");
  console.log("🚨 [CRITICAL_CONNECTION_DEBUG] startNewBattle function exists:", typeof startNewBattle === 'function');
  console.log("🚨 [CRITICAL_CONNECTION_DEBUG] refinementQueue exists:", !!refinementQueue);
  console.log("🚨 [CRITICAL_CONNECTION_DEBUG] refinementQueue methods:", refinementQueue ? Object.keys(refinementQueue) : 'none');

  const { processBattleResult } = useBattleOutcomeProcessor(
    setBattleResults,
    setBattlesCompleted,
    battleStarter
  );
  
  // CRITICAL FIX: Enhanced forceNextBattle with proper sequencing to prevent flashing
  const forceNextBattle = useCallback(() => {
    console.log("🔄 useBattleSelectionState: Force starting next battle");
    
    try {
      // CRITICAL FIX: Don't clear current battle immediately - wait for new one to be ready
      const dismissMilestoneEvent = new CustomEvent('milestone-dismissed', {
        detail: { forced: true, source: 'forceNextBattle', immediate: false }
      });
      document.dispatchEvent(dismissMilestoneEvent);
      
      // Clear selections but keep current battle visible
      setSelectedPokemon([]);
      
      // CRITICAL FIX: Delay battle generation to prevent flashing
      setTimeout(() => {
        const result = startNewBattle(currentBattleType);
        
        if (result && result.length > 0) {
          // Only update battle after new one is ready
          toast.success("Starting new battle", {
            description: `New ${currentBattleType} battle ready`
          });
          
          console.log("✅ forceNextBattle: Successfully started new battle with", 
            result.map(p => p.name).join(', '));
          
          return result;
        } else {
          toast.error("Error starting battle", {
            description: "Could not create new battle. Please try again."
          });
          console.error("❌ forceNextBattle: Failed to start new battle - empty result");
          return [];
        }
      }, 500); // CRITICAL FIX: Increased delay to prevent flashing
    } catch (error) {
      console.error("Error in forceNextBattle:", error);
      toast.error("Failed to start battle", {
        description: "An unexpected error occurred."
      });
      return [];
    }
  }, [currentBattleType, startNewBattle, setSelectedPokemon]);

  // CRITICAL FIX: Enhanced milestone dismissal event handling with immediate battle start for force events
  useEffect(() => {
    const handleMilestoneDismissed = (event: CustomEvent) => {
      console.log("📣 useBattleSelectionState: Received milestone-dismissed event", event.detail);
      
      // Reset selections immediately
      setSelectedPokemon([]);
      
      // CRITICAL FIX: Only start new battle if it's NOT an immediate dismissal to prevent flashing
      if (event.detail?.immediate === false) {
        console.log("🚀 useBattleSelectionState: Non-immediate dismissal - waiting before starting new battle");
        // The new battle will be started by forceNextBattle's setTimeout
      } else if (event.detail?.immediate === true) {
        console.log("🚀 useBattleSelectionState: Immediate dismissal - starting new battle with delay");
        setTimeout(() => {
          startNewBattle(currentBattleType);
        }, 300); // Shorter delay for immediate dismissals
      }
    };
    
    const handleForceNextBattle = (event: CustomEvent) => {
      console.log("🚀 [BATTLE_SELECTION_STATE_TRACE] ===== FORCE NEXT BATTLE EVENT RECEIVED =====");
      console.log("🚀 [BATTLE_SELECTION_STATE_TRACE] Event timestamp:", event.detail?.timestamp);
      console.log("🚀 [BATTLE_SELECTION_STATE_TRACE] Event queue size:", event.detail?.queueSize);
      console.log("🚀 [BATTLE_SELECTION_STATE_TRACE] Event Pokemon:", event.detail?.pokemonName);
      console.log("🚀 [BATTLE_SELECTION_STATE_TRACE] Event Pokemon ID:", event.detail?.pokemonId);
      console.log("🚀 [BATTLE_SELECTION_STATE_TRACE] startNewBattle function exists:", typeof startNewBattle);
      console.log("🚀 [BATTLE_SELECTION_STATE_TRACE] Current battle type:", currentBattleType);
      
      // CRITICAL DEBUG: Test if our startNewBattle has refinement queue access
      console.log("🚨 [CRITICAL_CONNECTION_DEBUG] ===== TESTING startNewBattle FUNCTION =====");
      console.log("🚨 [CRITICAL_CONNECTION_DEBUG] Function source preview:", startNewBattle.toString().slice(0, 300));
      console.log("🚨 [CRITICAL_CONNECTION_DEBUG] refinementQueue object:", refinementQueue);
      console.log("🚨 [CRITICAL_CONNECTION_DEBUG] refinementQueue.refinementBattleCount:", refinementQueue?.refinementBattleCount);
      console.log("🚨 [CRITICAL_CONNECTION_DEBUG] refinementQueue.hasRefinementBattles:", refinementQueue?.hasRefinementBattles);
      console.log("🚨 [CRITICAL_CONNECTION_DEBUG] refinementQueue.getNextRefinementBattle:", typeof refinementQueue?.getNextRefinementBattle);
      
      // Clear selections immediately
      setSelectedPokemon([]);
      
      // CRITICAL TRACE: Log exactly which battle generation function we're calling
      console.log("🚀 [BATTLE_SELECTION_STATE_TRACE] About to call startNewBattle - this should use refinement queue");
      console.log("🚀 [BATTLE_SELECTION_STATE_TRACE] startNewBattle source:", startNewBattle.toString().slice(0, 200));
      
      // CRITICAL FIX: Call startNewBattle directly and immediately to ensure refinement queue is checked
      console.log("🚀 [BATTLE_SELECTION_STATE_TRACE] CALLING startNewBattle IMMEDIATELY");
      
      // CRITICAL DEBUG: Check refinement queue state right before the call
      console.log("🚨 [PRE_CALL_DEBUG] Refinement queue state before startNewBattle:");
      console.log("🚨 [PRE_CALL_DEBUG] - Queue size:", refinementQueue?.refinementBattleCount || 'undefined');
      console.log("🚨 [PRE_CALL_DEBUG] - Has battles:", refinementQueue?.hasRefinementBattles || 'undefined');
      console.log("🚨 [PRE_CALL_DEBUG] - Next battle:", refinementQueue?.getNextRefinementBattle ? refinementQueue.getNextRefinementBattle() : 'method missing');
      
      const result = startNewBattle(currentBattleType);
      
      console.log("🚀 [BATTLE_SELECTION_STATE_TRACE] startNewBattle returned:", result ? result.map(p => `${p.name}(${p.id})`).join(', ') : 'null/empty');
      
      if (result && result.length > 0) {
        console.log("✅ [BATTLE_SELECTION_STATE_TRACE] Successfully started refinement battle with", 
          result.map(p => p.name).join(', '));
        
        // Check if the result includes the dragged Pokemon
        const draggedPokemonId = event.detail?.pokemonId;
        if (draggedPokemonId && result.some(p => p.id === draggedPokemonId)) {
          console.log("🎯 [BATTLE_SELECTION_STATE_TRACE] SUCCESS! Dragged Pokemon IS in the new battle!");
          toast.success("Validation battle started", {
            description: `Testing position for ${event.detail?.pokemonName || 'dragged Pokemon'}`
          });
        } else {
          console.log("❌ [BATTLE_SELECTION_STATE_TRACE] FAILURE! Dragged Pokemon is NOT in the new battle");
          console.log("❌ [BATTLE_SELECTION_STATE_TRACE] Expected Pokemon ID:", draggedPokemonId);
          console.log("❌ [BATTLE_SELECTION_STATE_TRACE] Battle Pokemon IDs:", result.map(p => p.id));
          console.log("❌ [BATTLE_SELECTION_STATE_TRACE] This means refinement queue is not being used properly");
          toast.warning("Regular battle started", {
            description: "Refinement queue may be empty or not working"
          });
        }
      } else {
        console.error("❌ [BATTLE_SELECTION_STATE_TRACE] Failed to start refinement battle - empty result");
        toast.error("Failed to start battle", {
          description: "Could not create validation battle"
        });
      }
      
      console.log("🚀 [BATTLE_SELECTION_STATE_TRACE] ===== FORCE NEXT BATTLE EVENT COMPLETE =====");
    };
    
    document.addEventListener('milestone-dismissed', handleMilestoneDismissed as EventListener);
    document.addEventListener('force-next-battle', handleForceNextBattle as EventListener);
    
    return () => {
      document.removeEventListener('milestone-dismissed', handleMilestoneDismissed as EventListener);
      document.removeEventListener('force-next-battle', handleForceNextBattle as EventListener);
    };
  }, [setSelectedPokemon, startNewBattle, currentBattleType, refinementQueue]);

  return {
    currentBattle,
    setCurrentBattle,
    allPokemon,
    setAllPokemon,
    selectedPokemon,
    setSelectedPokemon,
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    battleHistory,
    setBattleHistory,
    startNewBattle,
    currentBattleType,
    processBattleResult,
    forceNextBattle
  };
};
