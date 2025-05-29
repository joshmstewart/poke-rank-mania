import { useState, useCallback, useEffect, useMemo } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { validateBattlePokemon } from "@/services/pokemon/api/utils";

export const useBattleStateCore = (
  allPokemon: Pokemon[],
  initialBattleType: BattleType,
  initialSelectedGeneration: number
) => {
  console.log(`🔧 [BATTLE_STATE_CORE] Initializing with ${allPokemon.length} Pokemon`);
  
  // Basic state
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);
  const [battleType, setBattleType] = useState<BattleType>(initialBattleType);
  const [selectedGeneration, setSelectedGeneration] = useState(initialSelectedGeneration);
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [battleResults, setBattleResults] = useState<any[]>([]);
  const [showingMilestone, setShowingMilestone] = useState(false);
  const [rankingGenerated, setRankingGenerated] = useState(false);
  const [finalRankings, setFinalRankings] = useState<any[]>([]);
  const [confidenceScores, setConfidenceScores] = useState<any[]>([]);
  const [battleHistory, setBattleHistory] = useState<any[]>([]);
  const [activeTier, setActiveTier] = useState<any>("All");
  const [isBattleTransitioning, setIsBattleTransitioning] = useState(false);
  const [isAnyProcessing, setIsAnyProcessing] = useState(false);
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // CRITICAL FIX: Add recently used Pokemon tracking
  const [recentlyUsedPokemon, setRecentlyUsedPokemon] = useState<Set<number>>(new Set());

  // Milestones
  const milestones = useMemo(() => [10, 25, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000], []);

  // CRITICAL FIX: Enhanced battle generation with anti-repetition
  const generateNewBattle = useCallback((battleType: BattleType): Pokemon[] => {
    const battleSize = battleType === "pairs" ? 2 : 3;
    const timestamp = Date.now();
    
    console.log(`🎲 [ANTI_REPEAT_BATTLE_GEN] ===== Generating battle #${battlesCompleted + 1} =====`);
    console.log(`🎲 [ANTI_REPEAT_BATTLE_GEN] Battle size: ${battleSize}`);
    console.log(`🎲 [ANTI_REPEAT_BATTLE_GEN] Available Pokemon: ${allPokemon.length}`);
    console.log(`🎲 [ANTI_REPEAT_BATTLE_GEN] Recently used Pokemon: ${recentlyUsedPokemon.size}`);
    
    if (!allPokemon || allPokemon.length < battleSize) {
      console.error(`🎲 [ANTI_REPEAT_BATTLE_GEN] Not enough Pokemon: need ${battleSize}, have ${allPokemon.length}`);
      return [];
    }
    
    // CRITICAL FIX: Filter out recently used Pokemon first
    const availablePokemon = allPokemon.filter(pokemon => !recentlyUsedPokemon.has(pokemon.id));
    
    console.log(`🎲 [ANTI_REPEAT_BATTLE_GEN] Available after filtering recent: ${availablePokemon.length}`);
    
    // If we don't have enough non-recent Pokemon, clear some of the recent list
    if (availablePokemon.length < battleSize) {
      console.log(`🎲 [ANTI_REPEAT_BATTLE_GEN] Not enough non-recent Pokemon, clearing recent list`);
      setRecentlyUsedPokemon(new Set());
      // Use all Pokemon if we had to clear the recent list
      const shuffled = [...allPokemon];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const selected = shuffled.slice(0, battleSize);
      const validated = validateBattlePokemon(selected);
      console.log(`🎲 [ANTI_REPEAT_BATTLE_GEN] Generated after clearing recent: ${validated.map(p => p.name).join(' vs ')}`);
      return validated;
    }
    
    // Use truly random selection from available Pokemon
    const shuffled = [...availablePokemon];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const randomValue = (timestamp * (i + 1) + Math.random() * 1000000) % shuffled.length;
      const j = Math.floor(randomValue);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    const selected = shuffled.slice(0, battleSize);
    const validated = validateBattlePokemon(selected);
    
    console.log(`🎲 [ANTI_REPEAT_BATTLE_GEN] Generated: ${validated.map(p => p.name).join(' vs ')}`);
    
    return validated;
  }, [allPokemon, battlesCompleted, recentlyUsedPokemon]);

  // Start new battle
  const startNewBattle = useCallback(() => {
    console.log(`🚀 [START_NEW_BATTLE] Starting new ${battleType} battle`);
    const newBattle = generateNewBattle(battleType);
    if (newBattle.length > 0) {
      setCurrentBattle(newBattle);
      setSelectedPokemon([]);
      console.log(`🚀 [START_NEW_BATTLE] New battle set: ${newBattle.map(p => p.name).join(' vs ')}`);
    } else {
      console.error(`🚀 [START_NEW_BATTLE] Failed to generate battle`);
    }
  }, [battleType, generateNewBattle]);

  // CRITICAL FIX: Enhanced milestone detection
  const checkForMilestone = useCallback((newBattlesCompleted: number) => {
    console.log(`🏆 [MILESTONE_CHECK] Checking milestone for battle ${newBattlesCompleted}`);
    console.log(`🏆 [MILESTONE_CHECK] Available milestones: ${milestones.join(', ')}`);
    
    const isMilestone = milestones.includes(newBattlesCompleted);
    console.log(`🏆 [MILESTONE_CHECK] Is battle ${newBattlesCompleted} a milestone? ${isMilestone}`);
    
    if (isMilestone) {
      console.log(`🏆 [MILESTONE_HIT] MILESTONE ${newBattlesCompleted} REACHED!`);
      setShowingMilestone(true);
      setRankingGenerated(true);
      
      // Generate simple ranking for milestone
      const ranking = allPokemon.slice(0, 50);
      setFinalRankings(ranking);
      
      console.log(`🏆 [MILESTONE_HIT] Milestone ${newBattlesCompleted} setup complete`);
      return true;
    }
    
    return false;
  }, [milestones, allPokemon]);

  // Pokemon selection handler
  const handlePokemonSelect = useCallback((pokemonId: number) => {
    console.log(`🎯 [POKEMON_SELECT] Pokemon ${pokemonId} selected`);
    
    if (isProcessingResult) {
      console.log(`🎯 [POKEMON_SELECT] Already processing, ignoring selection`);
      return;
    }

    const newSelection = [...selectedPokemon, pokemonId];
    setSelectedPokemon(newSelection);

    // CRITICAL FIX: Add selected Pokemon to recently used list
    setRecentlyUsedPokemon(prev => {
      const newRecent = new Set(prev);
      currentBattle.forEach(pokemon => newRecent.add(pokemon.id));
      
      // Keep only the last 20 Pokemon to prevent the list from growing too large
      if (newRecent.size > 20) {
        const recentArray = Array.from(newRecent);
        const toKeep = recentArray.slice(-20);
        return new Set(toKeep);
      }
      
      return newRecent;
    });

    if (battleType === "pairs" && newSelection.length === 1) {
      console.log(`🎯 [POKEMON_SELECT] Pairs battle completed, processing result`);
      
      const newBattlesCompleted = battlesCompleted + 1;
      console.log(`🎯 [POKEMON_SELECT] New battles completed: ${newBattlesCompleted}`);
      
      // Simple result processing
      setBattleResults(prev => [...prev, { battle: currentBattle, selected: newSelection }]);
      setBattleHistory(prev => [...prev, { battle: currentBattle, selected: newSelection }]);
      setBattlesCompleted(newBattlesCompleted);
      setSelectedPokemon([]);
      
      // CRITICAL FIX: Check for milestone BEFORE starting next battle
      const hitMilestone = checkForMilestone(newBattlesCompleted);
      
      if (!hitMilestone) {
        // Only start next battle if we didn't hit a milestone
        setTimeout(() => {
          startNewBattle();
        }, 100);
      }
    }
  }, [selectedPokemon, battleType, currentBattle, isProcessingResult, battlesCompleted, checkForMilestone, startNewBattle]);

  // Triplet selection handler
  const handleTripletSelectionComplete = useCallback(() => {
    if (battleType === "triplets" && selectedPokemon.length === 2) {
      console.log(`🎯 [TRIPLET_SELECT] Triplet battle completed, processing result`);
      
      const newBattlesCompleted = battlesCompleted + 1;
      console.log(`🎯 [TRIPLET_SELECT] New battles completed: ${newBattlesCompleted}`);
      
      // Add selected Pokemon to recently used list
      setRecentlyUsedPokemon(prev => {
        const newRecent = new Set(prev);
        currentBattle.forEach(pokemon => newRecent.add(pokemon.id));
        
        if (newRecent.size > 20) {
          const recentArray = Array.from(newRecent);
          const toKeep = recentArray.slice(-20);
          return new Set(toKeep);
        }
        
        return newRecent;
      });
      
      setBattleResults(prev => [...prev, { battle: currentBattle, selected: selectedPokemon }]);
      setBattleHistory(prev => [...prev, { battle: currentBattle, selected: selectedPokemon }]);
      setBattlesCompleted(newBattlesCompleted);
      setSelectedPokemon([]);
      
      // Check for milestone BEFORE starting next battle
      const hitMilestone = checkForMilestone(newBattlesCompleted);
      
      if (!hitMilestone) {
        setTimeout(() => {
          startNewBattle();
        }, 100);
      }
    }
  }, [battleType, selectedPokemon, currentBattle, battlesCompleted, checkForMilestone, startNewBattle]);

  // Initialize first battle when Pokemon are available
  useEffect(() => {
    if (allPokemon.length > 0 && currentBattle.length === 0) {
      console.log(`🚀 [INIT_BATTLE] Initializing first battle with ${allPokemon.length} Pokemon`);
      setTimeout(() => {
        startNewBattle();
      }, 100);
    }
  }, [allPokemon.length, currentBattle.length, startNewBattle]);

  // Stub functions for compatibility
  const goBack = useCallback(() => {
    if (battleHistory.length > 0) {
      const lastBattle = battleHistory[battleHistory.length - 1];
      setCurrentBattle(lastBattle.battle);
      setSelectedPokemon([]);
      setBattleHistory(prev => prev.slice(0, -1));
      setBattleResults(prev => prev.slice(0, -1));
      setBattlesCompleted(prev => prev - 1);
    }
  }, [battleHistory]);

  const resetMilestones = useCallback(() => {
    setShowingMilestone(false);
    setRankingGenerated(false);
  }, []);

  const calculateCompletionPercentage = useCallback(() => {
    return Math.min((battlesCompleted / 100) * 100, 100);
  }, [battlesCompleted]);

  const getSnapshotForMilestone = useCallback(() => {
    return { battlesCompleted, battleResults, finalRankings };
  }, [battlesCompleted, battleResults, finalRankings]);

  const generateRankings = useCallback(() => {
    console.log(`📊 [GENERATE_RANKINGS] Generating rankings from ${battleResults.length} results`);
    setFinalRankings(allPokemon.slice(0, 50)); // Simple ranking for now
    setRankingGenerated(true);
  }, [battleResults, allPokemon]);

  const handleSaveRankings = useCallback(() => {
    console.log(`💾 [SAVE_RANKINGS] Saving rankings`);
  }, []);

  const freezePokemonForTier = useCallback(() => {}, []);
  const isPokemonFrozenForTier = useCallback(() => false, []);
  const suggestRanking = useCallback(() => {}, []);
  const removeSuggestion = useCallback(() => {}, []);
  const clearAllSuggestions = useCallback(() => {}, []);
  const handleContinueBattles = useCallback(() => {
    setShowingMilestone(false);
    startNewBattle();
  }, [startNewBattle]);
  const resetMilestoneInProgress = useCallback(() => {}, []);
  const performFullBattleReset = useCallback(() => {
    setBattlesCompleted(0);
    setBattleResults([]);
    setBattleHistory([]);
    setCurrentBattle([]);
    setSelectedPokemon([]);
    setRecentlyUsedPokemon(new Set());
    startNewBattle();
  }, [startNewBattle]);
  const handleManualReorder = useCallback(() => {}, []);

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
    isBattleTransitioning,
    isAnyProcessing,
    isProcessingResult,
    milestones,
    resetMilestones,
    calculateCompletionPercentage,
    getSnapshotForMilestone,
    handlePokemonSelect,
    handleTripletSelectionComplete,
    goBack,
    generateRankings,
    handleSaveRankings,
    freezePokemonForTier,
    isPokemonFrozenForTier,
    suggestRanking,
    removeSuggestion,
    clearAllSuggestions,
    handleContinueBattles,
    resetMilestoneInProgress,
    performFullBattleReset,
    handleManualReorder,
    pendingRefinements: [],
    refinementBattleCount: 0,
    clearRefinementQueue: () => {},
    startNewBattle
  };
};
