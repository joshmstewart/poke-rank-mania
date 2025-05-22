
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
  markSuggestionUsed?: (pokemon: RankedPokemon) => void
) => {
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const milestoneInProgressRef = useRef(false);
  const isEmergencyResetPending = useRef(false);

  // Listen for emergency reset events with enhanced logging
  useEffect(() => {
    const handleEmergencyReset = (event: Event) => {
      const customEvent = event as CustomEvent;
      const timestamp = customEvent.detail?.timestamp || new Date().toISOString();
      
      console.log(`📝 [${timestamp}] RESET HANDLER: Emergency reset event received in useBattleProcessor`);
      console.log(`📝 [${timestamp}] RESET HANDLER: Source = ${customEvent.detail?.source || "unknown source"}`);
      console.log(`📝 [${timestamp}] RESET HANDLER: Current battlesCompleted = ${battlesCompleted}`);
      console.log(`📝 [${timestamp}] RESET HANDLER: Current battleResults.length = ${battleResults.length}`);
      console.log(`📝 [${timestamp}] RESET HANDLER: Full reset = ${customEvent.detail?.fullReset ? "YES" : "NO"}`);
      
      // Reset flags to allow clean processing of next battle
      milestoneInProgressRef.current = false;
      console.log(`📝 [${timestamp}] RESET HANDLER: Reset milestoneInProgressRef = false`);
      
      setIsProcessingResult(false);
      console.log(`📝 [${timestamp}] RESET HANDLER: Reset isProcessingResult = false`);
      
      isEmergencyResetPending.current = true;
      console.log(`📝 [${timestamp}] RESET HANDLER: Set isEmergencyResetPending = true`);

      // Set battlesCompleted to 0 directly if this is a full reset 
      if (customEvent.detail?.fullReset) {
        console.log(`📝 [${timestamp}] RESET HANDLER: Full reset detected, explicitly setting battlesCompleted to 0`);
        setBattlesCompleted(0);
        
        // Add a localStorage reset for battle count
        const beforeValue = localStorage.getItem('pokemon-battle-count');
        localStorage.removeItem('pokemon-battle-count');
        console.log(`📝 [${timestamp}] RESET HANDLER: Removed pokemon-battle-count from localStorage: was ${beforeValue ? `"${beforeValue}"` : "empty"}`);
        
        // Reset adjacent state also
        setBattleResults([]);
        console.log(`📝 [${timestamp}] RESET HANDLER: Reset battle results to empty array`);
      }
      
      console.log(`📝 [${timestamp}] RESET HANDLER: Emergency reset handling complete in useBattleProcessor`);
    };
    
    document.addEventListener('force-emergency-reset', handleEmergencyReset);
    console.log("🔧 useBattleProcessor: Emergency reset event listener registered");
    
    return () => {
      document.removeEventListener('force-emergency-reset', handleEmergencyReset);
      console.log("🧹 useBattleProcessor: Emergency reset event listener removed");
    };
  }, [battlesCompleted, battleResults, setBattlesCompleted, setBattleResults]);

  const { incrementBattlesCompleted } = useBattleProgression(
    battlesCompleted,
    setBattlesCompleted,
    setShowingMilestone,
    milestones,
    generateRankings
  );

  const { setupNextBattle } = useNextBattleHandler(
    allPokemon,
    (battleType: BattleType) => {
      const timestamp = new Date().toISOString();
      console.log(`📝 [${timestamp}] NEXT BATTLE: setupNextBattle callback executing with battleType: ${battleType}`);
      console.log(`📝 [${timestamp}] NEXT BATTLE: Current allPokemon length: ${allPokemon.length}`);
      console.log(`📝 [${timestamp}] NEXT BATTLE: isEmergencyResetPending = ${isEmergencyResetPending.current}`);
      
      // If emergency reset was triggered, ensure battle count is reset
      if (isEmergencyResetPending.current) {
        console.log(`📝 [${timestamp}] NEXT BATTLE: Emergency reset was pending, resetting battle count to 0`);
        setBattlesCompleted(0);
        isEmergencyResetPending.current = false;
        console.log(`📝 [${timestamp}] NEXT BATTLE: Reset isEmergencyResetPending = false`);
      }
      
      const shuffled = [...allPokemon].sort(() => Math.random() - 0.5);
      const battleSize = battleType === "triplets" ? 3 : 2;
      const newBattle = shuffled.slice(0, battleSize);
      
      console.log(`📝 [${timestamp}] NEXT BATTLE: Creating new ${battleType} battle with ${newBattle.length} Pokémon: ${newBattle.map(p => `${p.name} (${p.id})`).join(', ')}`);
        
      setCurrentBattle(newBattle);
      console.log(`📝 [${timestamp}] NEXT BATTLE: Updated current battle state explicitly with IDs: ${newBattle.map(p => p.id).join(', ')}`);

      setSelectedPokemon([]);
      console.log(`📝 [${timestamp}] NEXT BATTLE: Reset selectedPokemon to empty array`);
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
    console.log(`📝 [${timestamp}] PROCESS BATTLE: Called with:`, {
      selectedPokemonIds,
      currentBattleIds: currentBattlePokemon.map(p => p.id),
      battleType,
      currentSelectedGeneration,
      isProcessing: isProcessingResult,
      milestoneInProgress: milestoneInProgressRef.current,
      battlesCompleted: battlesCompleted,
      isEmergencyResetPending: isEmergencyResetPending.current
    });
    
    if (isProcessingResult || milestoneInProgressRef.current) {
      console.log(`📝 [${timestamp}] PROCESS BATTLE: Skipping processBattle (already in progress)`);
      return;
    }

    setIsProcessingResult(true);
    console.log(`📝 [${timestamp}] PROCESS BATTLE: Set isProcessingResult = true`);
    
    try {
      // Check if we need to reset battle count due to emergency reset
      if (isEmergencyResetPending.current) {
        console.log(`📝 [${timestamp}] PROCESS BATTLE: Emergency reset was pending, resetting battle count to 0`);
        setBattlesCompleted(0);
        isEmergencyResetPending.current = false;
        console.log(`📝 [${timestamp}] PROCESS BATTLE: Reset isEmergencyResetPending = false`);
      }
      
      console.log(`📝 [${timestamp}] PROCESS BATTLE: Processing battle result with selectedPokemonIds: ${selectedPokemonIds.join(', ')}`);
      const newResults = processResult(selectedPokemonIds, battleType, currentBattlePokemon);

      if (!newResults || newResults.length === 0) {
        console.warn(`📝 [${timestamp}] PROCESS BATTLE: No battle results returned`);
        setIsProcessingResult(false);
        return;
      }

      const updatedResults = [...battleResults, ...newResults];
      console.log(`📝 [${timestamp}] PROCESS BATTLE: Updating battle results: ${battleResults.length} + ${newResults.length} = ${updatedResults.length}`);
      setBattleResults(updatedResults);
      
      setSelectedPokemon([]);
      console.log(`📝 [${timestamp}] PROCESS BATTLE: Reset selectedPokemon to empty array`);

      if (markSuggestionUsed) {
        currentBattlePokemon.forEach(p => {
          const ranked = p as RankedPokemon;
          if (ranked.suggestedAdjustment && !ranked.suggestedAdjustment.used) {
            markSuggestionUsed(ranked);
            console.log(`📝 [${timestamp}] PROCESS BATTLE: Marked suggestion used for ${ranked.name} (${ranked.id})`);
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
      console.log(`📝 [${timestamp}] PROCESS BATTLE: Next battle setup completed`);
      
      setIsProcessingResult(false);
      console.log(`📝 [${timestamp}] PROCESS BATTLE: Set isProcessingResult = false`);
    } catch (e) {
      console.error(`📝 [${timestamp}] PROCESS BATTLE: Error:`, e);
      setIsProcessingResult(false);
      console.log(`📝 [${timestamp}] PROCESS BATTLE: Set isProcessingResult = false (after error)`);
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
    setBattleResults
  ]);

  const resetMilestoneInProgress = useCallback(() => {
    const timestamp = new Date().toISOString();
    console.log(`📝 [${timestamp}] MILESTONE RESET: Setting milestoneInProgressRef to false`);
    milestoneInProgressRef.current = false;
    console.log(`📝 [${timestamp}] MILESTONE RESET: Completed`);
  }, []);

  return {
    processBattleResult: processBattle,
    isProcessingResult,
    resetMilestoneInProgress
  };
};
