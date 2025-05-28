
import { useMemo, useCallback, useEffect } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { useBattleTypeSelection } from "./useBattleTypeSelection";
import { useBattleStateSelection } from "./useBattleStateSelection";
import { useBattleResults } from "./useBattleResults";
import { useBattleStarterIntegration } from "./useBattleStarterIntegration";
import { useBattleOutcomeProcessor } from "./useBattleOutcomeProcessor";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";
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

  // Get refinement queue directly in this hook
  const refinementQueue = useSharedRefinementQueue();

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

  const { battleStarter, startNewBattle: originalStartNewBattle } = useBattleStarterIntegration(
    allPokemon,
    currentRankings,
    setCurrentBattle,
    setSelectedPokemon
  );

  // Create our own startNewBattle that has direct access to refinement queue
  const startNewBattle = useCallback((battleType: BattleType) => {
    console.log(`🚀 [FIXED_BATTLE_START] Starting battle with refinement queue access`);
    console.log(`🚀 [FIXED_BATTLE_START] Queue size: ${refinementQueue.refinementBattleCount}`);
    console.log(`🚀 [FIXED_BATTLE_START] Has battles: ${refinementQueue.hasRefinementBattles}`);
    
    // Check for refinement battles first
    const nextRefinement = refinementQueue.getNextRefinementBattle();
    if (nextRefinement) {
      console.log(`🚀 [FIXED_BATTLE_START] Found refinement battle: ${nextRefinement.primaryPokemonId} vs ${nextRefinement.opponentPokemonId}`);
      
      const primary = allPokemon.find(p => p.id === nextRefinement.primaryPokemonId);
      const opponent = allPokemon.find(p => p.id === nextRefinement.opponentPokemonId);
      
      if (primary && opponent) {
        const refinementBattle = [primary, opponent];
        console.log(`🚀 [FIXED_BATTLE_START] Creating refinement battle: ${primary.name} vs ${opponent.name}`);
        
        setCurrentBattle(refinementBattle);
        setSelectedPokemon([]);
        
        return refinementBattle;
      } else {
        console.error(`🚀 [FIXED_BATTLE_START] Missing Pokemon, popping invalid battle`);
        refinementQueue.popRefinementBattle();
        return startNewBattle(battleType); // Retry
      }
    }
    
    // No refinement battles, use original function
    console.log(`🚀 [FIXED_BATTLE_START] No refinement battles, using original startNewBattle`);
    return originalStartNewBattle(battleType);
  }, [refinementQueue, allPokemon, setCurrentBattle, setSelectedPokemon, originalStartNewBattle]);

  const { processBattleResult } = useBattleOutcomeProcessor(
    setBattleResults,
    setBattlesCompleted,
    battleStarter
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

  // Handle events with the fixed startNewBattle function
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
      
      // Call our fixed startNewBattle function immediately
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
