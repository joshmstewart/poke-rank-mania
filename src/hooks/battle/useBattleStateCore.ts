
import { useState, useCallback, useEffect } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { useBattleStarterIntegration } from "@/hooks/battle/useBattleStarterIntegration";
import { useBattleProcessor } from "@/hooks/battle/useBattleProcessor";
import { useProgressState } from "@/hooks/battle/useProgressState";
import { useCompletionTracker } from "@/hooks/battle/useCompletionTracker";
import { BattleType } from "./types";
import { useRankings } from "./useRankings";
import { useBattleInteractions } from "./useBattleInteractions"; 

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

  const { battleStarter, startNewBattle } = useBattleStarterIntegration(
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
  
  // This effect ensures that when we resume battling after a milestone,
  // suggestions from localStorage are reloaded and applied
useEffect(() => {
  if (!showingMilestone && needsToReloadSuggestions) {
    console.log("🔄 Explicitly reloading suggestions after milestone");
    const loadedSuggestions = loadSavedSuggestions();
    console.log(`📥 Reloaded suggestions after milestone: ${loadedSuggestions.size}`);
    
    generateRankings(battleResults);
    setNeedsToReloadSuggestions(false);
  }
}, [showingMilestone, needsToReloadSuggestions, loadSavedSuggestions, generateRankings, battleResults]);

  // Added effect to ensure suggestions are loaded at mount time
  useEffect(() => {
    console.log("⚠️ useBattleStateCore: Initial component mount - ensuring suggestions are loaded");
    
    // Make sure we have suggestions loaded even if we don't have rankings yet
    if (finalRankings.length === 0) {
      console.log("🔄 useBattleStateCore: No rankings yet, forcing suggestion load");
      // Force an immediate generation of rankings from current battle results
      // This will trigger the suggestions to be loaded
      if (battleResults.length > 0) {
        console.log(`🔄 useBattleStateCore: Generating initial rankings from ${battleResults.length} battles`);
        generateRankings(battleResults);
      } else {
        // If no battle results yet, at least load the suggestions
        loadSavedSuggestions();
      }
    }
  }, [finalRankings.length, battleResults, generateRankings, loadSavedSuggestions]);
  
  // Debug effect to log every time finalRankings changes
  useEffect(() => {
    console.log(`🔄 useBattleStateCore: finalRankings updated (${finalRankings.length} Pokémon)`);
    
    // Count and log suggestions in finalRankings
    const suggestedCount = finalRankings.filter(p => p.suggestedAdjustment).length;
    const unusedCount = finalRankings.filter(p => 
      p.suggestedAdjustment && !p.suggestedAdjustment.used
    ).length;
    
    console.log(
      `🔍 useBattleStateCore: ${suggestedCount} suggestions (${unusedCount} unused) in finalRankings`
    );
  }, [finalRankings]);

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
    clearAllSuggestions
  };
};
