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

  const { battleStarter, startNewBattle } = useBattleStarterIntegration(
    allPokemon,
    currentRankings,
    setCurrentBattle,
    setSelectedPokemon
  );

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
      console.log("🚀 useBattleSelectionState: Received force-next-battle event", event.detail);
      console.log("🚀 [EVENT_TRACE] Event timestamp:", event.detail?.timestamp);
      console.log("🚀 [EVENT_TRACE] Event queue size:", event.detail?.queueSize);
      console.log("🚀 [EVENT_TRACE] Event Pokemon:", event.detail?.pokemonName);
      
      // Clear selections immediately
      setSelectedPokemon([]);
      
      // CRITICAL FIX: No delay - start battle immediately to ensure refinement queue is used
      console.log("🚀 [EVENT_TRACE] Starting battle IMMEDIATELY - no delay for refinement queue");
      
      const result = startNewBattle(currentBattleType);
      
      if (result && result.length > 0) {
        console.log("✅ handleForceNextBattle: Successfully started refinement battle with", 
          result.map(p => p.name).join(', '));
        
        // Check if the result includes the dragged Pokemon
        const draggedPokemonId = event.detail?.pokemonId;
        if (draggedPokemonId && result.some(p => p.id === draggedPokemonId)) {
          console.log("🎯 [SUCCESS] Dragged Pokemon IS in the new battle!");
          toast.success("Validation battle started", {
            description: `Testing position for ${event.detail?.pokemonName || 'dragged Pokemon'}`
          });
        } else {
          console.log("❌ [FAILURE] Dragged Pokemon is NOT in the new battle");
          console.log("❌ [FAILURE] Expected Pokemon ID:", draggedPokemonId);
          console.log("❌ [FAILURE] Battle Pokemon IDs:", result.map(p => p.id));
          toast.warning("Regular battle started", {
            description: "Refinement queue may be empty or not working"
          });
        }
      } else {
        console.error("❌ handleForceNextBattle: Failed to start refinement battle");
        toast.error("Failed to start battle", {
          description: "Could not create validation battle"
        });
      }
    };
    
    document.addEventListener('milestone-dismissed', handleMilestoneDismissed as EventListener);
    document.addEventListener('force-next-battle', handleForceNextBattle as EventListener);
    
    return () => {
      document.removeEventListener('milestone-dismissed', handleMilestoneDismissed as EventListener);
      document.removeEventListener('force-next-battle', handleForceNextBattle as EventListener);
    };
  }, [setSelectedPokemon, startNewBattle, currentBattleType]);

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
