import { useState, useCallback, useEffect, useRef } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { useBattleStarterIntegration } from "./useBattleStarterIntegration";
import { useBattleStarterEvents } from "./useBattleStarterEvents";
import { useTrueSkillRanking } from "./useTrueSkillRanking";
import { useBattleHistory } from "./useBattleHistory";
import { useBattleMilestones } from "./useBattleMilestones";
import { useBattleSuggestion } from "./useBattleSuggestion";
import { useBattleTierFreezing } from "./useBattleTierFreezing";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";
import { useTrueSkillStore } from "@/stores/trueskillStore";

export const useBattleStateCoreRefactored = (
  allPokemon: Pokemon[],
  initialBattleType: BattleType,
  selectedGeneration: number
) => {
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);
  const [battleType, setBattleType] = useState<BattleType>(initialBattleType);
  const [battleHistory, setBattleHistory] = useState<{ battle: Pokemon[], selected: number[] }[]>([]);
  const [showingMilestone, setShowingMilestone] = useState(false);
  const [activeTier, setActiveTier] = useState<TopNOption>("All");
  const initialBattleStartedRef = useRef(false);
  const autoTriggerDisabledRef = useRef(false);
  const initializationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initializationCompleteRef = useRef(false);
  const [rankingGenerated, setRankingGenerated] = useState(false);
  const [finalRankings, setFinalRankings] = useState<RankedPokemon[]>([]);
  const [currentRankings, setCurrentRankings] = useState<RankedPokemon[]>([]);

  // CRITICAL FIX: Get battle count from TrueSkill store as single source of truth
  const { totalBattles, addBattle, clearAllBattles } = useTrueSkillStore();

  // Refinement queue
  const refinementQueue = useSharedRefinementQueue();

  // Tier freezing
  const { isPokemonFrozenForTier } = useBattleTierFreezing(activeTier);

  // TrueSkill ranking
  const {
    rankedPokemon,
    isLoading: isRankingLoading,
    generateInitialRankings,
    updateRankings,
    resetRankings
  } = useTrueSkillRanking(allPokemon, selectedGeneration);

  // Battle history
  const { addBattleToHistory, clearBattleHistory } = useBattleHistory();

  // Battle milestones
  const { milestones, getMilestoneProgress, getNextMilestone, resetMilestoneInProgress } = useBattleMilestones(totalBattles);

  // Battle suggestion
  const { suggestRanking, removeSuggestion, markSuggestionUsed } = useBattleSuggestion(
    rankedPokemon,
    currentBattle,
    selectedPokemon,
    battleType
  );

  // On mount, generate initial rankings
  useEffect(() => {
    console.log(`⚡ [RANKING_INIT] Generating initial rankings with ${allPokemon.length} Pokemon`);
    generateInitialRankings(allPokemon);
  }, [allPokemon, generateInitialRankings]);

  // Update current rankings when ranked Pokemon change
  useEffect(() => {
    console.log(`📈 [RANKING_UPDATE] Updating current rankings with ${rankedPokemon.length} Pokemon`);
    setCurrentRankings(rankedPokemon);
    setFinalRankings(rankedPokemon);
  }, [rankedPokemon]);

  // CRITICAL FIX: Get the actual callback function instead of using refs
  const battleIntegration = useBattleStarterIntegration(
    allPokemon,
    currentRankings,
    setCurrentBattle,
    setSelectedPokemon,
    markSuggestionUsed,
    currentBattle
  );

  // CRITICAL FIX: Pass the actual function instead of using refs
  useBattleStarterEvents(
    battleIntegration.filteredPokemon,
    currentBattle,
    initialBattleStartedRef,
    autoTriggerDisabledRef,
    battleIntegration.startNewBattle, // CRITICAL FIX: Pass actual function
    initializationTimerRef,
    initializationCompleteRef,
    setCurrentBattle,
    setSelectedPokemon
  );

  // Handle Pokemon selection
  const handlePokemonSelect = useCallback((id: number) => {
    console.log(`✅ [SELECTION_DEBUG] Selecting Pokemon ID: ${id}`);
    setSelectedPokemon(prevSelected => {
      if (prevSelected.includes(id)) {
        console.log(`✅ [SELECTION_DEBUG] Deselecting Pokemon ID: ${id}`);
        return prevSelected.filter(pokemonId => pokemonId !== id);
      } else {
        console.log(`✅ [SELECTION_DEBUG] Adding Pokemon ID: ${id}`);
        return [...prevSelected, id];
      }
    });
  }, []);

  // Handle triplet selection completion
  const handleTripletSelectionComplete = useCallback(() => {
    if (battleType === "triplets" && selectedPokemon.length === 2) {
      console.log(`✅✅✅ [TRIPLET_DEBUG] All selections complete, submitting`);
      handleSubmit();
    }
  }, [battleType, selectedPokemon, handleSubmit]);

  // Handle battle submission
  const handleSubmit = useCallback(() => {
    if (!currentBattle || currentBattle.length === 0) {
      console.error("Cannot submit battle - no current battle");
      return;
    }

    if (selectedPokemon.length === 0) {
      console.error("Cannot submit battle - no Pokemon selected");
      return;
    }

    if (battleType === "pairs" && selectedPokemon.length > 1) {
      console.error("Too many Pokemon selected for pairs battle");
      return;
    }

    if (battleType === "triplets" && selectedPokemon.length !== 2) {
      console.error("Incorrect number of Pokemon selected for triplets battle");
      return;
    }

    // Determine winner and loser
    const winner = currentBattle.find(pokemon => selectedPokemon.includes(pokemon.id));
    const loser = currentBattle.find(pokemon => !selectedPokemon.includes(pokemon.id));

    if (!winner || !loser) {
      console.error("Could not determine winner and loser");
      return;
    }

    // Freeze Pokemon if necessary
    if (isPokemonFrozenForTier && isPokemonFrozenForTier(winner.id, activeTier)) {
      console.warn(`Pokemon ID ${winner.id} is frozen for tier ${activeTier} - skipping TrueSkill update`);
    } else {
      console.log(`🏆 [BATTLE_RESULT] ${winner.name} (winner) vs ${loser.name} (loser)`);
      battleIntegration?.battleStarter?.trackLowerTierLoss(loser.id);
      updateRankings(winner, loser);
    }

    // Add battle to history
    addBattleToHistory(currentBattle, selectedPokemon);

    // Clear selections
    setSelectedPokemon([]);

    // Start new battle
    battleIntegration.startNewBattle(battleType);

    // Increment battle count
    addBattle({
      battleType,
      pokemon1Id: currentBattle[0].id,
      pokemon2Id: currentBattle[1].id,
      winnerId: winner.id,
      loserId: loser.id,
      selectedPokemonIds: selectedPokemon
    });
  }, [
    currentBattle,
    selectedPokemon,
    battleType,
    updateRankings,
    addBattleToHistory,
    battleIntegration,
    isPokemonFrozenForTier,
    activeTier,
    addBattle
  ]);

  // Handle manual reorder
  const handleManualReorder = useCallback((reorderedRankings: RankedPokemon[]) => {
    console.log(`✍️ [MANUAL_REORDER] Applying manual reorder to rankings`);
    setFinalRankings(reorderedRankings);
    setCurrentRankings(reorderedRankings);
  }, []);

  // Handle "go back"
  const goBack = useCallback(() => {
    if (battleHistory.length > 0) {
      console.log(`⏪ [HISTORY_DEBUG] Going back to previous battle`);
      const lastBattle = battleHistory[battleHistory.length - 1];
      setCurrentBattle(lastBattle.battle);
      setSelectedPokemon(lastBattle.selected);

      // Remove last battle from history
      setBattleHistory(prevHistory => prevHistory.slice(0, -1));
    }
  }, [battleHistory]);

  // Handle continue battles
  const handleContinueBattles = useCallback(() => {
    console.log(`▶️ [CONTINUE_DEBUG] Continuing battles`);
    battleIntegration?.startNewBattle(battleType);
    setSelectedPokemon([]);
  }, [battleType, battleIntegration]);

  const performFullBattleReset = useCallback(() => {
    console.warn("🚨 [RESET_DEBUG] Performing full battle reset");

    // Reset state
    setCurrentBattle([]);
    setSelectedPokemon([]);
    setBattleHistory([]);
    setShowingMilestone(false);
    setRankingGenerated(false);
    setFinalRankings([]);
    setCurrentRankings([]);

    // Reset TrueSkill rankings
    resetRankings();

    // Clear battle history
    clearBattleHistory();

    // Clear all battles
    clearAllBattles();

    // Reset refinement queue
    refinementQueue?.clearRefinementQueue();

    // Reset suggestion priority
    battleIntegration?.battleStarter?.resetSuggestionPriority();

    // Trigger event for listeners
    const resetEvent = new CustomEvent('battle-system-reset');
    document.dispatchEvent(resetEvent);
  }, [
    resetRankings,
    clearBattleHistory,
    clearAllBattles,
    refinementQueue,
    battleIntegration
  ]);

  // Handle save rankings
  const handleSaveRankings = useCallback(() => {
    console.log("💾 [SAVE_DEBUG] Saving final rankings");
    setFinalRankings(currentRankings);
    setRankingGenerated(true);
  }, [currentRankings]);

  const validatedBattle = currentBattle || [];

  const isAnyProcessing = isRankingLoading;

  return {
    currentBattle,
    selectedPokemon,
    battleType,
    battleHistory,
    showingMilestone,
    activeTier,
    finalRankings,
    rankingGenerated,
    isAnyProcessing,
    milestones,
    validatedBattle,
    rankedPokemon,
    currentRankings,
    initialBattleStartedRef,
    autoTriggerDisabledRef,
    initializationTimerRef,
    initializationCompleteRef,
    suggestRanking,
    removeSuggestion,
    resetMilestoneInProgress,
    getMilestoneProgress,
    getNextMilestone,
    handlePokemonSelect,
    handleTripletSelectionComplete,
    handleSubmit,
    handleManualReorder,
    goBack,
    handleContinueBattles,
    performFullBattleReset,
    handleSaveRankings,
    setCurrentBattle,
    setSelectedPokemon,
    setBattleType,
    setBattleHistory,
    setShowingMilestone,
    setActiveTier,
    setSelectedGeneration
  };
};
