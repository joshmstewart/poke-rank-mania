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
  
  // TrueSkill integration - CRITICAL FIX: Get all necessary functions
  const { totalBattles, incrementTotalBattles, smartSync, removePendingBattle } = useTrueSkillStore();
  
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
    console.log(`🚀🔧🔧🔧 [SIMPLIFIED_MEGA_FIX] Starting new ${type} battle`);
    console.log(`🎯🔧🔧🔧 [REFINEMENT_MEGA_FIX] Checking refinement queue: ${refinementQueue.refinementBattleCount} battles`);
    
    if (!allPokemon || allPokemon.length < 2) {
      console.log(`🚀🔧🔧🔧 [SIMPLIFIED_MEGA_FIX] Not enough Pokemon for battle`);
      return [];
    }
    
    // CRITICAL FIX: Check for refinement battles first and get the actual starred Pokemon ID
    if (refinementQueue.hasRefinementBattles && refinementQueue.refinementBattleCount > 0) {
      console.log(`🎯🔧🔧🔧 [REFINEMENT_MEGA_FIX] Processing refinement battle`);
      
      const nextRefinement = refinementQueue.getNextRefinementBattle();
      if (nextRefinement && nextRefinement.primaryPokemonId !== -1) {
        console.log(`🎯🔧🔧🔧 [REFINEMENT_MEGA_FIX] Found starred Pokemon ID: ${nextRefinement.primaryPokemonId}`);
        
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
          console.log(`🎯🔧🔧🔧 [REFINEMENT_MEGA_FIX] ✅ SUCCESS! Created refinement battle: ${refinementBattle.map(p => `${p.name}(${p.id})`).join(' vs ')}`);
          
          setCurrentBattle(refinementBattle);
          setSelectedPokemon([]);
          
          return refinementBattle;
        } else {
          console.warn(`🎯🔧🔧🔧 [REFINEMENT_MEGA_FIX] Failed to create refinement battle, removing from queue`);
          refinementQueue.popRefinementBattle();
          // Continue with regular battle generation
        }
      } else {
        console.warn(`🎯🔧🔧🔧 [REFINEMENT_MEGA_FIX] Invalid refinement battle data:`, nextRefinement);
        refinementQueue.popRefinementBattle();
      }
    }
    
    // Regular battle generation when no refinement battles
    console.log(`🎯🔧🔧🔧 [REFINEMENT_MEGA_FIX] No refinement battles, creating regular battle`);
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
  
  // CRITICAL FIX: Process battle results with proper persistence and debugging
  const processBattleResult = useCallback(async (selectedPokemonIds: number[]) => {
    console.log(`🏆🔧🔧🔧 [BATTLE_RESULT_MEGA_MEGA_FIX] ===== PROCESSING BATTLE RESULT =====`);
    console.log(`🏆🔧🔧🔧 [BATTLE_RESULT_MEGA_MEGA_FIX] Selected Pokemon IDs:`, selectedPokemonIds);
    console.log(`🏆🔧🔧🔧 [BATTLE_RESULT_MEGA_MEGA_FIX] Current battle:`, currentBattle.map(p => `${p.name}(${p.id})`));
    console.log(`🏆🔧🔧🔧 [BATTLE_RESULT_MEGA_MEGA_FIX] Battle type:`, battleType);
    
    if (battleType === "pairs") {
      const winner = currentBattle.find(p => selectedPokemonIds.includes(p.id));
      const loser = currentBattle.find(p => !selectedPokemonIds.includes(p.id));
      
      if (winner && loser) {
        console.log(`🏆🔧🔧🔧 [BATTLE_RESULT_MEGA_MEGA_FIX] Winner: ${winner.name}(${winner.id}), Loser: ${loser.name}(${loser.id})`);
        
        const battle: SingleBattle = {
          battleType,
          generation: selectedGeneration,
          pokemonIds: currentBattle.map(p => p.id),
          selectedPokemonIds,
          timestamp: new Date().toISOString(),
          winner,
          loser
        };
        
        setBattleResults(prev => [...prev, battle]);
        setBattleHistory(prev => [...prev, { battle: currentBattle, selected: selectedPokemonIds }]);
        
        // CRITICAL FIX: Increment the TrueSkill battle counter
        incrementTotalBattles();
        console.log(`🏆🔧🔧🔧 [BATTLE_RESULT_MEGA_MEGA_FIX] ✅ Incremented total battles in TrueSkill store`);
        
        // CRITICAL FIX: Check for milestone after incrementing battles
        const newBattleCount = totalBattles + 1; // totalBattles hasn't updated yet, so add 1
        console.log(`🏆🔧🔧🔧 [MILESTONE_CHECK] Checking milestone for battle count: ${newBattleCount}`);
        
        const isMilestone = checkForMilestone(newBattleCount);
        if (isMilestone) {
          console.log(`🏆🔧🔧🔧 [MILESTONE_TRIGGERED] ✅ Milestone detected! Showing milestone view`);
          // CRITICAL FIX: Update rankings with real data before showing milestone
          const realRankings = getCurrentRankings();
          console.log(`🏆🔧🔧🔧 [MILESTONE_TRIGGERED] Generated ${realRankings.length} real rankings for milestone`);
          setFinalRankings(realRankings);
          setRankingGenerated(true);
          setShowingMilestone(true);
        }
        
        // CRITICAL FIX: PROPERLY HANDLE PENDING POKEMON REMOVAL WITH DEBUGGING
        if (refinementQueue.hasRefinementBattles) {
          const nextRefinement = refinementQueue.getNextRefinementBattle();
          console.log(`🎯🔧🔧🔧 [PENDING_REMOVAL_MEGA_MEGA_FIX] Next refinement:`, nextRefinement);
          console.log(`🎯🔧🔧🔧 [PENDING_REMOVAL_MEGA_MEGA_FIX] Current battle Pokemon IDs:`, currentBattle.map(p => p.id));
          
          if (nextRefinement && currentBattle.some(p => p.id === nextRefinement.primaryPokemonId)) {
            const pokemonToRemove = nextRefinement.primaryPokemonId;
            console.log(`🎯🔧🔧🔧 [PENDING_REMOVAL_MEGA_MEGA_FIX] ===== REMOVING PENDING POKEMON ${pokemonToRemove} =====`);
            
            // CRITICAL FIX: Use async removal that ensures persistence
            try {
              console.log(`🎯🔧🔧🔧 [PENDING_REMOVAL_MEGA_MEGA_FIX] Step 1: Calling popRefinementBattle with await`);
              await refinementQueue.popRefinementBattle();
              console.log(`🎯🔧🔧🔧 [PENDING_REMOVAL_MEGA_MEGA_FIX] ✅ Pokemon ${pokemonToRemove} successfully removed from queue`);
            } catch (error) {
              console.error(`🎯🔧🔧🔧 [PENDING_REMOVAL_MEGA_MEGA_FIX] ❌ Failed to remove Pokemon ${pokemonToRemove}:`, error);
            }
          } else {
            console.log(`🎯🔧🔧🔧 [PENDING_REMOVAL_MEGA_MEGA_FIX] No matching pending Pokemon to remove`);
          }
        } else {
          console.log(`🎯🔧🔧🔧 [PENDING_REMOVAL_MEGA_MEGA_FIX] No refinement battles in queue`);
        }
        
        return battle;
      }
    } else {
      // CRITICAL FIX: Handle triplets with the same async removal logic
      const winners = currentBattle.filter(p => selectedPokemonIds.includes(p.id));
      const loser = currentBattle.find(p => !selectedPokemonIds.includes(p.id));
      
      if (winners.length === 2 && loser) {
        console.log(`🏆🔧🔧🔧 [BATTLE_RESULT_MEGA_MEGA_FIX] Triplet - Winners: ${winners.map(p => `${p.name}(${p.id})`).join(', ')}, Loser: ${loser.name}(${loser.id})`);
        
        const battle: SingleBattle = {
          battleType,
          generation: selectedGeneration,
          pokemonIds: currentBattle.map(p => p.id),
          selectedPokemonIds,
          timestamp: new Date().toISOString()
        };
        
        setBattleResults(prev => [...prev, battle]);
        setBattleHistory(prev => [...prev, { battle: currentBattle, selected: selectedPokemonIds }]);
        
        // CRITICAL FIX: Increment the TrueSkill battle counter
        incrementTotalBattles();
        console.log(`🏆🔧🔧🔧 [BATTLE_RESULT_MEGA_MEGA_FIX] ✅ Incremented total battles in TrueSkill store`);
        
        // CRITICAL FIX: Check for milestone after incrementing battles
        const newBattleCount = totalBattles + 1;
        console.log(`🏆🔧🔧🔧 [MILESTONE_CHECK] Checking milestone for battle count: ${newBattleCount}`);
        
        const isMilestone = checkForMilestone(newBattleCount);
        if (isMilestone) {
          console.log(`🏆🔧🔧🔧 [MILESTONE_TRIGGERED] ✅ Milestone detected! Showing milestone view`);
          const realRankings = getCurrentRankings();
          console.log(`🏆🔧🔧🔧 [MILESTONE_TRIGGERED] Generated ${realRankings.length} real rankings for milestone`);
          setFinalRankings(realRankings);
          setRankingGenerated(true);
          setShowingMilestone(true);
        }
        
        // CRITICAL FIX: Handle refinement battle completion with async persistence for triplets
        if (refinementQueue.hasRefinementBattles) {
          const nextRefinement = refinementQueue.getNextRefinementBattle();
          console.log(`🎯🔧🔧🔧 [PENDING_REMOVAL_MEGA_MEGA_FIX] Next refinement:`, nextRefinement);
          console.log(`🎯🔧🔧🔧 [PENDING_REMOVAL_MEGA_MEGA_FIX] Current battle Pokemon IDs:`, currentBattle.map(p => p.id));
          
          if (nextRefinement && currentBattle.some(p => p.id === nextRefinement.primaryPokemonId)) {
            const pokemonToRemove = nextRefinement.primaryPokemonId;
            console.log(`🎯🔧🔧🔧 [PENDING_REMOVAL_MEGA_MEGA_FIX] ===== REMOVING PENDING POKEMON ${pokemonToRemove} =====`);
            
            try {
              console.log(`🎯🔧🔧🔧 [PENDING_REMOVAL_MEGA_MEGA_FIX] Step 1: Calling popRefinementBattle with await`);
              await refinementQueue.popRefinementBattle();
              console.log(`🎯🔧🔧🔧 [PENDING_REMOVAL_MEGA_MEGA_FIX] ✅ Pokemon ${pokemonToRemove} successfully removed from queue`);
            } catch (error) {
              console.error(`🎯🔧🔧🔧 [PENDING_REMOVAL_MEGA_MEGA_FIX] ❌ Failed to remove Pokemon ${pokemonToRemove}:`, error);
            }
          } else {
            console.log(`🎯🔧🔧🔧 [PENDING_REMOVAL_MEGA_MEGA_FIX] No matching pending Pokemon to remove`);
          }
        } else {
          console.log(`🎯🔧🔧🔧 [PENDING_REMOVAL_MEGA_MEGA_FIX] No refinement battles in queue`);
        }
        
        return battle;
      }
    }
    
    console.log(`🏆🔧🔧🔧 [BATTLE_RESULT_MEGA_MEGA_FIX] ❌ Battle result processing failed - invalid selection`);
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
  
  // CRITICAL FIX: Fix the back button functionality
  const goBack = useCallback(() => {
    console.log(`🔙🔙🔙 [BACK_BUTTON_FIX] Back button clicked`);
    console.log(`🔙🔙🔙 [BACK_BUTTON_FIX] Battle history length: ${battleHistory.length}`);
    
    if (battleHistory.length === 0) {
      console.log(`🔙🔙🔙 [BACK_BUTTON_FIX] No history to go back to`);
      return;
    }

    // Go back to the previous battle
    const newHistory = [...battleHistory];
    const lastBattle = newHistory.pop();
    console.log(`🔙🔙🔙 [BACK_BUTTON_FIX] Restoring battle:`, lastBattle?.battle.map(p => p.name));
    
    setBattleHistory(newHistory);

    if (lastBattle) {
      setCurrentBattle(lastBattle.battle);
      setSelectedPokemon([]);
    }

    // Decrement battles completed
    console.log(`🔙🔙🔙 [BACK_BUTTON_FIX] Decrementing battle count`);
    // Note: We don't decrement totalBattles from TrueSkill store as that's persistent
  }, [battleHistory]);
  
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
    goBack,
    handleContinueBattles,
    performFullBattleReset,
    handleSaveRankings: () => {},
    suggestRanking: () => {},
    removeSuggestion: () => {},
    resetMilestoneInProgress,
    handleManualReorder: () => {}
  };
};
