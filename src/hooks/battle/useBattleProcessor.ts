
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

  // Listen for emergency reset events
  useEffect(() => {
    const handleEmergencyReset = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log("🚨 Battle processor detected emergency reset event", customEvent.detail?.source || "unknown source");
      
      // Reset flags to allow clean processing of next battle
      milestoneInProgressRef.current = false;
      setIsProcessingResult(false);
      isEmergencyResetPending.current = true;
      
      // Log the current state for debugging
      console.log("🚨 Emergency Reset: Current state -", { 
        battlesCompleted,
        battleResultsCount: battleResults.length,
        milestonesExist: Array.isArray(milestones) && milestones.length > 0,
        fullReset: customEvent.detail?.fullReset
      });

      // Set battlesCompleted to 0 directly if this is a full reset 
      if (customEvent.detail?.fullReset) {
        console.log("🚨 Full reset detected, explicitly setting battlesCompleted to 0");
        setBattlesCompleted(0);
        
        // Add a localStorage reset for battle count
        localStorage.removeItem('pokemon-battle-count');
        console.log("✅ Explicitly removed pokemon-battle-count from localStorage");
        
        // Reset adjacent state also
        setBattleResults([]);
        console.log("✅ Reset battle results to empty array");
      }
      
      // This is intentionally separate from main state resets to ensure the processor
      // is in a clean state ready for the next battle
    };
    
    document.addEventListener('force-emergency-reset', handleEmergencyReset);
    return () => {
      document.removeEventListener('force-emergency-reset', handleEmergencyReset);
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
      console.log("🚨 setupNextBattle callback executing with battleType:", battleType);
      console.log("🚨 Current allPokemon length:", allPokemon.length);
      
      // If emergency reset was triggered, ensur battle count is reset
      if (isEmergencyResetPending.current) {
        console.log("🚨 Emergency reset was pending, resetting battle count");
        setBattlesCompleted(0);
        isEmergencyResetPending.current = false;
      }
      
      const shuffled = [...allPokemon].sort(() => Math.random() - 0.5);
      const battleSize = battleType === "triplets" ? 3 : 2;
      const newBattle = shuffled.slice(0, battleSize);
      
      console.log(`🚨 Creating new ${battleType} battle with ${newBattle.length} Pokémon:`, 
        newBattle.map(p => `${p.name} (${p.id})`));
        
      setCurrentBattle(newBattle);
      console.log("📌 Updating current battle state explicitly with IDs:", newBattle.map(p => p.id));

      setSelectedPokemon([]);
      console.log("🚨 Reset selectedPokemon to empty array");
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
    console.log("🚨 processBattle called with:", {
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
      console.log("⏳ Skipping processBattle (already in progress)");
      return;
    }

    setIsProcessingResult(true);
    try {
      // Check if we need to reset battle count due to emergency reset
      if (isEmergencyResetPending.current) {
        console.log("🚨 Emergency reset was pending, resetting battle count");
        setBattlesCompleted(0);
        isEmergencyResetPending.current = false;
      }
      
      console.log("🚨 Processing battle result with selectedPokemonIds:", selectedPokemonIds);
      const newResults = processResult(selectedPokemonIds, battleType, currentBattlePokemon);

      if (!newResults || newResults.length === 0) {
        console.warn("⚠️ No battle results returned");
        setIsProcessingResult(false);
        return;
      }

      const updatedResults = [...battleResults, ...newResults];
      console.log(`🚨 Updating battle results: ${battleResults.length} + ${newResults.length} = ${updatedResults.length}`);
      setBattleResults(updatedResults);
      setSelectedPokemon([]);

      if (markSuggestionUsed) {
        currentBattlePokemon.forEach(p => {
          const ranked = p as RankedPokemon;
          if (ranked.suggestedAdjustment && !ranked.suggestedAdjustment.used) {
            markSuggestionUsed(ranked);
          }
        });
      }

      const milestone = incrementBattlesCompleted(updatedResults);
      console.log("🚨 Battle completed, new count:", battlesCompleted + 1, "Milestone hit:", milestone);
      
      if (typeof milestone === "number") {
        milestoneInProgressRef.current = true;
        saveRankings(allPokemon, currentSelectedGeneration, "battle");
        generateRankings(updatedResults);
        console.log("🚨 Milestone reached, rankings saved and generated");
      }

      await setupNextBattle(battleType);
      setIsProcessingResult(false);
    } catch (e) {
      console.error("🔥 Error in processBattle:", e);
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
    setBattleResults
  ]);

  const resetMilestoneInProgress = useCallback(() => {
    console.log("🚨 resetMilestoneInProgress called, setting milestoneInProgressRef to false");
    milestoneInProgressRef.current = false;
  }, []);

  return {
    processBattleResult: processBattle,
    isProcessingResult,
    resetMilestoneInProgress
  };
};
