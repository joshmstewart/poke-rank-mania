
import { useEffect, useCallback } from "react";
import { DEFAULT_BATTLE_MILESTONES } from "@/utils/battleMilestones";
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
  generateRankings?: () => void; // Add this optional prop
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
  setBattleResults,
  generateRankings
}: MilestoneEventHookProps) => {

  // SUPER ENHANCED DEBUGGING: Log milestone array source and battle count on every render
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG_SUPER] ===== MILESTONE DETECTION DEBUG =====`);
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG_SUPER] Current battles: ${battlesCompleted}`);
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG_SUPER] Milestones from props (RAW):`, milestones);
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG_SUPER] Milestones array length:`, milestones?.length || 0);
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG_SUPER] Milestones array type:`, typeof milestones);
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG_SUPER] Milestones JSON:`, JSON.stringify(milestones));
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG_SUPER] Is ${battlesCompleted} a milestone?`, milestones?.includes(battlesCompleted));
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG_SUPER] showingMilestone:`, showingMilestone);
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG_SUPER] milestoneInProgress:`, milestoneInProgress);
  
  // MILESTONE INVESTIGATION: Check where milestones came from
  console.log(`🔍🔍🔍 [MILESTONE_INVESTIGATION] useBattleStateMilestoneEvents received milestones:`, milestones);
  console.log(`🔍🔍🔍 [MILESTONE_INVESTIGATION] Expected static milestones: ${JSON.stringify(DEFAULT_BATTLE_MILESTONES)}`);
  
  // Check if milestones contains unexpected values
  if (Array.isArray(milestones)) {
    const expectedMilestones = DEFAULT_BATTLE_MILESTONES;
    const hasUnexpectedMilestones = milestones.some(m => !expectedMilestones.includes(m));
    if (hasUnexpectedMilestones) {
      console.error(`🔍🔍🔍 [MILESTONE_INVESTIGATION] ❌ UNEXPECTED MILESTONES DETECTED!`);
      console.error(`🔍🔍🔍 [MILESTONE_INVESTIGATION] Expected:`, expectedMilestones);
      console.error(`🔍🔍🔍 [MILESTONE_INVESTIGATION] Actual:`, milestones);
      console.error(`🔍🔍🔍 [MILESTONE_INVESTIGATION] Unexpected values:`, milestones.filter(m => !expectedMilestones.includes(m)));
    }
    
    // Check for "every 10" pattern
    const every10Pattern = milestones.every((milestone, index) => {
      if (index === 0) return true;
      return milestone === milestones[index - 1] + 10;
    });
    if (every10Pattern && milestones.length > 3) {
      console.error(`🔍🔍🔍 [MILESTONE_INVESTIGATION] ❌ DETECTED "EVERY 10" PATTERN!`);
      console.error(`🔍🔍🔍 [MILESTONE_INVESTIGATION] This suggests dynamic milestone generation is overriding static milestones`);
    }
    
    console.log(`🔍🔍🔍 [MILESTONE_INVESTIGATION] Milestones analysis - hasUnexpected: ${hasUnexpectedMilestones}, isEvery10Pattern: ${every10Pattern}`);
  } else {
    console.error(`🔍🔍🔍 [MILESTONE_INVESTIGATION] ❌ Milestones is NOT an array! Type:`, typeof milestones, 'Value:', milestones);
  }
  
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG_SUPER] ======================================`);

  // Use the milestones array passed in from props (from the store/state)
  useEffect(() => {
    console.log(`🎯 [MILESTONE_CHECK_SUPER] ===== MILESTONE EFFECT TRIGGERED =====`);
    console.log(`🎯 [MILESTONE_CHECK_SUPER] Checking for milestone at battle ${battlesCompleted}`);
    console.log(`🎯 [MILESTONE_CHECK_SUPER] Available milestones:`, milestones);
    console.log(`🎯 [MILESTONE_CHECK_SUPER] Current flags - showingMilestone: ${showingMilestone}, milestoneInProgress: ${milestoneInProgress}`);
    
    // Validate milestones array before proceeding
    if (!Array.isArray(milestones)) {
      console.log(`🎯 [MILESTONE_CHECK_SUPER] ❌ INVALID milestones array! Type: ${typeof milestones}, Value:`, milestones);
      return;
    }
    
    // Only trigger if we're exactly at a milestone from the props array
    const isMilestone = milestones.includes(battlesCompleted);
    console.log(`🎯 [MILESTONE_CHECK_SUPER] Is ${battlesCompleted} in milestones array? ${isMilestone}`);
    
    if (isMilestone && !showingMilestone && !milestoneInProgress) {
      console.log(`🎯 [MILESTONE_CHECK_SUPER] ✅ VALID MILESTONE TRIGGERED: Battle ${battlesCompleted} is a milestone!`);
      console.log(`🎯 [MILESTONE_CHECK_SUPER] ✅ Generating rankings first, then setting milestone flags...`);
      
      // CRITICAL FIX: Generate rankings BEFORE setting milestone flags
      if (generateRankings) {
        console.log(`🎯 [MILESTONE_CHECK_SUPER] 🔧 Calling generateRankings function...`);
        generateRankings();
        console.log(`🎯 [MILESTONE_CHECK_SUPER] ✅ generateRankings completed`);
      } else {
        console.error(`🎯 [MILESTONE_CHECK_SUPER] ❌ generateRankings function not provided!`);
      }
      
      setMilestoneInProgress(true);
      setShowingMilestone(true);
      setRankingGenerated(true);
    } else if (isMilestone) {
      console.log(`🎯 [MILESTONE_CHECK_SUPER] ⚠️ Valid milestone ${battlesCompleted} but already showing (${showingMilestone}) or in progress (${milestoneInProgress})`);
    } else {
      console.log(`🎯 [MILESTONE_CHECK_SUPER] ✅ Battle ${battlesCompleted} is NOT a milestone - correctly skipping`);
    }
    
    console.log(`🎯 [MILESTONE_CHECK_SUPER] ===== END MILESTONE EFFECT =====`);
  }, [battlesCompleted, milestones, showingMilestone, milestoneInProgress, setMilestoneInProgress, setShowingMilestone, setRankingGenerated, generateRankings]);

  // Enhanced milestone checking that uses the props milestone array
  const checkAndTriggerMilestone = useCallback((newBattlesCompleted: number) => {
    console.log(`🎯 [MILESTONE_CHECK_CALLBACK_SUPER] ===== CALLBACK MILESTONE CHECK =====`);
    console.log(`🎯 [MILESTONE_CHECK_CALLBACK_SUPER] Checking milestone for battle ${newBattlesCompleted}`);
    console.log(`🎯 [MILESTONE_CHECK_CALLBACK_SUPER] Milestones from props: ${JSON.stringify(milestones)}`);
    
    if (!Array.isArray(milestones)) {
      console.log(`🎯 [MILESTONE_CHECK_CALLBACK_SUPER] ❌ Invalid milestones array in callback!`);
      return false;
    }
    
    // Use the milestones array from props
    const isMilestone = milestones.includes(newBattlesCompleted);
    console.log(`🎯 [MILESTONE_CHECK_CALLBACK_SUPER] Is exactly at milestone? ${isMilestone}`);
    
    if (isMilestone && !showingMilestone && !milestoneInProgress) {
      console.log(`🎯 [MILESTONE_CHECK_CALLBACK_SUPER] ✅ Triggering valid milestone ${newBattlesCompleted}`);
      
      // CRITICAL FIX: Generate rankings BEFORE setting milestone flags
      if (generateRankings) {
        console.log(`🎯 [MILESTONE_CHECK_CALLBACK_SUPER] 🔧 Calling generateRankings function...`);
        generateRankings();
        console.log(`🎯 [MILESTONE_CHECK_CALLBACK_SUPER] ✅ generateRankings completed`);
      } else {
        console.error(`🎯 [MILESTONE_CHECK_CALLBACK_SUPER] ❌ generateRankings function not provided!`);
      }
      
      setMilestoneInProgress(true);
      setShowingMilestone(true);
      setRankingGenerated(true);
      return true;
    }
    
    if (!isMilestone) {
      console.log(`🎯 [MILESTONE_CHECK_CALLBACK_SUPER] ✅ Battle ${newBattlesCompleted} is NOT a milestone - correctly skipping`);
    }
    
    console.log(`🎯 [MILESTONE_CHECK_CALLBACK_SUPER] ===== END CALLBACK CHECK =====`);
    return false;
  }, [milestones, showingMilestone, milestoneInProgress, setMilestoneInProgress, setShowingMilestone, setRankingGenerated, generateRankings]);

  // Enhanced process battle result function with props milestone detection
  const originalProcessBattleResult = useCallback((
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    selectedGeneration: number
  ) => {
    console.log(`[MILESTONE_FIXED_SUPER] ===== PROCESSING BATTLE RESULT =====`);
    console.log(`[MILESTONE_FIXED_SUPER] Processing battle result - all ratings handled by centralized store`);
    console.log(`[MILESTONE_FIXED_SUPER] Selected Pokemon: ${selectedPokemonIds}`);
    console.log(`[MILESTONE_FIXED_SUPER] Current battles completed: ${battlesCompleted}`);

    // Store battle history for UI display (not for rating calculations)
    const selected = selectedPokemonIds.sort((a, b) => a - b);
    setBattleHistory(prev => {
      const newHistory = [...prev, { battle: currentBattlePokemon, selected }];
      console.log(`[MILESTONE_FIXED_SUPER] Updated battle history length: ${newHistory.length}`);
      return newHistory;
    });

    // Increment battle counter
    const newBattlesCompleted = battlesCompleted + 1;
    console.log(`[MILESTONE_FIXED_SUPER] New battles completed: ${newBattlesCompleted}`);
    console.log(`[MILESTONE_FIXED_SUPER] Available milestones for check: ${JSON.stringify(milestones)}`);
    
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
      console.log(`[MILESTONE_FIXED_SUPER] Updated battle results length: ${newResults.length}`);
      return newResults;
    });

    // Use props milestone checking
    const milestoneTriggered = checkAndTriggerMilestone(newBattlesCompleted);
    console.log(`[MILESTONE_FIXED_SUPER] Milestone triggered: ${milestoneTriggered}`);
    
    if (!milestoneTriggered) {
      // Only clear selection if no milestone was triggered
      setSelectedPokemon([]);
    }

    console.log(`[MILESTONE_FIXED_SUPER] ===== BATTLE PROCESSING COMPLETE =====`);
    return Promise.resolve();
  }, [battlesCompleted, checkAndTriggerMilestone, setSelectedPokemon, setBattleHistory, setBattlesCompleted, setBattleResults, milestones]);

  return {
    originalProcessBattleResult,
    checkAndTriggerMilestone
  };
};
