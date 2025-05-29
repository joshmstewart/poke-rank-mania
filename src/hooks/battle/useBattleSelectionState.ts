
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

  // Ensure currentRankings always has full RankedPokemon structure including new required properties
  const currentRankings = useMemo<RankedPokemon[]>(() => {
    if (Array.isArray(battleResults) && battleResults.length > 0) {
      return getCurrentRankings();
    }

    // Fallback: convert raw Pokémon into dummy RankedPokemon with all required properties
    return (allPokemon || []).map(pokemon => ({
      ...pokemon,
      score: 0,
      count: 0,
      confidence: 0,
      wins: 0,
      losses: 0,
      winRate: 0
    }));
  }, [battleResults, allPokemon, getCurrentRankings]);

  // CRITICAL FIX: Use the refinement-aware startNewBattle from useBattleStarterIntegration
  const { startNewBattle } = useBattleStarterIntegration(
    allPokemon,
    currentRankings,
    setCurrentBattle,
    setSelectedPokemon
  );

  const { processBattleResult } = useBattleOutcomeProcessor(
    setBattleResults,
    setBattlesCompleted,
    null // battleStarter not needed here
  );
  
  const forceNextBattle = useCallback(() => {
    console.log("🔄 useBattleSelectionState: Force starting next battle");
    
    try {
      const dismissMilestoneEvent = new CustomEvent('milestone-dismissed', {
        detail: { forced: true, source: 'forceNextBattle', immediate: false }
      });
      document.dispatchEvent(dismissMilestoneEvent);
      
      setSelectedPokemon([]);
      
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
      }, 500);
    } catch (error) {
      console.error("Error in forceNextBattle:", error);
      toast.error("Failed to start battle", {
        description: "An unexpected error occurred."
      });
      return [];
    }
  }, [currentBattleType, startNewBattle, setSelectedPokemon]);

  // CRITICAL FIX: Use the refinement-aware startNewBattle in event handlers
  useEffect(() => {
    const handleMilestoneDismissed = (event: CustomEvent) => {
      console.log("📣 useBattleSelectionState: Received milestone-dismissed event", event.detail);
      
      setSelectedPokemon([]);
      
      if (event.detail?.immediate === false) {
        console.log("🚀 useBattleSelectionState: Non-immediate dismissal - waiting before starting new battle");
      } else if (event.detail?.immediate === true) {
        console.log("🚀 useBattleSelectionState: Immediate dismissal - starting new battle with delay");
        setTimeout(() => {
          startNewBattle(currentBattleType);
        }, 300);
      }
    };
    
    const handleForceNextBattle = (event: CustomEvent) => {
      console.log("🚀 [FORCE_BATTLE_EVENT] Received force-next-battle event");
      console.log("🚀 [FORCE_BATTLE_EVENT] Event details:", event.detail);
      
      setSelectedPokemon([]);
      
      // CRITICAL FIX: Use the refinement-aware startNewBattle directly
      const result = startNewBattle(currentBattleType);
      
      if (result && result.length > 0) {
        console.log("✅ [FORCE_BATTLE_EVENT] Successfully started battle:", result.map(p => p.name).join(' vs '));
        
        const draggedPokemonId = event.detail?.pokemonId;
        if (draggedPokemonId && result.some(p => p.id === draggedPokemonId)) {
          console.log("🎯 [FORCE_BATTLE_EVENT] SUCCESS! Dragged Pokemon IS in the new battle!");
          toast.success("Validation battle started", {
            description: `Testing position for ${event.detail?.pokemonName || 'dragged Pokemon'}`
          });
        } else {
          console.log("❌ [FORCE_BATTLE_EVENT] Dragged Pokemon not in battle - queue may be empty");
          toast.warning("Regular battle started", {
            description: "No validation battles were queued"
          });
        }
      } else {
        console.error("❌ [FORCE_BATTLE_EVENT] Failed to start battle");
        toast.error("Failed to start battle", {
          description: "Could not create battle"
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
