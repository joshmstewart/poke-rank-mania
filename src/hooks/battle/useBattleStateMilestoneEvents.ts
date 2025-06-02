
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

  // ENHANCED DEBUGGING: Log milestone array source and battle count on every render
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG_ENHANCED] ===== MILESTONE DETECTION DEBUG =====`);
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG_ENHANCED] Current battles: ${battlesCompleted}`);
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG_ENHANCED] Milestones from props (RAW):`, milestones);
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG_ENHANCED] Milestones array length:`, milestones?.length || 0);
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG_ENHANCED] Milestones array type:`, typeof milestones);
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG_ENHANCED] Milestones JSON:`, JSON.stringify(milestones));
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG_ENHANCED] Is ${battlesCompleted} a milestone?`, milestones?.includes(battlesCompleted));
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG_ENHANCED] showingMilestone:`, showingMilestone);
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG_ENHANCED] milestoneInProgress:`, milestoneInProgress);
  
  // Check if milestones is actually an array and what it contains
  if (Array.isArray(milestones)) {
    console.log(`🚨🚨🚨 [MILESTONE_DEBUG_ENHANCED] Milestones is valid array with items:`, milestones.map((m, i) => `[${i}]: ${m} (type: ${typeof m})`));
  } else {
    console.log(`🚨🚨🚨 [MILESTONE_DEBUG_ENHANCED] ❌ Milestones is NOT an array! Type:`, typeof milestones, 'Value:', milestones);
  }
  
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG_ENHANCED] ======================================`);

  // Use the milestones array passed in from props (from the store/state)
  useEffect(() => {
    console.log(`🎯 [MILESTONE_CHECK_ENHANCED] ===== MILESTONE EFFECT TRIGGERED =====`);
    console.log(`🎯 [MILESTONE_CHECK_ENHANCED] Checking for milestone at battle ${battlesCompleted}`);
    console.log(`🎯 [MILESTONE_CHECK_ENHANCED] Available milestones:`, milestones);
    console.log(`🎯 [MILESTONE_CHECK_ENHANCED] Current flags - showingMilestone: ${showingMilestone}, milestoneInProgress: ${milestoneInProgress}`);
    
    // Validate milestones array before proceeding
    if (!Array.isArray(milestones)) {
      console.log(`🎯 [MILESTONE_CHECK_ENHANCED] ❌ INVALID milestones array! Type: ${typeof milestones}, Value:`, milestones);
      return;
    }
    
    // Only trigger if we're exactly at a milestone from the props array
    const isMilestone = milestones.includes(battlesCompleted);
    console.log(`🎯 [MILESTONE_CHECK_ENHANCED] Is ${battlesCompleted} in milestones array? ${isMilestone}`);
    
    if (isMilestone && !showingMilestone && !milestoneInProgress) {
      console.log(`🎯 [MILESTONE_CHECK_ENHANCED] ✅ VALID MILESTONE TRIGGERED: Battle ${battlesCompleted} is a milestone!`);
      console.log(`🎯 [MILESTONE_CHECK_ENHANCED] ✅ Setting milestone flags...`);
      
      setMilestoneInProgress(true);
      setShowingMilestone(true);
      setRankingGenerated(true);
    } else if (isMilestone) {
      console.log(`🎯 [MILESTONE_CHECK_ENHANCED] ⚠️ Valid milestone ${battlesCompleted} but already showing (${showingMilestone}) or in progress (${milestoneInProgress})`);
    } else {
      console.log(`🎯 [MILESTONE_CHECK_ENHANCED] ✅ Battle ${battlesCompleted} is NOT a milestone - correctly skipping`);
    }
    
    console.log(`🎯 [MILESTONE_CHECK_ENHANCED] ===== END MILESTONE EFFECT =====`);
  }, [battlesCompleted, milestones, showingMilestone, milestoneInProgress, setMilestoneInProgress, setShowingMilestone, setRankingGenerated]);

  // Enhanced milestone checking that uses the props milestone array
  const checkAndTriggerMilestone = useCallback((newBattlesCompleted: number) => {
    console.log(`🎯 [MILESTONE_CHECK_CALLBACK_ENHANCED] ===== CALLBACK MILESTONE CHECK =====`);
    console.log(`🎯 [MILESTONE_CHECK_CALLBACK_ENHANCED] Checking milestone for battle ${newBattlesCompleted}`);
    console.log(`🎯 [MILESTONE_CHECK_CALLBACK_ENHANCED] Milestones from props: ${JSON.stringify(milestones)}`);
    
    if (!Array.isArray(milestones)) {
      console.log(`🎯 [MILESTONE_CHECK_CALLBACK_ENHANCED] ❌ Invalid milestones array in callback!`);
      return false;
    }
    
    // Use the milestones array from props
    const isMilestone = milestones.includes(newBattlesCompleted);
    console.log(`🎯 [MILESTONE_CHECK_CALLBACK_ENHANCED] Is exactly at milestone? ${isMilestone}`);
    
    if (isMilestone && !showingMilestone && !milestoneInProgress) {
      console.log(`🎯 [MILESTONE_CHECK_CALLBACK_ENHANCED] ✅ Triggering valid milestone ${newBattlesCompleted}`);
      setMilestoneInProgress(true);
      setShowingMilestone(true);
      setRankingGenerated(true);
      return true;
    }
    
    if (!isMilestone) {
      console.log(`🎯 [MILESTONE_CHECK_CALLBACK_ENHANCED] ✅ Battle ${newBattlesCompleted} is NOT a milestone - correctly skipping`);
    }
    
    console.log(`🎯 [MILESTONE_CHECK_CALLBACK_ENHANCED] ===== END CALLBACK CHECK =====`);
    return false;
  }, [milestones, showingMilestone, milestoneInProgress, setMilestoneInProgress, setShowingMilestone, setRankingGenerated]);

  // Enhanced process battle result function with props milestone detection
  const originalProcessBattleResult = useCallback((
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    selectedGeneration: number
  ) => {
    console.log(`[MILESTONE_FIXED_ENHANCED] ===== PROCESSING BATTLE RESULT =====`);
    console.log(`[MILESTONE_FIXED_ENHANCED] Processing battle result - all ratings handled by centralized store`);
    console.log(`[MILESTONE_FIXED_ENHANCED] Selected Pokemon: ${selectedPokemonIds}`);
    console.log(`[MILESTONE_FIXED_ENHANCED] Current battles completed: ${battlesCompleted}`);

    // Store battle history for UI display (not for rating calculations)
    const selected = selectedPokemonIds.sort((a, b) => a - b);
    setBattleHistory(prev => {
      const newHistory = [...prev, { battle: currentBattlePokemon, selected }];
      console.log(`[MILESTONE_FIXED_ENHANCED] Updated battle history length: ${newHistory.length}`);
      return newHistory;
    });

    // Increment battle counter
    const newBattlesCompleted = battlesCompleted + 1;
    console.log(`[MILESTONE_FIXED_ENHANCED] New battles completed: ${newBattlesCompleted}`);
    console.log(`[MILESTONE_FIXED_ENHANCED] Available milestones for check: ${JSON.stringify(milestones)}`);
    
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
      console.log(`[MILESTONE_FIXED_ENHANCED] Updated battle results length: ${newResults.length}`);
      return newResults;
    });

    // Use props milestone checking
    const milestoneTriggered = checkAndTriggerMilestone(newBattlesCompleted);
    console.log(`[MILESTONE_FIXED_ENHANCED] Milestone triggered: ${milestoneTriggered}`);
    
    if (!milestoneTriggered) {
      // Only clear selection if no milestone was triggered
      setSelectedPokemon([]);
    }

    console.log(`[MILESTONE_FIXED_ENHANCED] ===== BATTLE PROCESSING COMPLETE =====`);
    return Promise.resolve();
  }, [battlesCompleted, checkAndTriggerMilestone, setSelectedPokemon, setBattleHistory, setBattlesCompleted, setBattleResults, milestones]);

  return {
    originalProcessBattleResult,
    checkAndTriggerMilestone
  };
};
