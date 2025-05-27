
import { useState, useCallback, useRef, useEffect } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { useBattleProgression } from "./useBattleProgression";
import { useNextBattleHandler } from "./useNextBattleHandler";
import { useBattleResultProcessor } from "./useBattleResultProcessor";
import { saveRankings } from "@/services/pokemon";

export const useBattleProcessor = (
  battleResults: SingleBattle[],
  setBattleResults: React.Dispatch<React.SetStateAction<SingleBattle[]>>,
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  allPokemon: Pokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  milestones: number[],
  generateRankings: (results: SingleBattle[]) => void,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>,
  activeTier?: TopNOption,
  freezePokemonForTier?: (pokemonId: number, tier: TopNOption) => void,
  battleStarter?: any,
  markSuggestionUsed?: (pokemon: RankedPokemon, fullyUsed?: boolean) => void,
  isResettingRef?: React.MutableRefObject<boolean>,
  integratedStartNewBattle?: (battleType: BattleType) => Pokemon[]
) => {
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const milestoneInProgressRef = useRef(false);

  console.log(`🔄 [PROCESSOR_FIX] useBattleProcessor isProcessingResult:`, {
    isProcessingResult,
    timestamp: new Date().toISOString()
  });

  // LOADING STATE DEBUG: Log isProcessingResult changes
  useEffect(() => {
    console.log(`🔄 [LOADING DEBUG] useBattleProcessor isProcessingResult changed:`, {
      isProcessingResult,
      timestamp: new Date().toISOString()
    });
  }, [isProcessingResult]);

  const { 
    incrementBattlesCompleted,
    resetMilestone: resetBattleProgressionMilestoneTracking
  } = useBattleProgression(
    battlesCompleted,
    setBattlesCompleted,
    setShowingMilestone,
    milestones,
    generateRankings
  );

  // CRITICAL FIX: Use the outcome processor with setCurrentBattle for immediate battle generation
  const { setupNextBattle } = useNextBattleHandler(
    allPokemon,
    (battleType: BattleType) => {
      console.log(`📝 [PROCESSOR_FIX] setupNextBattle called - delegating to outcome processor`);
      // Don't generate here, let outcome processor handle it
      return [];
    },
    setSelectedPokemon
  );

  const { processResult } = useBattleResultProcessor(
    battleResults,
    setBattleResults,
    activeTier,
    freezePokemonForTier,
    battleStarter?.trackLowerTierLoss
  );

  const processBattle = useCallback(async (
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    currentSelectedGeneration: number = 0
  ) => {
    const timestamp = new Date().toISOString();
    console.log(`📝 [${timestamp}] [PROCESSOR_FIX] PROCESS BATTLE: Called`);
    
    if (isProcessingResult || milestoneInProgressRef.current) {
      console.log(`📝 [${timestamp}] [PROCESSOR_FIX] PROCESS BATTLE: Already processing, skipping`);
      return;
    }

    console.log(`📝 [${timestamp}] [PROCESSOR_FIX] PROCESS BATTLE: Setting isProcessingResult = true`);
    setIsProcessingResult(true);
    
    try {
      // Check if we need to reset battle count due to reset
      if (isResettingRef?.current) {
        console.log(`📝 [${timestamp}] PROCESS BATTLE: Reset flag TRUE. Current battlesCompleted prop = ${battlesCompleted}. Forcing base for increment to 0 by calling setBattlesCompleted(0).`);
        setBattlesCompleted(0);
        console.log(`📝 [${timestamp}] PROCESS BATTLE: ✅ battlesCompleted state updated to 0 via prop setter.`);
        
        isResettingRef.current = false; // Clear the reset flag after using it
        console.log(`📝 [${timestamp}] PROCESS BATTLE: Cleared isResettingRef.current to false AFTER using it.`);
      }
      
      console.log(`📝 [${timestamp}] PROCESS BATTLE: Processing battle result with selectedPokemonIds: ${selectedPokemonIds.join(', ')}`);
      const newResults = processResult(selectedPokemonIds, battleType, currentBattlePokemon);

      if (!newResults || newResults.length === 0) {
        console.warn(`📝 [${timestamp}] PROCESS BATTLE: No battle results returned`);
        console.log(`📝 [${timestamp}] [PROCESSOR_FIX] PROCESS BATTLE: Setting isProcessingResult = false (no results)`);
        setIsProcessingResult(false);
        return;
      }

      const updatedResults = [...battleResults, ...newResults];
      setBattleResults(updatedResults);
      setSelectedPokemon([]);

      // Before the markSuggestionUsed check, add new debug logs
      console.log(`[DEBUG useBattleProcessor] Timestamp: ${timestamp}. Iterating currentBattlePokemon for markSuggestionUsed.`);
      currentBattlePokemon.forEach(p => {
        const ranked = p as RankedPokemon;
        const suggestionDetails = ranked.suggestedAdjustment 
          ? `Suggestion Exists - Used: ${ranked.suggestedAdjustment.used}, Direction: ${ranked.suggestedAdjustment.direction}` 
          : 'No Suggestion Present';
        console.log(`[DEBUG useBattleProcessor] Pokemon: ${ranked.name} (${ranked.id}). ${suggestionDetails}`);
      });

      if (markSuggestionUsed) {
        currentBattlePokemon.forEach(p => {
          const ranked = p as RankedPokemon;
          if (ranked.suggestedAdjustment && !ranked.suggestedAdjustment.used) {
            markSuggestionUsed(ranked, false); // Pass false to indicate not fully used yet
            console.log(`📝 [${timestamp}] PROCESS BATTLE: Notified markSuggestionUsed for ${ranked.name} (${ranked.id}). fullyUsed=false`);
          }
        });
      }

      // Fixed type handling for milestone - can be a number or null
      const milestone = incrementBattlesCompleted(updatedResults);
      console.log(`📝 [${timestamp}] PROCESS BATTLE: Battle completed, new count: ${battlesCompleted + 1}, Milestone hit: ${milestone !== null ? milestone : "none"}`);
      
      // Check if milestone is not null - that means a milestone was hit
      if (milestone !== null) {
        milestoneInProgressRef.current = true;
        console.log(`📝 [${timestamp}] PROCESS BATTLE: Set milestoneInProgressRef = true for milestone ${milestone}`);
        
        // CRITICAL FIX: Disable auto-triggers immediately when milestone is hit
        const disableAutoTriggerEvent = new CustomEvent('milestone-blocking', {
          detail: { 
            milestone, 
            timestamp: Date.now(),
            source: 'useBattleProcessor'
          }
        });
        document.dispatchEvent(disableAutoTriggerEvent);
        console.log(`📝 [${timestamp}] PROCESS BATTLE: Dispatched milestone-blocking event`);
        
        saveRankings(allPokemon, currentSelectedGeneration, "battle");
        console.log(`📝 [${timestamp}] PROCESS BATTLE: Rankings saved for generation ${currentSelectedGeneration}`);
        
        generateRankings(updatedResults);
        console.log(`📝 [${timestamp}] PROCESS BATTLE: Rankings generated`);
      } else {
        // CRITICAL FIX: If no milestone, immediately generate new battle
        console.log(`📝 [${timestamp}] [BATTLE_OUTCOME_FIX] No milestone hit - generating new battle immediately`);
        if (battleStarter && integratedStartNewBattle) {
          const newBattle = integratedStartNewBattle(battleType);
          if (newBattle && newBattle.length > 0) {
            console.log(`✅ [BATTLE_OUTCOME_FIX] New battle generated after processing: ${newBattle.map(p => p.name)}`);
            setCurrentBattle(newBattle);
          } else {
            console.error(`❌ [BATTLE_OUTCOME_FIX] Failed to generate new battle after processing`);
          }
        }
      }

      // CRITICAL: Clear processing state SYNCHRONOUSLY
      console.log(`📝 [${timestamp}] [PROCESSOR_FIX] Clearing isProcessingResult`);
      setIsProcessingResult(false);
      
    } catch (e) {
      console.error(`📝 [${timestamp}] PROCESS BATTLE: Error:`, e);
      console.log(`📝 [${timestamp}] [PROCESSOR_FIX] Setting isProcessingResult = false (after error)`);
      setIsProcessingResult(false);
    }
  }, [
    battleResults,
    processResult,
    incrementBattlesCompleted,
    generateRankings,
    setSelectedPokemon,
    allPokemon,
    markSuggestionUsed,
    battlesCompleted,
    isProcessingResult,
    setBattlesCompleted,
    setBattleResults,
    isResettingRef,
    battleStarter,
    integratedStartNewBattle,
    setCurrentBattle
  ]);

  const resetMilestoneInProgress = useCallback(() => {
    const timestamp = new Date().toISOString();
    console.log(`📝 [${timestamp}] [PROCESSOR_FIX] MILESTONE RESET: Setting milestoneInProgressRef to false`);
    milestoneInProgressRef.current = false;
  }, []);

  return {
    processBattleResult: processBattle,
    isProcessingResult,
    resetMilestoneInProgress,
    resetBattleProgressionMilestoneTracking,
    setBattlesCompleted,
    setBattleResults
  };
};
