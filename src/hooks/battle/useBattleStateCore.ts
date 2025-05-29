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

  // CRITICAL FIX: Track recently used Pokemon with proper management
  const [recentlyUsedPokemon, setRecentlyUsedPokemon] = useState<Set<number>>(new Set());

  // Milestones
  const milestones = useMemo(() => [10, 25, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000], []);

  // CRITICAL FIX: Completely new battle generation with proper repetition prevention
  const generateNewBattle = useCallback((battleType: BattleType): Pokemon[] => {
    const battleSize = battleType === "pairs" ? 2 : 3;
    const battleNumber = battlesCompleted + 1;
    
    console.log(`🎲🎲🎲 [ANTI_REPEAT_GENERATION] ===== Battle #${battleNumber} Generation =====`);
    console.log(`🎲🎲🎲 [ANTI_REPEAT_GENERATION] Battle size: ${battleSize}`);
    console.log(`🎲🎲🎲 [ANTI_REPEAT_GENERATION] Total Pokemon: ${allPokemon.length}`);
    console.log(`🎲🎲🎲 [ANTI_REPEAT_GENERATION] Recently used Pokemon count: ${recentlyUsedPokemon.size}`);
    console.log(`🎲🎲🎲 [ANTI_REPEAT_GENERATION] Recently used IDs: [${Array.from(recentlyUsedPokemon).join(', ')}]`);
    
    if (!allPokemon || allPokemon.length < battleSize) {
      console.error(`🎲🎲🎲 [ANTI_REPEAT_GENERATION] Not enough Pokemon: need ${battleSize}, have ${allPokemon.length}`);
      return [];
    }
    
    // Step 1: Filter out recently used Pokemon FIRST
    let availablePokemon = allPokemon.filter(pokemon => !recentlyUsedPokemon.has(pokemon.id));
    console.log(`🎲🎲🎲 [ANTI_REPEAT_GENERATION] Available after filtering recent: ${availablePokemon.length}`);
    
    // Step 2: If not enough available, reduce the recent list size
    if (availablePokemon.length < battleSize) {
      console.log(`🎲🎲🎲 [ANTI_REPEAT_GENERATION] Not enough non-recent Pokemon, reducing recent list`);
      
      // Keep only the last 10 instead of 20
      const recentArray = Array.from(recentlyUsedPokemon);
      const reducedRecent = new Set(recentArray.slice(-10));
      setRecentlyUsedPokemon(reducedRecent);
      
      availablePokemon = allPokemon.filter(pokemon => !reducedRecent.has(pokemon.id));
      console.log(`🎲🎲🎲 [ANTI_REPEAT_GENERATION] Available after reducing recent list: ${availablePokemon.length}`);
      
      // If still not enough, clear recent list completely
      if (availablePokemon.length < battleSize) {
        console.log(`🎲🎲🎲 [ANTI_REPEAT_GENERATION] Still not enough, clearing recent list completely`);
        setRecentlyUsedPokemon(new Set());
        availablePokemon = [...allPokemon];
      }
    }
    
    // Step 3: Use crypto random for true randomness
    const selected: Pokemon[] = [];
    const availableCopy = [...availablePokemon];
    
    // Fisher-Yates shuffle with crypto random
    for (let i = availableCopy.length - 1; i > 0; i--) {
      const randomArray = new Uint32Array(1);
      crypto.getRandomValues(randomArray);
      const j = Math.floor((randomArray[0] / (0xFFFFFFFF + 1)) * (i + 1));
      [availableCopy[i], availableCopy[j]] = [availableCopy[j], availableCopy[i]];
    }
    
    // Take the first battleSize Pokemon from shuffled array
    const result = availableCopy.slice(0, battleSize);
    const validated = validateBattlePokemon(result);
    
    console.log(`🎲🎲🎲 [ANTI_REPEAT_GENERATION] Selected Pokemon: ${validated.map(p => `${p.name}(${p.id})`).join(' vs ')}`);
    console.log(`🎲🎲🎲 [ANTI_REPEAT_GENERATION] ===== Generation Complete =====`);
    
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

  // CRITICAL FIX: Enhanced milestone detection with proper logging
  const checkForMilestone = useCallback((newBattlesCompleted: number) => {
    console.log(`🏆🏆🏆 [MILESTONE_DETECTION] ===== Checking Milestone =====`);
    console.log(`🏆🏆🏆 [MILESTONE_DETECTION] Battle number: ${newBattlesCompleted}`);
    console.log(`🏆🏆🏆 [MILESTONE_DETECTION] Available milestones: ${milestones.join(', ')}`);
    
    const isMilestone = milestones.includes(newBattlesCompleted);
    console.log(`🏆🏆🏆 [MILESTONE_DETECTION] Is milestone? ${isMilestone}`);
    
    if (isMilestone) {
      console.log(`🏆🏆🏆 [MILESTONE_HIT] ===== MILESTONE ${newBattlesCompleted} REACHED! =====`);
      setShowingMilestone(true);
      setRankingGenerated(true);
      
      // Generate simple ranking for milestone
      const ranking = allPokemon.slice(0, 50);
      setFinalRankings(ranking);
      
      console.log(`🏆🏆🏆 [MILESTONE_HIT] Milestone setup complete - showing milestone screen`);
      return true;
    }
    
    return false;
  }, [milestones, allPokemon]);

  // Pokemon selection handler with proper recent tracking
  const handlePokemonSelect = useCallback((pokemonId: number) => {
    console.log(`🎯🎯🎯 [POKEMON_SELECT] ===== Pokemon Selection =====`);
    console.log(`🎯🎯🎯 [POKEMON_SELECT] Pokemon ${pokemonId} selected`);
    console.log(`🎯🎯🎯 [POKEMON_SELECT] Current battle: ${currentBattle.map(p => `${p.name}(${p.id})`).join(' vs ')}`);
    
    if (isProcessingResult) {
      console.log(`🎯🎯🎯 [POKEMON_SELECT] Already processing, ignoring selection`);
      return;
    }

    const newSelection = [...selectedPokemon, pokemonId];
    setSelectedPokemon(newSelection);

    if (battleType === "pairs" && newSelection.length === 1) {
      console.log(`🎯🎯🎯 [POKEMON_SELECT] Pairs battle completed`);
      
      const newBattlesCompleted = battlesCompleted + 1;
      console.log(`🎯🎯🎯 [POKEMON_SELECT] New battles completed: ${newBattlesCompleted}`);
      
      // CRITICAL FIX: Add current battle Pokemon to recently used IMMEDIATELY
      setRecentlyUsedPokemon(prev => {
        const newRecent = new Set(prev);
        currentBattle.forEach(pokemon => {
          newRecent.add(pokemon.id);
          console.log(`📝 [RECENT_TRACKING] Added ${pokemon.name}(${pokemon.id}) to recent list`);
        });
        
        // Keep only the last 20 Pokemon
        if (newRecent.size > 20) {
          const recentArray = Array.from(newRecent);
          const toKeep = recentArray.slice(-20);
          console.log(`📝 [RECENT_TRACKING] Trimmed recent list to last 20: [${toKeep.join(', ')}]`);
          return new Set(toKeep);
        }
        
        console.log(`📝 [RECENT_TRACKING] Recent list now has ${newRecent.size} Pokemon: [${Array.from(newRecent).join(', ')}]`);
        return newRecent;
      });
      
      // Process battle result
      setBattleResults(prev => [...prev, { battle: currentBattle, selected: newSelection }]);
      setBattleHistory(prev => [...prev, { battle: currentBattle, selected: newSelection }]);
      setBattlesCompleted(newBattlesCompleted);
      setSelectedPokemon([]);
      
      // Check for milestone BEFORE starting next battle
      const hitMilestone = checkForMilestone(newBattlesCompleted);
      
      if (!hitMilestone) {
        console.log(`🎯🎯🎯 [POKEMON_SELECT] No milestone hit, starting next battle`);
        setTimeout(() => {
          startNewBattle();
        }, 100);
      } else {
        console.log(`🎯🎯🎯 [POKEMON_SELECT] Milestone hit, showing milestone screen`);
      }
    }
  }, [selectedPokemon, battleType, currentBattle, isProcessingResult, battlesCompleted, checkForMilestone, startNewBattle]);

  // Triplet selection handler
  const handleTripletSelectionComplete = useCallback(() => {
    if (battleType === "triplets" && selectedPokemon.length === 2) {
      console.log(`🎯 [TRIPLET_SELECT] Triplet battle completed, processing result`);
      
      const newBattlesCompleted = battlesCompleted + 1;
      
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
