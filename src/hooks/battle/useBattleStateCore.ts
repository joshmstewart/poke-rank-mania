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
  console.log(`🔧 [BATTLE_STATE_CORE_ULTRA_DEBUG] useBattleStateCore called with ${allPokemon.length} Pokemon`);
  
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
  const [milestones, setMilestones] = useState<number[]>([10, 25, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000]);
  const [milestoneInProgress, setMilestoneInProgress] = useState(false);
  const [isAnyProcessing, setIsAnyProcessing] = useState(false);
  const [frozenPokemon, setFrozenPokemon] = useState<number[]>([]);
  
  // Add initialization ref to prevent multiple battle starts
  const initialBattleStartedRef = useRef(false);
  const processingRef = useRef(false);

  console.log(`🔧 [BATTLE_STATE_CORE_ULTRA_DEBUG] Hook state initialized, calling battleStarter and refinementQueue hooks`);

  const { battleStarter, areBattlesIdentical } = useBattleStarterCore(allPokemon, finalRankings as RankedPokemon[]);
  const refinementQueue = useSharedRefinementQueue();

  console.log(`🔧 [BATTLE_STATE_CORE_ULTRA_DEBUG] battleStarter exists: ${!!battleStarter}, refinementQueue exists: ${!!refinementQueue}`);
  console.log(`🔧 [BATTLE_STATE_CORE_ULTRA_DEBUG] refinementQueue.refinementBattleCount: ${refinementQueue.refinementBattleCount}`);

  // CRITICAL FIX: Listen for validation battle results and update rankings
  useEffect(() => {
    console.log(`🔧 [BATTLE_STATE_CORE_ULTRA_DEBUG] Setting up validation battle listener`);
    
    const handleValidationBattleCompleted = (event: CustomEvent) => {
      const { primaryPokemonId, opponentPokemonId, primaryWon, battleDetails } = event.detail;
      console.log(`🏆 [VALIDATION_HANDLER_ULTRA_DEBUG] ===== VALIDATION RESULT RECEIVED =====`);
      console.log(`🏆 [VALIDATION_HANDLER_ULTRA_DEBUG] Primary Pokemon: ${primaryPokemonId}, Opponent: ${opponentPokemonId}, Primary Won: ${primaryWon}`);
      console.log(`🏆 [VALIDATION_HANDLER_ULTRA_DEBUG] Battle details:`, battleDetails);
      
      setFinalRankings(prev => {
        console.log(`🏆 [VALIDATION_HANDLER_ULTRA_DEBUG] Current rankings before update (length: ${prev.length}):`, prev.map((p, i) => `${i+1}. ${p.name} (${p.id})`));
        
        const currentRankings = [...prev];
        const primaryIndex = currentRankings.findIndex(p => p.id === primaryPokemonId);
        const opponentIndex = currentRankings.findIndex(p => p.id === opponentPokemonId);
        
        console.log(`🏆 [VALIDATION_HANDLER_ULTRA_DEBUG] Primary index: ${primaryIndex}, Opponent index: ${opponentIndex}`);
        
        if (primaryIndex === -1 || opponentIndex === -1) {
          console.warn(`🏆 [VALIDATION_HANDLER_ULTRA_DEBUG] Could not find Pokemon in rankings: primary=${primaryIndex}, opponent=${opponentIndex}`);
          return prev;
        }
        
        console.log(`🏆 [VALIDATION_HANDLER_ULTRA_DEBUG] Current positions - Primary: ${primaryIndex + 1}, Opponent: ${opponentIndex + 1}`);
        
        let rankingChanged = false;
        
        // If the primary Pokemon won and it's ranked lower (higher index), swap them
        if (primaryWon && primaryIndex > opponentIndex) {
          console.log(`🏆 [VALIDATION_HANDLER_ULTRA_DEBUG] Primary won and was ranked lower - promoting from ${primaryIndex + 1} to ${opponentIndex + 1}`);
          const temp = currentRankings[primaryIndex];
          currentRankings[primaryIndex] = currentRankings[opponentIndex];
          currentRankings[opponentIndex] = temp;
          rankingChanged = true;
        }
        // If the primary Pokemon lost and it's ranked higher (lower index), swap them  
        else if (!primaryWon && primaryIndex < opponentIndex) {
          console.log(`🏆 [VALIDATION_HANDLER_ULTRA_DEBUG] Primary lost and was ranked higher - demoting from ${primaryIndex + 1} to ${opponentIndex + 1}`);
          const temp = currentRankings[primaryIndex];
          currentRankings[primaryIndex] = currentRankings[opponentIndex];
          currentRankings[opponentIndex] = temp;
          rankingChanged = true;
        } else {
          console.log(`🏆 [VALIDATION_HANDLER_ULTRA_DEBUG] No ranking change needed - result confirms current positions`);
        }
        
        if (rankingChanged) {
          console.log(`🏆 [VALIDATION_HANDLER_ULTRA_DEBUG] ✅ RANKINGS UPDATED`);
          console.log(`🏆 [VALIDATION_HANDLER_ULTRA_DEBUG] New rankings (top 10):`, currentRankings.slice(0, 10).map((p, i) => `${i+1}. ${p.name} (${p.id})`));
        } else {
          console.log(`🏆 [VALIDATION_HANDLER_ULTRA_DEBUG] ❌ No ranking changes made`);
        }
        
        console.log(`🏆 [VALIDATION_HANDLER_ULTRA_DEBUG] ===== VALIDATION RESULT PROCESSED =====`);
        return currentRankings;
      });
    };
    
    document.addEventListener('validation-battle-completed', handleValidationBattleCompleted as EventListener);
    
    return () => {
      document.removeEventListener('validation-battle-completed', handleValidationBattleCompleted as EventListener);
    };
  }, []);

  // CRITICAL FIX: Start initial battle when Pokemon are available - with stable dependencies
  useEffect(() => {
    console.log(`🚀 [BATTLE_INIT_ULTRA_DEBUG] Pokemon data check: ${allPokemon?.length || 0} Pokemon available, currentBattle: ${currentBattle?.length || 0}, initialStarted: ${initialBattleStartedRef.current}`);
    
    if (allPokemon && allPokemon.length > 0 && !initialBattleStartedRef.current && (!currentBattle || currentBattle.length === 0)) {
      console.log(`🚀 [BATTLE_INIT_ULTRA_DEBUG] Starting initial battle with ${allPokemon.length} Pokemon`);
      initialBattleStartedRef.current = true;
      
      // Start initial battle immediately without delay
      if (battleStarter && battleStarter.startNewBattle) {
        console.log(`🚀 [BATTLE_INIT_ULTRA_DEBUG] Calling battleStarter.startNewBattle`);
        const initialBattle = battleStarter.startNewBattle(battleType);
        if (initialBattle && initialBattle.length > 0) {
          console.log(`✅ [BATTLE_INIT_ULTRA_DEBUG] Initial battle created:`, initialBattle.map(p => p.name).join(' vs '));
          setCurrentBattle(initialBattle);
          setSelectedPokemon([]);
        } else {
          console.error(`❌ [BATTLE_INIT_ULTRA_DEBUG] Failed to create initial battle`);
        }
      } else {
        console.error(`❌ [BATTLE_INIT_ULTRA_DEBUG] battleStarter not available`);
      }
    }
  }, [allPokemon.length, battleType]);

  // CRITICAL FIX: Auto-complete pairs battles when 1 Pokemon is selected
  useEffect(() => {
    console.log(`🎯 [AUTO_COMPLETE_ULTRA_DEBUG] Selection changed:`, {
      selectedPokemon,
      selectedCount: selectedPokemon.length,
      battleType,
      isProcessing: isAnyProcessing || isProcessingResult
    });

    if (battleType === "pairs" && selectedPokemon.length === 1 && !isAnyProcessing && !isProcessingResult && !processingRef.current) {
      console.log(`🎯 [AUTO_COMPLETE_ULTRA_DEBUG] Auto-completing pairs battle with selection:`, selectedPokemon[0]);
      handleTripletSelectionComplete();
    }
  }, [selectedPokemon, battleType, isAnyProcessing, isProcessingResult]);

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
    console.log(`🎯 [POKEMON_SELECT_ULTRA_DEBUG] Pokemon ${id} selected. Current selections:`, selectedPokemon);
    
    setSelectedPokemon(prev => {
      if (prev.includes(id)) {
        console.log(`🎯 [POKEMON_SELECT_ULTRA_DEBUG] Deselecting Pokemon ${id}`);
        return prev.filter(pokemonId => pokemonId !== id);
      } else {
        const newSelection = [...prev, id];
        console.log(`🎯 [POKEMON_SELECT_ULTRA_DEBUG] Adding Pokemon ${id}. New selection:`, newSelection);
        return newSelection;
      }
    });
  }, [selectedPokemon]);

  // CRITICAL FIX: Generate basic rankings when milestone is hit
  const generateBasicRankings = useCallback(() => {
    console.log(`🏆 [MILESTONE_RANKINGS_ULTRA_DEBUG] Generating basic rankings for milestone display`);
    
    // Calculate basic rankings based on battle results
    const pokemonScores: { [id: number]: { wins: number, total: number, pokemon: Pokemon } } = {};
    
    // Initialize all Pokemon with 0 scores
    allPokemon.forEach(pokemon => {
      pokemonScores[pokemon.id] = { wins: 0, total: 0, pokemon };
    });
    
    // Calculate scores from battle results
    battleResults.forEach(result => {
      result.pokemonIds.forEach(pokemonId => {
        if (pokemonScores[pokemonId]) {
          pokemonScores[pokemonId].total++;
          if (result.selectedPokemonIds.includes(pokemonId)) {
            pokemonScores[pokemonId].wins++;
          }
        }
      });
    });
    
    // Convert to ranked list
    const rankings = Object.values(pokemonScores)
      .filter(score => score.total > 0) // Only include Pokemon that have been in battles
      .map(score => ({
        ...score.pokemon,
        winRate: score.total > 0 ? score.wins / score.total : 0,
        battleCount: score.total
      }))
      .sort((a, b) => {
        // Sort by win rate, then by battle count
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        return b.battleCount - a.battleCount;
      });
    
    console.log(`🏆 [MILESTONE_RANKINGS_ULTRA_DEBUG] Generated ${rankings.length} rankings`);
    console.log(`🏆 [MILESTONE_RANKINGS_ULTRA_DEBUG] Top 5:`, rankings.slice(0, 5).map(p => `${p.name} (${(p.winRate * 100).toFixed(1)}%)`));
    
    setFinalRankings(rankings);
    setRankingGenerated(true);
    
    return rankings;
  }, [allPokemon, battleResults]);

  const originalProcessBattleResult = useCallback((
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    selectedGeneration: number
  ) => {
    console.log(`🔄 [BATTLE_PROCESSING_ULTRA_DEBUG] Processing battle result:`, {
      selectedIds: selectedPokemonIds,
      battlePokemon: currentBattlePokemon.map(p => p.name),
      battleType
    });

    // SPEED FIX: Process immediately without delays
    const selected = selectedPokemonIds.sort((a, b) => a - b);
    setBattleHistory(prev => [...prev, { battle: currentBattlePokemon, selected }]);

    const newBattlesCompleted = battlesCompleted + 1;
    setBattlesCompleted(newBattlesCompleted);
    localStorage.setItem('pokemon-battle-count', String(newBattlesCompleted));

    const newBattleResult: SingleBattle = {
      battleType,
      generation: selectedGeneration,
      pokemonIds: currentBattlePokemon.map(p => p.id),
      selectedPokemonIds: selectedPokemonIds,
      timestamp: new Date().toISOString()
    };

    setBattleResults(prev => [...prev, newBattleResult]);

    // CRITICAL FIX: Check if new battles completed hits a milestone from the milestones array
    const isAtMilestone = milestones.includes(newBattlesCompleted);
    console.log(`🎯 [MILESTONE_CHECK_ULTRA_DEBUG] Battle ${newBattlesCompleted} completed. Is milestone? ${isAtMilestone}. Milestones: ${milestones.join(', ')}`);
    
    if (isAtMilestone) {
      console.log(`🏆 [MILESTONE_HIT_ULTRA_DEBUG] Milestone ${newBattlesCompleted} reached!`);
      
      // CRITICAL FIX: Generate rankings when milestone is hit
      generateBasicRankings();
      
      setMilestoneInProgress(true);
      setShowingMilestone(true);
    }

    setSelectedPokemon([]);
    console.log(`✅ [BATTLE_PROCESSING_ULTRA_DEBUG] Battle result processed successfully`);
    return Promise.resolve();
  }, [battlesCompleted, milestones, generateBasicRankings]);

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
    const expectedCount = battleType === "pairs" ? 1 : 2;
    console.log(`🔄 [SELECTION_COMPLETE_ULTRA_DEBUG] handleTripletSelectionComplete called:`, {
      selectedCount: selectedPokemon.length,
      expectedCount,
      battleType,
      selectedPokemon,
      isProcessing: isAnyProcessing,
      isProcessingResult,
      processingRef: processingRef.current
    });

    if (selectedPokemon.length !== expectedCount) {
      console.warn(`❌ [SELECTION_COMPLETE_ULTRA_DEBUG] Incorrect number of Pokémon selected: ${selectedPokemon.length}, expected: ${expectedCount}`);
      return;
    }

    if (isAnyProcessing || isProcessingResult || processingRef.current) {
      console.warn(`❌ [SELECTION_COMPLETE_ULTRA_DEBUG] Already processing, ignoring duplicate call`);
      return;
    }

    console.log(`✅ [SELECTION_COMPLETE_ULTRA_DEBUG] Starting battle processing...`);
    processingRef.current = true;
    setIsBattleTransitioning(true);
    setIsAnyProcessing(true);

    try {
      await processBattleResultWithRefinement(
        selectedPokemon,
        currentBattle,
        battleType,
        selectedGeneration
      );

      console.log(`✅ [SELECTION_COMPLETE_ULTRA_DEBUG] Battle processed, starting new battle...`);
      
      // SPEED FIX: Start new battle immediately without delay
      processingRef.current = false;
      setIsBattleTransitioning(false);
      setIsAnyProcessing(false);
      startNewBattle();
    } catch (error) {
      console.error("❌ [SELECTION_COMPLETE_ULTRA_DEBUG] Error processing battle result:", error);
      processingRef.current = false;
      setIsBattleTransitioning(false);
      setIsAnyProcessing(false);
    }
  }, [selectedPokemon, currentBattle, battleType, selectedGeneration, processBattleResultWithRefinement, isAnyProcessing, isProcessingResult]);

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
    console.log(`🚀 [START_NEW_BATTLE_ULTRA_DEBUG] ===== START NEW BATTLE =====`);
    console.log(`🚀 [START_NEW_BATTLE_ULTRA_DEBUG] Called with battleStarter available: ${!!battleStarter}`);
    console.log(`🚀 [START_NEW_BATTLE_ULTRA_DEBUG] Refinement queue size: ${refinementQueue.refinementBattleCount}`);
    console.log(`🚀 [START_NEW_BATTLE_ULTRA_DEBUG] Refinement queue contents:`, refinementQueue.refinementQueue);
    
    if (!battleStarter || !battleStarter.startNewBattle) {
      console.error(`❌ [START_NEW_BATTLE_ULTRA_DEBUG] battleStarter not available`);
      return;
    }
    
    // CRITICAL FIX: Check for refinement battles first
    const nextRefinement = refinementQueue.getNextRefinementBattle();
    
    if (nextRefinement) {
      console.log(`⚔️ [REFINEMENT_BATTLE_ULTRA_DEBUG] Found pending refinement battle: ${nextRefinement.primaryPokemonId} vs ${nextRefinement.opponentPokemonId}`);
      console.log(`⚔️ [REFINEMENT_BATTLE_ULTRA_DEBUG] Reason: ${nextRefinement.reason}`);
      
      const primary = allPokemon.find(p => p.id === nextRefinement.primaryPokemonId);
      const opponent = allPokemon.find(p => p.id === nextRefinement.opponentPokemonId);

      console.log(`⚔️ [REFINEMENT_BATTLE_ULTRA_DEBUG] Primary found: ${!!primary} (${primary?.name})`);
      console.log(`⚔️ [REFINEMENT_BATTLE_ULTRA_DEBUG] Opponent found: ${!!opponent} (${opponent?.name})`);

      if (primary && opponent) {
        const refinementBattle = [primary, opponent];
        console.log(`⚔️ [REFINEMENT_BATTLE_ULTRA_DEBUG] ✅ Successfully created refinement battle: ${primary.name} vs ${opponent.name}`);
        setCurrentBattle(refinementBattle);
        setSelectedPokemon([]);
        console.log(`⚔️ [REFINEMENT_BATTLE_ULTRA_DEBUG] ✅ Refinement battle set as current battle`);
        console.log(`🚀 [START_NEW_BATTLE_ULTRA_DEBUG] ===== END (REFINEMENT BATTLE) =====`);
        return;
      } else {
        console.warn(`⚔️ [REFINEMENT_BATTLE_ULTRA_DEBUG] Could not find Pokemon for refinement battle:`, nextRefinement);
        // Pop the invalid battle and continue with regular generation
        console.log(`⚔️ [REFINEMENT_BATTLE_ULTRA_DEBUG] Popping invalid refinement battle`);
        refinementQueue.popRefinementBattle();
      }
    } else {
      console.log(`🚀 [START_NEW_BATTLE_ULTRA_DEBUG] No refinement battles in queue`);
    }
    
    // No refinement battles or invalid battle, proceed with normal generation
    console.log(`🎮 [START_NEW_BATTLE_ULTRA_DEBUG] No valid refinement battles, proceeding with regular generation`);
    const newBattle = battleStarter.startNewBattle(battleType);
    console.log(`🚀 [START_NEW_BATTLE_ULTRA_DEBUG] Generated regular battle:`, newBattle?.map(p => p.name).join(' vs ') || 'None');
    
    if (newBattle && newBattle.length > 0) {
      setCurrentBattle(newBattle);
      setSelectedPokemon([]);
      console.log(`✅ [START_NEW_BATTLE_ULTRA_DEBUG] New regular battle set successfully`);
    } else {
      console.error(`❌ [START_NEW_BATTLE_ULTRA_DEBUG] Failed to generate battle`);
    }
    
    console.log(`🚀 [START_NEW_BATTLE_ULTRA_DEBUG] ===== END =====`);
  }, [battleType, battleStarter, refinementQueue, allPokemon]);

  const generateRankings = useCallback(() => {
    generateBasicRankings();
  }, [generateBasicRankings]);

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
    initialBattleStartedRef.current = false;
    processingRef.current = false;
    startNewBattle();
  }, [startNewBattle, clearAllSuggestions, clearRefinementQueue]);

  console.log(`🔧 [BATTLE_STATE_CORE_ULTRA_DEBUG] useBattleStateCore returning state object`);

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
