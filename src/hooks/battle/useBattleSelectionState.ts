
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

  // FIXED: Create wrapper function for markSuggestionUsed to match expected signature
  const markSuggestionUsedWrapper = useCallback((pokemonId: number) => {
    const pokemon = currentRankings.find(p => p.id === pokemonId);
    if (pokemon) {
      console.log(`🔧 [WRAPPER] Found Pokemon ${pokemon.name} for ID ${pokemonId}, marking as used`);
    } else {
      console.warn(`🔧 [WRAPPER] Could not find Pokemon for ID ${pokemonId}`);
    }
  }, [currentRankings]);

  // FIXED: Provide all required parameters for useBattleStarterIntegration
  const initialBattleStartedRef = { current: false };
  const { startNewBattle } = useBattleStarterIntegration(
    allPokemon,
    currentRankings,
    setCurrentBattle,
    setSelectedPokemon,
    markSuggestionUsedWrapper,
    currentBattle,
    initialBattleStartedRef
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
      console.log("🚀🚀🚀 [FORCE_BATTLE_EVENT_TRACE] Received force-next-battle event");
      console.log("🚀🚀🚀 [FORCE_BATTLE_EVENT_TRACE] Event details:", event.detail);
      console.log("🚀🚀🚀 [FORCE_BATTLE_EVENT_TRACE] Timestamp: ${new Date().toISOString()}");
      console.log("🚀🚀🚀 [FORCE_BATTLE_EVENT_TRACE] currentBattleType: ${currentBattleType}");
      
      setSelectedPokemon([]);
      
      // CRITICAL TRACE: Call the startNewBattle and trace everything
      console.log("🚀🚀🚀 [FORCE_BATTLE_EVENT_TRACE] About to call startNewBattle...");
      const result = startNewBattle(currentBattleType);
      
      console.log("🚀🚀🚀 [FORCE_BATTLE_EVENT_TRACE] startNewBattle result:", result);
      console.log("🚀🚀🚀 [FORCE_BATTLE_EVENT_TRACE] Result type:", typeof result);
      console.log("🚀🚀🚀 [FORCE_BATTLE_EVENT_TRACE] Result length:", result?.length || 0);
      
      if (result && result.length > 0) {
        console.log("🚀🚀🚀 [FORCE_BATTLE_EVENT_TRACE] ✅ Successfully started battle:", result.map(p => `${p.name}(${p.id})`).join(' vs '));
        
        const draggedPokemonId = event.detail?.pokemonId;
        console.log("🚀🚀🚀 [FORCE_BATTLE_EVENT_TRACE] Checking if dragged Pokemon ${draggedPokemonId} is in battle...");
        
        if (draggedPokemonId && result.some(p => p.id === draggedPokemonId)) {
          console.log("🚀🚀🚀 [FORCE_BATTLE_EVENT_TRACE] 🎯 SUCCESS! Dragged Pokemon IS in the new battle!");
          toast.success("Validation battle started", {
            description: `Testing position for ${event.detail?.pokemonName || 'dragged Pokemon'}`
          });
        } else {
          console.log("🚀🚀🚀 [FORCE_BATTLE_EVENT_TRACE] ❌ Dragged Pokemon not in battle - queue may be empty");
          console.log("🚀🚀🚀 [FORCE_BATTLE_EVENT_TRACE] Battle Pokemon IDs:", result.map(p => p.id));
          console.log("🚀🚀🚀 [FORCE_BATTLE_EVENT_TRACE] Expected Pokemon ID:", draggedPokemonId);
          toast.warning("Regular battle started", {
            description: "No validation battles were queued"
          });
        }
      } else {
        console.error("🚀🚀🚀 [FORCE_BATTLE_EVENT_TRACE] ❌ Failed to start battle - empty/null result");
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
