import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { useBattleStarterCore } from "./useBattleStarterCore";
import { useBattleStateHandlers } from "./useBattleStateHandlers";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";

export const useBattleStateCore = (
  allPokemon: Pokemon[],
  initialBattleType: BattleType,
  initialSelectedGeneration: number
) => {
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [battleResults, setBattleResults] = useState<SingleBattle[]>([]);
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [showingMilestone, setShowingMilestone] = useState(false);
  const [selectedGeneration, setSelectedGeneration] = useState(initialSelectedGeneration);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [rankingGenerated, setRankingGenerated] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);
  const [battleType, setBattleType] = useState<BattleType>(initialBattleType);
  const [finalRankings, setFinalRankings] = useState<Pokemon[]>([]);
  const [confidenceScores, setConfidenceScores] = useState<{ [pokemonId: number]: number }>({});
  const [battleHistory, setBattleHistory] = useState<{ battle: Pokemon[], selected: number[] }[]>([]);
  const [activeTier, setActiveTier] = useState<TopNOption>("All");
  const [isBattleTransitioning, setIsBattleTransitioning] = useState(false);
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [milestoneInProgress, setMilestoneInProgress] = useState(false);
  const [isAnyProcessing, setIsAnyProcessing] = useState(false);
  const [frozenPokemon, setFrozenPokemon] = useState<number[]>([]);
  
  // Add initialization ref to prevent multiple battle starts
  const initialBattleStartedRef = useRef(false);

  const { battleStarter, areBattlesIdentical } = useBattleStarterCore(allPokemon, finalRankings as RankedPokemon[]);
  const refinementQueue = useSharedRefinementQueue();

  // CRITICAL FIX: Start initial battle when Pokemon are available
  useEffect(() => {
    console.log(`🚀 [BATTLE_INIT] Pokemon data check: ${allPokemon?.length || 0} Pokemon available, currentBattle: ${currentBattle?.length || 0}, initialStarted: ${initialBattleStartedRef.current}`);
    
    if (allPokemon && allPokemon.length > 0 && !initialBattleStartedRef.current && (!currentBattle || currentBattle.length === 0)) {
      console.log(`🚀 [BATTLE_INIT] Starting initial battle with ${allPokemon.length} Pokemon`);
      initialBattleStartedRef.current = true;
      
      // Start initial battle
      setTimeout(() => {
        if (battleStarter && battleStarter.startNewBattle) {
          console.log(`🚀 [BATTLE_INIT] Calling battleStarter.startNewBattle`);
          const initialBattle = battleStarter.startNewBattle(battleType);
          if (initialBattle && initialBattle.length > 0) {
            console.log(`✅ [BATTLE_INIT] Initial battle created:`, initialBattle.map(p => p.name).join(' vs '));
            setCurrentBattle(initialBattle);
            setSelectedPokemon([]);
          } else {
            console.error(`❌ [BATTLE_INIT] Failed to create initial battle`);
          }
        } else {
          console.error(`❌ [BATTLE_INIT] battleStarter not available`);
        }
      }, 100);
    }
  }, [allPokemon.length > 0 ? 1 : 0, battleStarter, battleType]); // Only depend on whether we HAVE Pokemon

  const calculateCompletionPercentage = useCallback(() => {
    const completed = battlesCompleted;
    const totalPossible = 800;
    const percentage = Math.min((completed / totalPossible) * 100, 100);
    setCompletionPercentage(percentage);
    return percentage;
  }, [battlesCompleted]);

  useEffect(() => {
    calculateCompletionPercentage();
  }, [battlesCompleted, calculateCompletionPercentage]);

  const getSnapshotForMilestone = useCallback(() => {
    const snapshot = {
      rankings: [...finalRankings],
      battleHistory: [...battleHistory],
      battlesCompleted,
      completionPercentage
    };
    return JSON.stringify(snapshot);
  }, [finalRankings, battleHistory, battlesCompleted, completionPercentage]);

  const resetMilestones = useCallback(() => {
    setMilestones([]);
  }, []);

  const handlePokemonSelect = useCallback((id: number) => {
    setSelectedPokemon(prev => {
      if (prev.includes(id)) {
        return prev.filter(pokemonId => pokemonId !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  const originalProcessBattleResult = useCallback((
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    selectedGeneration: number
  ) => {
    setIsProcessingResult(true);
    setIsAnyProcessing(true);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const selected = selectedPokemonIds.sort((a, b) => a - b);
        setBattleHistory(prev => [...prev, { battle: currentBattlePokemon, selected }]);

        setBattlesCompleted(prev => prev + 1);
        localStorage.setItem('pokemon-battle-count', String(battlesCompleted + 1));

        const newBattleResult: SingleBattle = {
          battleType,
          generation: selectedGeneration,
          pokemonIds: currentBattlePokemon.map(p => p.id),
          selectedPokemonIds: selectedPokemonIds,
          timestamp: new Date().toISOString()
        };

        setBattleResults(prev => [...prev, newBattleResult]);

        const milestoneCheck = (battlesCompleted + 1) % 100 === 0;
        if (milestoneCheck) {
          setMilestoneInProgress(true);
          setShowingMilestone(true);
        }

        setSelectedPokemon([]);
        setIsProcessingResult(false);
        setIsAnyProcessing(false);
        resolve();
      }, 500);
    });
  }, [battlesCompleted]);

  const {
    processBattleResultWithRefinement,
    handleManualReorder: actualManualReorder,
    pendingRefinements,
    refinementBattleCount,
    clearRefinementQueue
  } = useBattleStateHandlers(
    allPokemon,
    originalProcessBattleResult,
    finalRankings
  );

  const handleTripletSelectionComplete = useCallback(async () => {
    if (selectedPokemon.length !== (battleType === "pairs" ? 1 : 2)) {
      console.warn("Incorrect number of Pokémon selected");
      return;
    }

    setIsBattleTransitioning(true);
    setIsAnyProcessing(true);

    try {
      await processBattleResultWithRefinement(
        selectedPokemon,
        currentBattle,
        battleType,
        selectedGeneration
      );

      setTimeout(() => {
        setIsBattleTransitioning(false);
        setIsAnyProcessing(false);
        startNewBattle();
      }, 500);
    } catch (error) {
      console.error("Error processing battle result:", error);
      setIsBattleTransitioning(false);
      setIsAnyProcessing(false);
    }
  }, [selectedPokemon, currentBattle, battleType, selectedGeneration, processBattleResultWithRefinement]);

  const goBack = useCallback(() => {
    if (battleHistory.length > 0) {
      const lastBattle = battleHistory[battleHistory.length - 1];
      setCurrentBattle(lastBattle.battle);
      setSelectedPokemon(lastBattle.selected);
      setBattleHistory(prev => prev.slice(0, -1));
      setBattlesCompleted(prev => prev - 1);
      setBattleResults(prev => prev.slice(0, -1));
    }
  }, [battleHistory]);

  const startNewBattle = useCallback(() => {
    console.log(`🚀 [START_NEW_BATTLE] Called with battleStarter available: ${!!battleStarter}`);
    
    if (!battleStarter || !battleStarter.startNewBattle) {
      console.error(`❌ [START_NEW_BATTLE] battleStarter not available`);
      return;
    }
    
    setIsBattleTransitioning(true);
    setIsAnyProcessing(true);

    setTimeout(() => {
      const newBattle = battleStarter.startNewBattle(battleType);
      console.log(`🚀 [START_NEW_BATTLE] Generated battle:`, newBattle?.map(p => p.name).join(' vs ') || 'None');
      
      if (newBattle && newBattle.length > 0) {
        setCurrentBattle(newBattle);
        setSelectedPokemon([]);
      } else {
        console.error(`❌ [START_NEW_BATTLE] Failed to generate battle`);
      }
      
      setIsBattleTransitioning(false);
      setIsAnyProcessing(false);
    }, 300);
  }, [battleType, battleStarter]);

  const generateRankings = useCallback(() => {
    setRankingGenerated(true);
    setFinalRankings(currentBattle);
  }, [currentBattle]);

  const handleSaveRankings = useCallback(() => {
    setShowingMilestone(false);
  }, []);

  const freezePokemonForTier = useCallback((pokemonId: number, tier: TopNOption) => {
    setFrozenPokemon(prev => [...prev, pokemonId]);
  }, []);

  const isPokemonFrozenForTier = useCallback((pokemonId: number, tier: TopNOption) => {
    return frozenPokemon.includes(pokemonId);
  }, [frozenPokemon]);

  const suggestRanking = useCallback((pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => {
    pokemon.suggestedAdjustment = { direction, strength, used: false };
    setFinalRankings(prev => {
      return prev.map(p => {
        if (p.id === pokemon.id) {
          return { ...p, suggestedAdjustment: pokemon.suggestedAdjustment };
        }
        return p;
      });
    });
  }, [setFinalRankings]);

  const removeSuggestion = useCallback((pokemonId: number) => {
    setFinalRankings(prev => {
      return prev.map(p => {
        if (p.id === pokemonId) {
          delete p.suggestedAdjustment;
          return { ...p };
        }
        return p;
      });
    });
  }, [setFinalRankings]);

  const clearAllSuggestions = useCallback(() => {
    setFinalRankings(prev => {
      return prev.map(p => {
        delete p.suggestedAdjustment;
        return { ...p };
      });
    });
  }, [setFinalRankings]);

  const handleContinueBattles = useCallback(() => {
    setShowingMilestone(false);
    setMilestoneInProgress(false);
    startNewBattle();
  }, [startNewBattle]);

  const resetMilestoneInProgress = useCallback(() => {
    setMilestoneInProgress(false);
  }, []);

  const performFullBattleReset = useCallback(() => {
    localStorage.removeItem('pokemon-battle-count');
    setBattlesCompleted(0);
    setBattleResults([]);
    setBattleHistory([]);
    setFinalRankings([]);
    setRankingGenerated(false);
    setShowingMilestone(false);
    setMilestoneInProgress(false);
    clearAllSuggestions();
    clearRefinementQueue();
    initialBattleStartedRef.current = false; // Reset so new battle can start
    startNewBattle();
  }, [startNewBattle, clearAllSuggestions, clearRefinementQueue]);

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
    handleManualReorder: actualManualReorder,
    pendingRefinements,
    refinementBattleCount,
    clearRefinementQueue
  };
};
