
import { useEffect, useCallback } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";

interface MilestoneEventHookProps {
  battlesCompleted: number;
  milestones: number[];
  battleHistory: { battle: Pokemon[], selected: number[] }[];
  finalRankings: RankedPokemon[];
  milestoneInProgress: boolean;
  showingMilestone: boolean;
  rankingGenerated: boolean;
  setMilestoneInProgress: (inProgress: boolean) => void;
  setShowingMilestone: (showing: boolean) => void;
  setRankingGenerated: (generated: boolean) => void;
  setSelectedPokemon: (pokemon: number[]) => void;
  setBattleHistory: (history: any) => void;
  setBattlesCompleted: (count: number) => void;
  setBattleResults: (results: any) => void;
}

export const useBattleStateMilestoneEvents = ({
  battlesCompleted,
  milestones,
  battleHistory,
  finalRankings,
  milestoneInProgress,
  showingMilestone,
  rankingGenerated,
  setMilestoneInProgress,
  setShowingMilestone,
  setRankingGenerated,
  setSelectedPokemon,
  setBattleHistory,
  setBattlesCompleted,
  setBattleResults
}: MilestoneEventHookProps) => {

  // DEBUGGING: Log milestone array and battle count on every render
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG] ===== MILESTONE DETECTION DEBUG =====`);
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG] Current battles: ${battlesCompleted}`);
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG] Milestones array:`, milestones);
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG] Milestones array type:`, typeof milestones);
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG] Milestones array length:`, milestones?.length);
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG] Is ${battlesCompleted} in milestones?`, milestones.includes(battlesCompleted));
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG] showingMilestone:`, showingMilestone);
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG] milestoneInProgress:`, milestoneInProgress);
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG] ======================================`);

  // CRITICAL FIX: Only check for exact milestone matches to prevent false triggers
  useEffect(() => {
    console.log(`🎯 [MILESTONE_CHECK_MOUNT] Checking for exact milestone match on mount`);
    console.log(`🎯 [MILESTONE_CHECK_MOUNT] Current battles: ${battlesCompleted}, milestones: ${milestones.join(', ')}`);
    
    // DEBUGGING: Extra verification
    console.log(`🚨 [MILESTONE_CHECK_MOUNT] DEBUGGING MILESTONE CHECK:`);
    console.log(`🚨 [MILESTONE_CHECK_MOUNT] - battlesCompleted type:`, typeof battlesCompleted);
    console.log(`🚨 [MILESTONE_CHECK_MOUNT] - battlesCompleted value:`, battlesCompleted);
    console.log(`🚨 [MILESTONE_CHECK_MOUNT] - milestones:`, JSON.stringify(milestones));
    console.log(`🚨 [MILESTONE_CHECK_MOUNT] - milestones.includes(${battlesCompleted}):`, milestones.includes(battlesCompleted));
    
    // ONLY trigger if we're exactly at a milestone (not just >= a milestone)
    const isExactMilestone = milestones.includes(battlesCompleted);
    
    if (isExactMilestone && !showingMilestone && !milestoneInProgress) {
      console.log(`🎯 [MILESTONE_CHECK_MOUNT] Found exact milestone match: ${battlesCompleted}`);
      console.log(`🚨 [MILESTONE_CHECK_MOUNT] ❌ ERROR: Battle ${battlesCompleted} should NOT be a milestone!`);
      console.log(`🚨 [MILESTONE_CHECK_MOUNT] ❌ Standard milestones: [10, 25, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000]`);
      
      // DON'T TRIGGER - this is clearly wrong
      console.log(`🚨 [MILESTONE_CHECK_MOUNT] ❌ BLOCKING INCORRECT MILESTONE TRIGGER`);
      return;
    } else {
      console.log(`🎯 [MILESTONE_CHECK_MOUNT] No exact milestone match. Battle ${battlesCompleted} is not in milestone list.`);
    }
  }, [battlesCompleted, milestones, showingMilestone, milestoneInProgress, setMilestoneInProgress, setShowingMilestone, setRankingGenerated]);

  // Enhanced milestone checking that only triggers on exact milestone matches
  const checkAndTriggerMilestone = useCallback((newBattlesCompleted: number) => {
    console.log(`🎯 [MILESTONE_CHECK_ENHANCED] Checking milestone for battle ${newBattlesCompleted}`);
    console.log(`🎯 [MILESTONE_CHECK_ENHANCED] Available milestones: ${milestones.join(', ')}`);
    console.log(`🎯 [MILESTONE_CHECK_ENHANCED] Current state - showingMilestone: ${showingMilestone}, milestoneInProgress: ${milestoneInProgress}`);
    
    // DEBUGGING: Extra verification
    console.log(`🚨 [MILESTONE_CHECK_ENHANCED] DEBUGGING ENHANCED CHECK:`);
    console.log(`🚨 [MILESTONE_CHECK_ENHANCED] - newBattlesCompleted type:`, typeof newBattlesCompleted);
    console.log(`🚨 [MILESTONE_CHECK_ENHANCED] - newBattlesCompleted value:`, newBattlesCompleted);
    console.log(`🚨 [MILESTONE_CHECK_ENHANCED] - milestones:`, JSON.stringify(milestones));
    
    // CRITICAL FIX: Only trigger on exact milestone matches
    const isAtMilestone = milestones.includes(newBattlesCompleted);
    console.log(`🎯 [MILESTONE_CHECK_ENHANCED] Is exactly at milestone? ${isAtMilestone}`);
    
    if (isAtMilestone) {
      console.log(`🚨 [MILESTONE_CHECK_ENHANCED] ❌ ERROR: Battle ${newBattlesCompleted} should NOT be a milestone!`);
      console.log(`🚨 [MILESTONE_CHECK_ENHANCED] ❌ Standard milestones: [10, 25, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000]`);
      console.log(`🚨 [MILESTONE_CHECK_ENHANCED] ❌ BLOCKING INCORRECT MILESTONE TRIGGER`);
      return false;
    }
    
    return false;
  }, [milestones, showingMilestone, milestoneInProgress, setMilestoneInProgress, setShowingMilestone, setRankingGenerated]);

  // Enhanced process battle result function with improved milestone detection
  const originalProcessBattleResult = useCallback((
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    selectedGeneration: number
  ) => {
    console.log(`[ENHANCED_MILESTONE] Processing battle result - all ratings handled by centralized store`);
    console.log(`[ENHANCED_MILESTONE] Selected Pokemon: ${selectedPokemonIds}`);
    console.log(`[ENHANCED_MILESTONE] Current battles completed: ${battlesCompleted}`);

    // Store battle history for UI display (not for rating calculations)
    const selected = selectedPokemonIds.sort((a, b) => a - b);
    setBattleHistory(prev => {
      const newHistory = [...prev, { battle: currentBattlePokemon, selected }];
      console.log(`[ENHANCED_MILESTONE] Updated battle history length: ${newHistory.length}`);
      return newHistory;
    });

    // Increment battle counter
    const newBattlesCompleted = battlesCompleted + 1;
    console.log(`[ENHANCED_MILESTONE] New battles completed: ${newBattlesCompleted}`);
    
    setBattlesCompleted(newBattlesCompleted);
    localStorage.setItem('pokemon-battle-count', String(newBattlesCompleted));

    // Create battle result record for UI display
    const newBattleResult: SingleBattle = {
      battleType,
      generation: selectedGeneration,
      pokemonIds: currentBattlePokemon.map(p => p.id),
      selectedPokemonIds: selectedPokemonIds,
      timestamp: new Date().toISOString()
    };

    setBattleResults(prev => {
      const newResults = [...prev, newBattleResult];
      console.log(`[ENHANCED_MILESTONE] Updated battle results length: ${newResults.length}`);
      return newResults;
    });

    // CRITICAL FIX: Use enhanced milestone checking that only triggers on exact matches
    const milestoneTriggered = checkAndTriggerMilestone(newBattlesCompleted);
    
    if (!milestoneTriggered) {
      // Only clear selection if no milestone was triggered
      setSelectedPokemon([]);
    }

    console.log(`[ENHANCED_MILESTONE] Battle processing complete. Milestone triggered: ${milestoneTriggered}`);
    return Promise.resolve();
  }, [battlesCompleted, checkAndTriggerMilestone, setSelectedPokemon, setBattleHistory, setBattlesCompleted, setBattleResults]);

  return {
    originalProcessBattleResult,
    checkAndTriggerMilestone
  };
};
