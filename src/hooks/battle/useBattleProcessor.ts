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
  const processingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  console.log(`🔄 [LOADING DEBUG] useBattleProcessor isProcessingResult:`, {
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

  const { setupNextBattle } = useNextBattleHandler(
    allPokemon,
    integratedStartNewBattle || ((battleType: BattleType) => {
      const timestamp = new Date().toISOString();
      console.log(`📝 [${timestamp}] FALLBACK NEXT BATTLE: setupNextBattle callback executing with battleType: ${battleType}`);
      console.log(`📝 [${timestamp}] FALLBACK NEXT BATTLE: Current allPokemon length: ${allPokemon.length}`);
      console.log(`📝 [${timestamp}] FALLBACK NEXT BATTLE: isResetting = ${isResettingRef?.current}`);
      
      // If reset was triggered, ensure battle count is reset
      if (isResettingRef?.current) {
        console.log(`📝 [${timestamp}] FALLBACK NEXT BATTLE: Reset was active, ensuring battlesCompleted is 0`);
        setBattlesCompleted(0);
        console.log(`📝 [${timestamp}] FALLBACK NEXT BATTLE: ✅ battlesCompleted explicitly reset to 0`);
      }
      
      const shuffled = [...allPokemon].sort(() => Math.random() - 0.5);
      const battleSize = battleType === "triplets" ? 3 : 2;
      const newBattle = shuffled.slice(0, battleSize);
      
      console.log(`📝 [${timestamp}] FALLBACK NEXT BATTLE: Creating new ${battleType} battle with ${newBattle.length} Pokémon: ${newBattle.map(p => `${p.name} (${p.id})`).join(', ')}`);
        
      setCurrentBattle(newBattle);
      console.log(`📝 [${timestamp}] FALLBACK NEXT BATTLE: Updated current battle state explicitly with IDs: ${newBattle.map(p => p.id).join(', ')}`);

      setSelectedPokemon([]);
      console.log(`📝 [${timestamp}] FALLBACK NEXT BATTLE: Reset selectedPokemon to empty array`);
      
      return newBattle;
    }),
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
    console.log(`📝 [${timestamp}] [LOADING DEBUG] PROCESS BATTLE: Called with isProcessingResult=${isProcessingResult}`);
    
    if (isProcessingResult || milestoneInProgressRef.current) {
      console.log(`📝 [${timestamp}] [LOADING DEBUG] PROCESS BATTLE: Skipping (already in progress)`);
      return;
    }

    console.log(`📝 [${timestamp}] [LOADING DEBUG] PROCESS BATTLE: Setting isProcessingResult = true`);
    setIsProcessingResult(true);
    
    // FIXED: Clear any existing timeout
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }
    
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
        console.log(`📝 [${timestamp}] [LOADING DEBUG] PROCESS BATTLE: Setting isProcessingResult = false (no results)`);
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
        
        saveRankings(allPokemon, currentSelectedGeneration, "battle");
        console.log(`📝 [${timestamp}] PROCESS BATTLE: Rankings saved for generation ${currentSelectedGeneration}`);
        
        generateRankings(updatedResults);
        console.log(`📝 [${timestamp}] PROCESS BATTLE: Rankings generated`);
      }

      await setupNextBattle(battleType);
      
      // FIXED: Add delay before clearing processing state to ensure smooth transitions
      processingTimeoutRef.current = setTimeout(() => {
        console.log(`📝 [${timestamp}] [LOADING DEBUG] PROCESS BATTLE: Setting isProcessingResult = false (delayed clear)`);
        setIsProcessingResult(false);
        processingTimeoutRef.current = null;
      }, 500); // Give time for new battle to load
      
    } catch (e) {
      console.error(`📝 [${timestamp}] PROCESS BATTLE: Error:`, e);
      console.log(`📝 [${timestamp}] [LOADING DEBUG] PROCESS BATTLE: Setting isProcessingResult = false (after error)`);
      setIsProcessingResult(false);
    }
  }, [
    battleResults,
    processResult,
    incrementBattlesCompleted,
    generateRankings,
    setupNextBattle,
    setSelectedPokemon,
    allPokemon,
    markSuggestionUsed,
    battlesCompleted,
    isProcessingResult,
    setBattlesCompleted,
    setBattleResults,
    isResettingRef,
    integratedStartNewBattle
  ]);

  const resetMilestoneInProgress = useCallback(() => {
    const timestamp = new Date().toISOString();
    console.log(`📝 [${timestamp}] [LOADING DEBUG] MILESTONE RESET: Setting milestoneInProgressRef to false`);
    milestoneInProgressRef.current = false;
  }, []);

  // FIXED: Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        console.log(`🧹 [LOADING DEBUG] useBattleProcessor: Clearing timeout on cleanup`);
        clearTimeout(processingTimeoutRef.current);
      }
    };
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
