import { useState, useCallback, useEffect } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { useBattleStarterIntegration } from "@/hooks/battle/useBattleStarterIntegration";
import { useBattleProcessor } from "@/hooks/battle/useBattleProcessor";
import { useProgressState } from "@/hooks/battle/useProgressState";
import { useCompletionTracker } from "@/hooks/battle/useCompletionTracker";
import { BattleType } from "./types";
import { useRankings } from "./useRankings";
import { useBattleInteractions } from "./useBattleInteractions"; 
import { toast } from "@/hooks/use-toast";

export const useBattleStateCore = (
  allPokemon: Pokemon[],
  initialBattleType: BattleType,
  initialSelectedGeneration: number
) => {
  // Keep track if we need to reload suggestions after milestone
  const [needsToReloadSuggestions, setNeedsToReloadSuggestions] = useState(false);
  
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [battleResults, setBattleResults] = useState<any[]>([]);
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [battleHistory, setBattleHistory] = useState<{ battle: Pokemon[], selected: number[] }[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState(initialSelectedGeneration);
  const initialBattleTypeStored = localStorage.getItem('pokemon-ranker-battle-type') as BattleType || initialBattleType;
  const [battleType, setBattleType] = useState<BattleType>(initialBattleTypeStored);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);

  const {
    showingMilestone,
    setShowingMilestone,
    completionPercentage,
    setCompletionPercentage,
    rankingGenerated,
    setRankingGenerated,
    fullRankingMode,
    milestones
  } = useProgressState();

  const {
    finalRankings,
    confidenceScores,
    generateRankings,
    handleSaveRankings,
    activeTier,
    setActiveTier,
    freezePokemonForTier,
    isPokemonFrozenForTier,
    allRankedPokemon,
    suggestRanking,
    removeSuggestion,
    markSuggestionUsed,
    clearAllSuggestions,
    findNextSuggestion,
    loadSavedSuggestions
  } = useRankings(allPokemon);

  const {
    resetMilestones,
    resetMilestoneRankings,
    calculateCompletionPercentage,
    getSnapshotForMilestone,
    milestoneRankings,
    hitMilestones,
  } = useCompletionTracker(
    battleResults,
    setRankingGenerated,
    setCompletionPercentage,
    showingMilestone,
    setShowingMilestone,
    generateRankings,
    allPokemon
  );

  // Filter Pokemon by generation if a specific generation is selected
  const filteredPokemon = allPokemon.filter(pokemon => {
    // We need to check if the pokemon has a generation property and use it
    if (selectedGeneration === 0) {
      return true;
    }
    return pokemon.hasOwnProperty('generation') && (pokemon as any).generation === selectedGeneration;
  });

  const { 
    battleStarter, 
    startNewBattle,
    resetSuggestionPriority 
  } = useBattleStarterIntegration(
    filteredPokemon, 
    finalRankings, 
    setCurrentBattle,
    setSelectedPokemon
  );

  const { 
    processBattleResult,
    isProcessingResult, 
    resetMilestoneInProgress 
  } = useBattleProcessor(
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    filteredPokemon,
    setCurrentBattle,
    setShowingMilestone,
    milestones,
    generateRankings,
    setSelectedPokemon,
    activeTier,
    freezePokemonForTier,
    battleStarter,
    markSuggestionUsed
  );
  
  // VERIFICATION: Check if suggestions exist in localStorage on mount
  useEffect(() => {
    const preferredImageType = localStorage.getItem('preferredImageType');
    console.log("🎯 Loaded initial image preference:", preferredImageType);

    if (!preferredImageType) {
      localStorage.setItem('preferredImageType', 'official');
      console.log("✅ Set default image preference to 'official'");
    }

    const savedSuggestions = localStorage.getItem('pokemon-active-suggestions');
    console.log("🔍 MOUNT VERIFICATION: Suggestions in localStorage:", savedSuggestions ? "YES" : "NO");
    if (savedSuggestions) {
      try {
        const parsed = JSON.parse(savedSuggestions);
        const count = Object.keys(parsed).length;
        console.log(`🔢 Found ${count} suggestions in localStorage`);
      } catch (e) {
        console.error("Error parsing saved suggestions:", e);
      }
    }
  }, []);
  
  // Add explicit event to signal that we should prioritize suggestions
  const triggerSuggestionPrioritization = useCallback(() => {
    window.dispatchEvent(new CustomEvent("prioritizeSuggestions"));
  }, []);

  // This effect ensures that when we show a milestone, we mark that we need to reload suggestions
  // when we continue battling
  useEffect(() => {
    if (showingMilestone) {
      console.log("🔄 useBattleStateCore: Milestone shown, marking to reload suggestions when continuing");
      setNeedsToReloadSuggestions(true);
      
      // VERIFICATION: Check if current battle contains any suggestions
      const hasSuggestion = currentBattle.some(p => (p as RankedPokemon).suggestedAdjustment);
      console.log(`🔍 Before milestone: Found ${hasSuggestion ? "some" : "0"} suggestions in current battle`);
      
      // We should also reload suggestions here to ensure they're properly loaded into finalRankings
      setTimeout(() => {
        console.log("🧮 Generating milestone rankings (preserving suggestions)");
        const loadedSuggestions = loadSavedSuggestions();
        console.log(`⭐ useBattleStateCore: Milestone shown: Loaded ${loadedSuggestions.size} suggestions`);
      }, 0);
    }
  }, [showingMilestone, loadSavedSuggestions]);
  
  // Enhanced effect to reload suggestions and trigger prioritization after milestone
  useEffect(() => {
    if (!showingMilestone && needsToReloadSuggestions) {
      console.log("🔄 Explicitly reloading suggestions after milestone");
      const loadedSuggestions = loadSavedSuggestions();
      console.log(`📥 Reloaded suggestions after milestone: ${loadedSuggestions.size}`);

      generateRankings(battleResults);
      setNeedsToReloadSuggestions(false);
      
      // Explicitly reset suggestion priority to ensure the next battles prioritize suggestions
      if (resetSuggestionPriority) {
        console.log("🚨 Explicitly resetting suggestion priority tracking");
        resetSuggestionPriority();
      }
      
      // Trigger suggestion prioritization when we continue after milestone
      triggerSuggestionPrioritization();
      
      // Immediate feedback on what will happen next
      if (loadedSuggestions.size > 0) {
        toast({
          title: "Prioritizing suggestions",
          description: `Will focus on ${loadedSuggestions.size} suggested Pokemon in upcoming battles`,
          duration: 4000
        });
      }
    }
  }, [
    showingMilestone, 
    needsToReloadSuggestions, 
    loadSavedSuggestions, 
    generateRankings, 
    battleResults, 
    triggerSuggestionPrioritization,
    resetSuggestionPriority
  ]);

  // Enhanced milestone ended handler with stronger suggestion focus
  const handleMilestoneEnded = useCallback(() => {
    console.log("🏁 Milestone ended event detected, reloading suggestions");
    const loadedSuggestions = loadSavedSuggestions();
    console.log(`📥 Reloaded ${loadedSuggestions.size} suggestions after milestone ended event`);
    
    // Also regenerate rankings to ensure they include suggestions
    generateRankings(battleResults);
    
    // Explicitly trigger suggestion prioritization
    triggerSuggestionPrioritization();
    
    // Restart battles with currently loaded suggestions
    if (loadedSuggestions.size > 0) {
      console.log("🔄 Actively prioritizing suggestion battles after milestone");
    }
  }, [loadSavedSuggestions, generateRankings, battleResults, triggerSuggestionPrioritization]);

  // Add event listener for milestone ended to reload suggestions
  useEffect(() => {
    window.addEventListener("milestoneEnded", handleMilestoneEnded);
    return () => window.removeEventListener("milestoneEnded", handleMilestoneEnded);
  }, [handleMilestoneEnded]);

  const {
    handlePokemonSelect,
    handleGoBack: goBackHelper,
    isProcessing
  } = useBattleInteractions(
    currentBattle,
    setCurrentBattle,
    selectedPokemon,
    setSelectedPokemon,
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    battleHistory,
    setBattleHistory,
    (battleType: BattleType, currentBattle: Pokemon[]) => {
      if (battleType === "triplets") {
        processBattleResult(selectedPokemon, currentBattle, battleType, selectedGeneration);
      }
    },
    () => {
      console.log("Going back in battle navigation");
      // Any additional back logic here
    },
    battleType,
    processBattleResult
  );

  useEffect(() => {
    console.log("🔍 Battle Results Updated:", battleResults.length, "battles");
  }, [battleResults]);

  useEffect(() => {
    console.log("🔍 Final Rankings Updated:", finalRankings.length, "Pokémon ranked");
  }, [finalRankings]);

  // Fixed handleContinueBattles implementation to not reference undefined processorRefs
  const handleContinueBattles = useCallback(() => {
    setShowingMilestone(false);
    
    if (resetMilestoneInProgress) {
      resetMilestoneInProgress();
    }
    
    // When continuing battles, explicitly prioritize any suggestions
    if (resetSuggestionPriority) {
      console.log("🚨 Resetting suggestion priority in handleContinueBattles");
      resetSuggestionPriority();
    }
    
    window.dispatchEvent(new Event("milestoneEnded"));
    
    // Start a new battle with current battle type
    startNewBattle(battleType);
  }, [
    setShowingMilestone, 
    resetMilestoneInProgress, 
    resetSuggestionPriority,
    battleType, 
    startNewBattle
  ]);

  return {
    currentBattle,
    battleResults,
    battlesCompleted,
    showingMilestone,
    setShowingMilestone,
    selectedGeneration,
    setSelectedGeneration,
    completionPercentage,
    rankingGenerated,
    selectedPokemon,
    battleType,
    setBattleType,
    finalRankings,
    confidenceScores,
    battleHistory,
    activeTier,
    setActiveTier,
    handlePokemonSelect,
    handleTripletSelectionComplete: () => {
      if (battleType === "triplets") {
        processBattleResult(selectedPokemon, currentBattle, battleType, selectedGeneration);
      }
    },
    handleSelection: (id: number) => {
      handlePokemonSelect(id);
    },
    goBack: () => {
      goBackHelper();
    },
    isProcessingResult,
    startNewBattle,
    milestones,
    resetMilestones,
    calculateCompletionPercentage,
    getSnapshotForMilestone,
    generateRankings,
    handleSaveRankings,
    processorRefs: { resetMilestoneInProgress },
    freezePokemonForTier,
    isPokemonFrozenForTier,
    suggestRanking,
    removeSuggestion,
    clearAllSuggestions,
    handleContinueBattles
  };
};
