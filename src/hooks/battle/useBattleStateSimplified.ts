import { useState, useEffect, useCallback, useRef } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { rate_1vs1 } from "ts-trueskill";
import { useBattleStarterIntegration } from "./useBattleStarterIntegration";
import { useBattleProcessorGeneration } from "./useBattleProcessorGeneration";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";
import { useBattleStarterMemory } from "./useBattleStarterMemory";
import { useMilestoneManager } from "./useMilestoneManager";

const BATTLE_MILESTONE_INTERVAL = 25;

export const useBattleStateSimplified = (
  allPokemon: Pokemon[],
  initialBattleType: BattleType,
  selectedGeneration: number,
  onBattleGenerated?: (strategy: string) => void
) => {
  console.log(`🚀 [SIMPLIFIED_STATE] Initializing with ${allPokemon.length} Pokemon`);
  
  // Core state
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);
  const [battleType, setBattleType] = useState<BattleType>(initialBattleType);
  const [battleHistory, setBattleHistory] = useState<{ battle: Pokemon[], selected: number[] }[]>([]);
  const [activeTier, setActiveTier] = useState<string>("All");
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
    getRating,
    processBattleOutcomes,
    incrementTotalBattles
  } = useTrueSkillStore();

  // Milestone manager hook
  const { 
    finalRankings, 
    setFinalRankings, 
    showingMilestone, 
    setShowingMilestone 
  } = useMilestoneManager(battlesCompleted, allPokemon);
  
  const { addBattlePair } = useBattleStarterMemory();
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
    allPokemon,
    battlesCompleted,
    setCurrentBattle,
    onBattleGenerated
  );

  // Battle handlers
  const handlePokemonSelect = useCallback((id: number) => {
    console.log(`🎯 [SIMPLIFIED_STATE] Pokemon selected: ${id}`);
    
    if (battleType === "pairs") {
      const timestamp = new Date().toISOString();
      const selectedIds = currentBattle.length === 2 ? [id] : [];
      const winner = currentBattle.find(p => p.id === id);
      const loser = currentBattle.find(p => p.id !== id);
      const nonSelectedIds = loser ? [loser.id] : [];
      
      console.log(`⚡ [PAIR_BATTLE] Processing pair battle: winner=${id}, loser=${nonSelectedIds[0]}`);

      if (!winner || !loser) {
        console.warn("[SIMPLIFIED_STATE] Ignoring invalid pair battle selection", {
          selectedId: id,
          currentBattle: currentBattle.map(p => p.id)
        });
        return;
      }

      const [newWinnerRating, newLoserRating] = rate_1vs1(
        getRating(winner.id.toString()),
        getRating(loser.id.toString())
      );

      processBattleOutcomes([
        { pokemonId: winner.id.toString(), newRating: newWinnerRating },
        { pokemonId: loser.id.toString(), newRating: newLoserRating },
      ]);

      // NEW: Add battle to recent pair memory
      addBattlePair(currentBattle.map(p => p.id));
      
      // Add to battle history
      const battleData = {
        battle: currentBattle,
        selected: selectedIds,
        timestamp,
        battleType
      };
      
      setBattleHistory(prev => [...prev, battleData]);
      setBattleResults(prev => [
        ...prev,
        {
          battleType,
          generation: winner.generation || 0,
          pokemonIds: currentBattle.map(p => p.id),
          selectedPokemonIds: selectedIds,
          timestamp,
          winner,
          loser
        }
      ]);
      
      // Increment total battles in the store
      incrementTotalBattles();
      console.log(`📈 [SIMPLIFIED_STATE] Total battles incremented.`);
      
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
  }, [battleType, currentBattle, generateNewBattle, getAllRatings, getRating, processBattleOutcomes, addBattlePair, incrementTotalBattles]);

  const handleTripletSelectionComplete = useCallback(() => {
    if (selectedPokemon.length === 0) return;
    
    console.log(`⚡ [TRIPLET_BATTLE] Processing triplet battle with ${selectedPokemon.length} selections`);
    
    const timestamp = new Date().toISOString();

    // NEW: Add battle to recent pair memory
    addBattlePair(currentBattle.map(p => p.id));

    const battleData = {
      battle: currentBattle,
      selected: selectedPokemon,
      timestamp,
      battleType
    };

    const winners = currentBattle.filter(p => selectedPokemon.includes(p.id));
    const losers = currentBattle.filter(p => !selectedPokemon.includes(p.id));

    if (winners.length > 0 && losers.length > 0) {
      const finalRatings: Record<string, ReturnType<typeof getRating>> = {};
      currentBattle.forEach(pokemon => {
        finalRatings[pokemon.id.toString()] = getRating(pokemon.id.toString());
      });

      winners.forEach(winner => {
        losers.forEach(loser => {
          const [newWinnerRating, newLoserRating] = rate_1vs1(
            finalRatings[winner.id.toString()],
            finalRatings[loser.id.toString()]
          );
          finalRatings[winner.id.toString()] = newWinnerRating;
          finalRatings[loser.id.toString()] = newLoserRating;
        });
      });

      processBattleOutcomes(currentBattle.map(pokemon => ({
        pokemonId: pokemon.id.toString(),
        newRating: finalRatings[pokemon.id.toString()]
      })));
    }
    
    setBattleHistory(prev => [...prev, battleData]);
    setBattleResults(prev => [
      ...prev,
      ...losers.flatMap(loser => winners.map(winner => ({
        battleType,
        generation: winner.generation || 0,
        pokemonIds: [winner.id, loser.id],
        selectedPokemonIds: [winner.id],
        timestamp,
        winner,
        loser
      })))
    ]);
    setSelectedPokemon([]);
    
    // Increment total battles in the store
    incrementTotalBattles();
    console.log(`📈 [SIMPLIFIED_STATE] Total battles incremented.`);
    
    // Generate next battle with Top N parameters
    const N = 25; // Default Top N value
    const ratings = getAllRatings();
    generateNewBattle(battleType, timestamp, N, ratings);
    
  }, [selectedPokemon, currentBattle, battleType, generateNewBattle, getAllRatings, getRating, processBattleOutcomes, addBattlePair, incrementTotalBattles]);

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
  }, [battleType, generateNewBattle, getAllRatings, setShowingMilestone]);

  const performFullBattleReset = useCallback(() => {
    console.log(`🔄 [SIMPLIFIED_STATE] Performing full battle reset`);
    setCurrentBattle([]);
    setSelectedPokemon([]);
    setBattleHistory([]);
    setFinalRankings([]);
    setShowingMilestone(false);
    setRankingGenerated(false);
    initialBattleStartedRef.current = false;
  }, [setFinalRankings, setShowingMilestone]);

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
  }, [setShowingMilestone]);

  const handleManualReorder = useCallback((reorderedRankings: RankedPokemon[]) => {
    console.log(`🔄 [SIMPLIFIED_STATE] Manual reorder with ${reorderedRankings.length} rankings`);
    setFinalRankings(reorderedRankings);
  }, [setFinalRankings]);

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
