
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

  // STANDARD MILESTONES - Use this as the authoritative source
  const STANDARD_MILESTONES = [10, 25, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000];

  // DEBUGGING: Log milestone array and battle count on every render
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG] ===== MILESTONE DETECTION DEBUG =====`);
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG] Current battles: ${battlesCompleted}`);
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG] Standard milestones:`, STANDARD_MILESTONES);
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG] Passed milestones array:`, milestones);
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG] Are they the same?`, JSON.stringify(STANDARD_MILESTONES) === JSON.stringify(milestones));
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG] Is ${battlesCompleted} a standard milestone?`, STANDARD_MILESTONES.includes(battlesCompleted));
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG] showingMilestone:`, showingMilestone);
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG] milestoneInProgress:`, milestoneInProgress);
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG] ======================================`);

  // CRITICAL FIX: Only use standard milestones, ignore passed array if it's wrong
  useEffect(() => {
    console.log(`🎯 [MILESTONE_CHECK_FIXED] Checking for exact standard milestone match`);
    console.log(`🎯 [MILESTONE_CHECK_FIXED] Current battles: ${battlesCompleted}`);
    
    // ONLY trigger if we're exactly at a STANDARD milestone
    const isStandardMilestone = STANDARD_MILESTONES.includes(battlesCompleted);
    
    if (isStandardMilestone && !showingMilestone && !milestoneInProgress) {
      console.log(`🎯 [MILESTONE_CHECK_FIXED] ✅ VALID MILESTONE: Battle ${battlesCompleted} is a standard milestone!`);
      console.log(`🎯 [MILESTONE_CHECK_FIXED] ✅ Triggering milestone view...`);
      
      setMilestoneInProgress(true);
      setShowingMilestone(true);
      setRankingGenerated(true);
    } else if (isStandardMilestone) {
      console.log(`🎯 [MILESTONE_CHECK_FIXED] ⚠️ Valid milestone ${battlesCompleted} but already showing or in progress`);
    } else {
      console.log(`🎯 [MILESTONE_CHECK_FIXED] ✅ Battle ${battlesCompleted} is NOT a standard milestone - correctly skipping`);
    }
  }, [battlesCompleted, showingMilestone, milestoneInProgress, setMilestoneInProgress, setShowingMilestone, setRankingGenerated]);

  // Enhanced milestone checking that only triggers on standard milestone matches
  const checkAndTriggerMilestone = useCallback((newBattlesCompleted: number) => {
    console.log(`🎯 [MILESTONE_CHECK_STANDARD] Checking standard milestone for battle ${newBattlesCompleted}`);
    console.log(`🎯 [MILESTONE_CHECK_STANDARD] Standard milestones: ${STANDARD_MILESTONES.join(', ')}`);
    
    // CRITICAL FIX: Only trigger on standard milestone matches
    const isStandardMilestone = STANDARD_MILESTONES.includes(newBattlesCompleted);
    console.log(`🎯 [MILESTONE_CHECK_STANDARD] Is exactly at standard milestone? ${isStandardMilestone}`);
    
    if (isStandardMilestone && !showingMilestone && !milestoneInProgress) {
      console.log(`🎯 [MILESTONE_CHECK_STANDARD] ✅ Triggering valid milestone ${newBattlesCompleted}`);
      setMilestoneInProgress(true);
      setShowingMilestone(true);
      setRankingGenerated(true);
      return true;
    }
    
    if (!isStandardMilestone) {
      console.log(`🎯 [MILESTONE_CHECK_STANDARD] ✅ Battle ${newBattlesCompleted} is NOT a milestone - correctly skipping`);
    }
    
    return false;
  }, [showingMilestone, milestoneInProgress, setMilestoneInProgress, setShowingMilestone, setRankingGenerated]);

  // Enhanced process battle result function with standard milestone detection
  const originalProcessBattleResult = useCallback((
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    selectedGeneration: number
  ) => {
    console.log(`[MILESTONE_FIXED] Processing battle result - all ratings handled by centralized store`);
    console.log(`[MILESTONE_FIXED] Selected Pokemon: ${selectedPokemonIds}`);
    console.log(`[MILESTONE_FIXED] Current battles completed: ${battlesCompleted}`);

    // Store battle history for UI display (not for rating calculations)
    const selected = selectedPokemonIds.sort((a, b) => a - b);
    setBattleHistory(prev => {
      const newHistory = [...prev, { battle: currentBattlePokemon, selected }];
      console.log(`[MILESTONE_FIXED] Updated battle history length: ${newHistory.length}`);
      return newHistory;
    });

    // Increment battle counter
    const newBattlesCompleted = battlesCompleted + 1;
    console.log(`[MILESTONE_FIXED] New battles completed: ${newBattlesCompleted}`);
    
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
      console.log(`[MILESTONE_FIXED] Updated battle results length: ${newResults.length}`);
      return newResults;
    });

    // CRITICAL FIX: Use standard milestone checking
    const milestoneTriggered = checkAndTriggerMilestone(newBattlesCompleted);
    
    if (!milestoneTriggered) {
      // Only clear selection if no milestone was triggered
      setSelectedPokemon([]);
    }

    console.log(`[MILESTONE_FIXED] Battle processing complete. Milestone triggered: ${milestoneTriggered}`);
    return Promise.resolve();
  }, [battlesCompleted, checkAndTriggerMilestone, setSelectedPokemon, setBattleHistory, setBattlesCompleted, setBattleResults]);

  return {
    originalProcessBattleResult,
    checkAndTriggerMilestone
  };
};
