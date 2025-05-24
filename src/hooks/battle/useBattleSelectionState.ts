
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
  
  // FIXED: Enhanced forceNextBattle with better milestone handling
  const forceNextBattle = useCallback(() => {
    console.log("🔄 useBattleSelectionState: Force starting next battle");
    
    try {
      // CRITICAL FIX: Dispatch milestone dismissal event with immediate state clear
      const dismissMilestoneEvent = new CustomEvent('milestone-dismissed', {
        detail: { forced: true, source: 'forceNextBattle', immediate: true }
      });
      document.dispatchEvent(dismissMilestoneEvent);
      
      // Clear any existing selections immediately
      setSelectedPokemon([]);
      
      // Start new battle with a small delay to ensure state is cleared
      setTimeout(() => {
        const result = startNewBattle(currentBattleType);
        
        if (result && result.length > 0) {
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
      }, 100);
    } catch (error) {
      console.error("Error in forceNextBattle:", error);
      toast.error("Failed to start battle", {
        description: "An unexpected error occurred."
      });
      return [];
    }
  }, [currentBattleType, startNewBattle, setSelectedPokemon]);

  // FIXED: Improved milestone dismissal event handling
  useEffect(() => {
    const handleMilestoneDismissed = (event: CustomEvent) => {
      console.log("📣 useBattleSelectionState: Received milestone-dismissed event", event.detail);
      
      // Reset any relevant state when milestone is dismissed
      setSelectedPokemon([]);
      
      // If this was an immediate dismissal, trigger a new battle
      if (event.detail?.immediate) {
        console.log("🚀 useBattleSelectionState: Immediate milestone dismissal - starting new battle");
        setTimeout(() => {
          startNewBattle(currentBattleType);
        }, 50);
      }
    };
    
    document.addEventListener('milestone-dismissed', handleMilestoneDismissed as EventListener);
    
    return () => {
      document.removeEventListener('milestone-dismissed', handleMilestoneDismissed as EventListener);
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
