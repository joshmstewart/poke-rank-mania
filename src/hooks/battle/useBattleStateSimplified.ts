
import { useState, useCallback, useEffect, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { useBattleStarterCore } from "./useBattleStarterCore";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";
import { useBattleMilestones } from "./useBattleMilestones";
import { useBattleRankings } from "./useBattleRankings";

export const useBattleStateSimplified = (
  allPokemon: Pokemon[],
  initialBattleType: BattleType,
  initialSelectedGeneration: number
) => {
  console.log(`🚀 [SIMPLIFIED] Battle state hook initializing with ${allPokemon.length} Pokemon`);
  
  // Core state - simplified to essentials only
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);
  const [battleType, setBattleType] = useState<BattleType>(initialBattleType);
  const [selectedGeneration, setSelectedGeneration] = useState(initialSelectedGeneration);
  const [battleResults, setBattleResults] = useState<SingleBattle[]>([]);
  const [battleHistory, setBattleHistory] = useState<{ battle: Pokemon[], selected: number[] }[]>([]);
  
  // CRITICAL FIX: Add real milestone state management
  const [showingMilestone, setShowingMilestone] = useState(false);
  const [rankingGenerated, setRankingGenerated] = useState(false);
  const [finalRankings, setFinalRankings] = useState(() => {
    return allPokemon.map(pokemon => ({
      ...pokemon,
      score: 0,
      count: 0,
      confidence: 0,
      wins: 0,
      losses: 0,
      winRate: 0
    }));
  });
  
  // TrueSkill integration - CRITICAL FIX: Get the increment function
  const { totalBattles, incrementTotalBattles } = useTrueSkillStore();
  
  // Refinement queue integration
  const refinementQueue = useSharedRefinementQueue();
  
  // CRITICAL FIX: Add milestone detection
  const { milestones, checkForMilestone } = useBattleMilestones();
  
  // CRITICAL FIX: Add real ranking generation for milestones
  const { generateRankingsFromBattleHistory } = useBattleRankings();
  
  // Simple battle creation - no complex orchestration
  const getCurrentRankings = useCallback(() => {
    console.log(`📊 [SIMPLIFIED_RANKINGS] Getting current rankings for milestone`);
    // CRITICAL FIX: Use real ranking generation instead of mock data
    const realRankings = generateRankingsFromBattleHistory(battleHistory);
    console.log(`📊 [SIMPLIFIED_RANKINGS] Generated ${realRankings.length} real rankings`);
    return realRankings;
  }, [generateRankingsFromBattleHistory, battleHistory]);
  
  const { startNewBattle: startNewBattleCore } = useBattleStarterCore(allPokemon, getCurrentRankings);
  
  // CRITICAL FIX: Completely rewritten battle creation with direct starred Pokemon handling
  const startNewBattle = useCallback((type: BattleType = battleType): Pokemon[] => {
    console.log(`🚀 [SIMPLIFIED] Starting new ${type} battle`);
    console.log(`🎯 [REFINEMENT_SIMPLIFIED] Checking refinement queue: ${refinementQueue.refinementBattleCount} battles`);
    
    if (!allPokemon || allPokemon.length < 2) {
      console.log(`🚀 [SIMPLIFIED] Not enough Pokemon for battle`);
      return [];
    }
    
    // CRITICAL FIX: Check for refinement battles first and get the actual starred Pokemon ID
    if (refinementQueue.hasRefinementBattles && refinementQueue.refinementBattleCount > 0) {
      console.log(`🎯 [REFINEMENT_SIMPLIFIED] Processing refinement battle`);
      
      const nextRefinement = refinementQueue.getNextRefinementBattle();
      if (nextRefinement && nextRefinement.primaryPokemonId !== -1) {
        console.log(`🎯 [REFINEMENT_SIMPLIFIED] Found starred Pokemon ID: ${nextRefinement.primaryPokemonId}`);
        
        // CRITICAL FIX: Use the starred Pokemon ID directly in battle core
        const config = {
          allPokemon,
          currentRankings: getCurrentRankings(),
          battleType: type,
          selectedGeneration: 0, // Don't filter by generation for starred Pokemon
          freezeList: []
        };
        
        const refinementBattle = startNewBattleCore(config, nextRefinement.primaryPokemonId);
        
        if (refinementBattle && refinementBattle.length >= 2) {
          console.log(`🎯 [REFINEMENT_SIMPLIFIED] ✅ SUCCESS! Created refinement battle: ${refinementBattle.map(p => `${p.name}(${p.id})`).join(' vs ')}`);
          
          setCurrentBattle(refinementBattle);
          setSelectedPokemon([]);
          
          // CRITICAL: Don't consume the refinement battle until it's actually completed
          // refinementQueue.popRefinementBattle(); // This will be called when battle is completed
          
          return refinementBattle;
        } else {
          console.warn(`🎯 [REFINEMENT_SIMPLIFIED] Failed to create refinement battle, removing from queue`);
          refinementQueue.popRefinementBattle();
          // Continue with regular battle generation
        }
      } else {
        console.warn(`🎯 [REFINEMENT_SIMPLIFIED] Invalid refinement battle data:`, nextRefinement);
        refinementQueue.popRefinementBattle();
      }
    }
    
    // Regular battle generation when no refinement battles
    console.log(`🎯 [REFINEMENT_SIMPLIFIED] No refinement battles, creating regular battle`);
    const config = {
      allPokemon,
      currentRankings: getCurrentRankings(),
      battleType: type,
      selectedGeneration: 0,
      freezeList: []
    };
    
    const result = startNewBattleCore(config);
    console.log(`🚀 [SIMPLIFIED] Regular battle created:`, result?.map(p => p.name).join(' vs ') || 'none');
    
    if (result && result.length > 0) {
      setCurrentBattle(result);
      setSelectedPokemon([]);
    }
    
    return result || [];
  }, [allPokemon, battleType, startNewBattleCore, getCurrentRankings, refinementQueue]);
  
  // Initialize first battle when Pokemon are available
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current && allPokemon.length >= 2 && currentBattle.length === 0) {
      console.log(`🚀 [SIMPLIFIED] Auto-starting initial battle`);
      startNewBattle();
      initializedRef.current = true;
    }
  }, [allPokemon.length, currentBattle.length, startNewBattle]);
  
  // CRITICAL FIX: Process battle results and increment counter + pop refinement battle + check for milestones
  const processBattleResult = useCallback((selectedPokemonIds: number[]) => {
    console.log(`🏆 [BATTLE_RESULT_FIX] Processing battle result with selected Pokemon:`, selectedPokemonIds);
    
    if (battleType === "pairs") {
      const winner = currentBattle.find(p => selectedPokemonIds.includes(p.id));
      const loser = currentBattle.find(p => !selectedPokemonIds.includes(p.id));
      
      if (winner && loser) {
        const battle: SingleBattle = {
          battleType,
          generation: selectedGeneration,
          pokemonIds: currentBattle.map(p => p.id),
          selectedPokemonIds,
          timestamp: new Date().toISOString(),
          winner,
          loser
        };
        
        console.log(`🏆 [BATTLE_RESULT_FIX] Created battle result:`, battle);
        
        setBattleResults(prev => [...prev, battle]);
        setBattleHistory(prev => [...prev, { battle: currentBattle, selected: selectedPokemonIds }]);
        
        // CRITICAL FIX: Increment the TrueSkill battle counter
        incrementTotalBattles();
        console.log(`🏆 [BATTLE_RESULT_FIX] ✅ Incremented total battles in TrueSkill store`);
        
        // CRITICAL FIX: Check for milestone after incrementing battles
        const newBattleCount = totalBattles + 1; // totalBattles hasn't updated yet, so add 1
        console.log(`🏆 [MILESTONE_CHECK] Checking milestone for battle count: ${newBattleCount}`);
        
        const isMilestone = checkForMilestone(newBattleCount);
        if (isMilestone) {
          console.log(`🏆 [MILESTONE_TRIGGERED] ✅ Milestone detected! Showing milestone view`);
          // CRITICAL FIX: Update rankings with real data before showing milestone
          const realRankings = getCurrentRankings();
          console.log(`🏆 [MILESTONE_TRIGGERED] Generated ${realRankings.length} real rankings for milestone`);
          setFinalRankings(realRankings);
          setRankingGenerated(true);
          setShowingMilestone(true);
        }
        
        // CRITICAL FIX: Pop refinement battle if this was a starred Pokemon battle
        if (refinementQueue.hasRefinementBattles) {
          const nextRefinement = refinementQueue.getNextRefinementBattle();
          if (nextRefinement && currentBattle.some(p => p.id === nextRefinement.primaryPokemonId)) {
            console.log(`🎯 [REFINEMENT_COMPLETION] This was a starred Pokemon battle, removing from queue`);
            refinementQueue.popRefinementBattle();
          }
        }
        
        return battle;
      }
    } else {
      // For triplets
      const winners = currentBattle.filter(p => selectedPokemonIds.includes(p.id));
      const loser = currentBattle.find(p => !selectedPokemonIds.includes(p.id));
      
      if (winners.length === 2 && loser) {
        const battle: SingleBattle = {
          battleType,
          generation: selectedGeneration,
          pokemonIds: currentBattle.map(p => p.id),
          selectedPokemonIds,
          timestamp: new Date().toISOString()
        };
        
        console.log(`🏆 [BATTLE_RESULT_FIX] Created triplet battle result:`, battle);
        
        setBattleResults(prev => [...prev, battle]);
        setBattleHistory(prev => [...prev, { battle: currentBattle, selected: selectedPokemonIds }]);
        
        // CRITICAL FIX: Increment the TrueSkill battle counter
        incrementTotalBattles();
        console.log(`🏆 [BATTLE_RESULT_FIX] ✅ Incremented total battles in TrueSkill store`);
        
        // CRITICAL FIX: Check for milestone after incrementing battles
        const newBattleCount = totalBattles + 1; // totalBattles hasn't updated yet, so add 1
        console.log(`🏆 [MILESTONE_CHECK] Checking milestone for battle count: ${newBattleCount}`);
        
        const isMilestone = checkForMilestone(newBattleCount);
        if (isMilestone) {
          console.log(`🏆 [MILESTONE_TRIGGERED] ✅ Milestone detected! Showing milestone view`);
          // CRITICAL FIX: Update rankings with real data before showing milestone
          const realRankings = getCurrentRankings();
          console.log(`🏆 [MILESTONE_TRIGGERED] Generated ${realRankings.length} real rankings for milestone`);
          setFinalRankings(realRankings);
          setRankingGenerated(true);
          setShowingMilestone(true);
        }
        
        return battle;
      }
    }
    
    return null;
  }, [currentBattle, battleType, selectedGeneration, incrementTotalBattles, refinementQueue, totalBattles, checkForMilestone, getCurrentRankings]);
  
  // Optimized handlers - no delays
  const handlePokemonSelect = useCallback((pokemonId: number) => {
    console.log(`🚀 [SIMPLIFIED] Pokemon selected: ${pokemonId}`);
    
    if (battleType === "pairs") {
      // For pairs, immediately process the selection
      const battleResult = processBattleResult([pokemonId]);
      
      if (battleResult) {
        // Only start next battle if not showing milestone
        if (!showingMilestone) {
          startNewBattle();
        }
      }
    } else {
      // For triplets, collect selections
      setSelectedPokemon(prev => {
        const newSelection = prev.includes(pokemonId) 
          ? prev.filter(id => id !== pokemonId)
          : [...prev, pokemonId];
        
        if (newSelection.length === 2) {
          // Process triplet selection
          const battleResult = processBattleResult(newSelection);
          
          if (battleResult) {
            // Only start next battle if not showing milestone
            if (!showingMilestone) {
              startNewBattle();
            }
          }
        }
        
        return newSelection;
      });
    }
  }, [battleType, processBattleResult, startNewBattle, showingMilestone]);
  
  const handleTripletSelectionComplete = useCallback(() => {
    // This is handled automatically in handlePokemonSelect
    console.log(`🚀 [SIMPLIFIED] Triplet selection complete`);
  }, []);
  
  // CRITICAL FIX: Add milestone continue handler
  const handleContinueBattles = useCallback(() => {
    console.log(`🏆 [MILESTONE_CONTINUE] Continuing battles from milestone view`);
    setShowingMilestone(false);
    setRankingGenerated(false);
    startNewBattle();
  }, [startNewBattle]);
  
  // Simple reset
  const performFullBattleReset = useCallback(() => {
    console.log(`🚀 [SIMPLIFIED] Performing full reset`);
    setCurrentBattle([]);
    setSelectedPokemon([]);
    setBattleResults([]);
    setBattleHistory([]);
    setShowingMilestone(false);
    setRankingGenerated(false);
    setFinalRankings(getCurrentRankings());
    initializedRef.current = false;
    
    // Restart immediately after reset - no delay
    if (allPokemon.length >= 2) {
      startNewBattle();
    }
  }, [allPokemon.length, startNewBattle, getCurrentRankings]);
  
  // Simple milestone reset function
  const resetMilestoneInProgress = useCallback(() => {
    console.log(`🚀 [SIMPLIFIED] Reset milestone in progress`);
    setShowingMilestone(false);
    setRankingGenerated(false);
  }, []);
  
  return {
    // State
    currentBattle,
    selectedPokemon,
    battleType,
    selectedGeneration,
    battleResults,
    battleHistory,
    battlesCompleted: totalBattles,
    
    // CRITICAL FIX: Real milestone state instead of hardcoded values
    showingMilestone,
    rankingGenerated,
    finalRankings,
    activeTier: 'all',
    milestones,
    isAnyProcessing: false,
    
    // Actions
    setBattleType,
    setSelectedGeneration,
    setShowingMilestone,
    setActiveTier: () => {},
    handlePokemonSelect,
    handleTripletSelectionComplete,
    goBack: () => {},
    handleContinueBattles,
    performFullBattleReset,
    handleSaveRankings: () => {},
    suggestRanking: () => {},
    removeSuggestion: () => {},
    resetMilestoneInProgress,
    handleManualReorder: () => {}
  };
};
