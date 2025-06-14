
import { useState, useEffect, useCallback, useRef } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { useBattleStarterIntegration } from "./useBattleStarterIntegration";
import { useBattleProcessorGeneration } from "./useBattleProcessorGeneration";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";

const BATTLE_MILESTONE_INTERVAL = 25;

export const useBattleStateSimplified = (
  allPokemon: Pokemon[],
  initialBattleType: BattleType,
  selectedGeneration: number
) => {
  console.log(`🚀 [SIMPLIFIED_STATE] Initializing with ${allPokemon.length} Pokemon`);
  
  // Core state
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);
  const [battleType, setBattleType] = useState<BattleType>(initialBattleType);
  const [battleHistory, setBattleHistory] = useState<{ battle: Pokemon[], selected: number[] }[]>([]);
  const [finalRankings, setFinalRankings] = useState<RankedPokemon[]>([]);
  const [showingMilestone, setShowingMilestone] = useState(false);
  const [activeTier, setActiveTier] = useState<string>("all");
  const [milestones] = useState([25, 50, 100, 200, 300, 500, 750, 1000]);
  const [rankingGenerated, setRankingGenerated] = useState(false);
  const [isAnyProcessing, setIsAnyProcessing] = useState(false);
  const [battleResults, setBattleResults] = useState<SingleBattle[]>([]);
  
  // Refs
  const initialBattleStartedRef = useRef(false);
  
  // Store integration - FIXED property names
  const { 
    totalBattles: battlesCompleted,
    getAllRatings,
    updateRating
  } = useTrueSkillStore();
  
  const refinementQueue = useSharedRefinementQueue();
  
  // Battle integration
  const battleStarterIntegration = useBattleStarterIntegration(
    allPokemon,
    finalRankings,
    setCurrentBattle,
    setSelectedPokemon,
    () => {},
    currentBattle,
    initialBattleStartedRef
  );
  
  const { generateNewBattle } = useBattleProcessorGeneration(
    battleStarterIntegration.battleStarter,
    battleStarterIntegration.startNewBattle,
    setCurrentBattle
  );

  // Battle handlers
  const handlePokemonSelect = useCallback((id: number) => {
    console.log(`🎯 [SIMPLIFIED_STATE] Pokemon selected: ${id}`);
    
    if (battleType === "pairs") {
      const timestamp = new Date().toISOString();
      const selectedIds = currentBattle.length === 2 ? [id] : [];
      const nonSelectedIds = currentBattle.filter(p => p.id !== id).map(p => p.id);
      
      console.log(`⚡ [PAIR_BATTLE] Processing pair battle: winner=${id}, loser=${nonSelectedIds[0]}`);
      
      // Add to battle history
      const battleData = {
        battle: currentBattle,
        selected: selectedIds,
        timestamp,
        battleType
      };
      
      setBattleHistory(prev => [...prev, battleData]);
      
      // Generate next battle with Top N parameters
      const N = 25; // Default Top N value
      const ratings = getAllRatings();
      generateNewBattle(battleType, timestamp, N, ratings);
      
    } else {
      setSelectedPokemon(prev => {
        const newSelected = prev.includes(id) 
          ? prev.filter(pokemonId => pokemonId !== id)
          : [...prev, id];
        console.log(`🎯 [SIMPLIFIED_STATE] Updated selections: ${newSelected}`);
        return newSelected;
      });
    }
  }, [battleType, currentBattle, generateNewBattle, getAllRatings]);

  const handleTripletSelectionComplete = useCallback(() => {
    if (selectedPokemon.length === 0) return;
    
    console.log(`⚡ [TRIPLET_BATTLE] Processing triplet battle with ${selectedPokemon.length} selections`);
    
    const timestamp = new Date().toISOString();
    const battleData = {
      battle: currentBattle,
      selected: selectedPokemon,
      timestamp,
      battleType
    };
    
    setBattleHistory(prev => [...prev, battleData]);
    setSelectedPokemon([]);
    
    // Generate next battle with Top N parameters
    const N = 25; // Default Top N value
    const ratings = getAllRatings();
    generateNewBattle(battleType, timestamp, N, ratings);
    
  }, [selectedPokemon, currentBattle, battleType, generateNewBattle, getAllRatings]);

  const goBack = useCallback(() => {
    console.log(`🔙 [SIMPLIFIED_STATE] Going back in battle history`);
    if (battleHistory.length > 0) {
      const lastBattle = battleHistory[battleHistory.length - 1];
      setCurrentBattle(lastBattle.battle);
      setSelectedPokemon(lastBattle.selected);
      setBattleHistory(prev => prev.slice(0, -1));
    }
  }, [battleHistory]);

  const handleContinueBattles = useCallback(() => {
    console.log(`▶️ [SIMPLIFIED_STATE] Continuing battles`);
    setShowingMilestone(false);
    
    // Generate next battle with Top N parameters
    const timestamp = new Date().toISOString();
    const N = 25; // Default Top N value
    const ratings = getAllRatings();
    generateNewBattle(battleType, timestamp, N, ratings);
  }, [battleType, generateNewBattle, getAllRatings]);

  const performFullBattleReset = useCallback(() => {
    console.log(`🔄 [SIMPLIFIED_STATE] Performing full battle reset`);
    setCurrentBattle([]);
    setSelectedPokemon([]);
    setBattleHistory([]);
    setFinalRankings([]);
    setShowingMilestone(false);
    setRankingGenerated(false);
    initialBattleStartedRef.current = false;
  }, []);

  const handleSaveRankings = useCallback(() => {
    console.log(`💾 [SIMPLIFIED_STATE] Saving rankings`);
    const ratings = getAllRatings();
    // Convert ratings to rankings format if needed
    setRankingGenerated(true);
  }, [getAllRatings]);

  const suggestRanking = useCallback((pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => {
    console.log(`📝 [SIMPLIFIED_STATE] Ranking suggestion: ${pokemon.name} ${direction} ${strength}`);
  }, []);

  const removeSuggestion = useCallback((pokemonId: number) => {
    console.log(`🗑️ [SIMPLIFIED_STATE] Removing suggestion for Pokemon: ${pokemonId}`);
  }, []);

  const resetMilestoneInProgress = useCallback(() => {
    console.log(`🎯 [SIMPLIFIED_STATE] Resetting milestone in progress`);
    setShowingMilestone(false);
  }, []);

  const handleManualReorder = useCallback((reorderedRankings: RankedPokemon[]) => {
    console.log(`🔄 [SIMPLIFIED_STATE] Manual reorder with ${reorderedRankings.length} rankings`);
    setFinalRankings(reorderedRankings);
  }, []);

  // Initial battle start effect
  useEffect(() => {
    if (!initialBattleStartedRef.current && allPokemon.length > 0) {
      console.log(`🚀 [SIMPLIFIED_STATE] Starting initial battle`);
      const timestamp = new Date().toISOString();
      const N = 25; // Default Top N value
      const ratings = getAllRatings();
      generateNewBattle(battleType, timestamp, N, ratings);
      initialBattleStartedRef.current = true;
    }
  }, [allPokemon, battleType, generateNewBattle, getAllRatings]);

  // Milestone detection effect
  useEffect(() => {
    if (battlesCompleted > 0 && battlesCompleted % BATTLE_MILESTONE_INTERVAL === 0) {
      console.log(`🎉 [SIMPLIFIED_STATE] Milestone reached: ${battlesCompleted} battles`);
      setShowingMilestone(true);
      const ratings = getAllRatings();
      // Convert ratings to rankings if needed for finalRankings
    }
  }, [battlesCompleted, getAllRatings]);

  return {
    // State
    currentBattle,
    selectedPokemon,
    battlesCompleted,
    battleType,
    battleHistory,
    finalRankings,
    showingMilestone,
    activeTier,
    milestones,
    rankingGenerated,
    isAnyProcessing,
    battleResults,
    
    // Setters
    setSelectedGeneration: (gen: number) => console.log(`🔧 [SIMPLIFIED_STATE] Generation set: ${gen}`),
    setBattleType,
    setShowingMilestone,
    setActiveTier,
    
    // Handlers
    handlePokemonSelect,
    handleTripletSelectionComplete,
    goBack,
    handleContinueBattles,
    performFullBattleReset,
    handleSaveRankings,
    suggestRanking,
    removeSuggestion,
    resetMilestoneInProgress,
    handleManualReorder
  };
};
