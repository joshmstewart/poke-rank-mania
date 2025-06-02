
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

  // DEBUGGING: Log milestone array source and battle count on every render
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG] ===== MILESTONE DETECTION DEBUG =====`);
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG] Current battles: ${battlesCompleted}`);
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG] Milestones from props:`, milestones);
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG] Is ${battlesCompleted} a milestone?`, milestones.includes(battlesCompleted));
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG] showingMilestone:`, showingMilestone);
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG] milestoneInProgress:`, milestoneInProgress);
  console.log(`🚨🚨🚨 [MILESTONE_DEBUG] ======================================`);

  // Use the milestones array passed in from props (from the store/state)
  useEffect(() => {
    console.log(`🎯 [MILESTONE_CHECK] Checking for milestone at battle ${battlesCompleted}`);
    console.log(`🎯 [MILESTONE_CHECK] Available milestones:`, milestones);
    
    // Only trigger if we're exactly at a milestone from the props array
    const isMilestone = milestones.includes(battlesCompleted);
    
    if (isMilestone && !showingMilestone && !milestoneInProgress) {
      console.log(`🎯 [MILESTONE_CHECK] ✅ VALID MILESTONE: Battle ${battlesCompleted} is a milestone!`);
      console.log(`🎯 [MILESTONE_CHECK] ✅ Triggering milestone view...`);
      
      setMilestoneInProgress(true);
      setShowingMilestone(true);
      setRankingGenerated(true);
    } else if (isMilestone) {
      console.log(`🎯 [MILESTONE_CHECK] ⚠️ Valid milestone ${battlesCompleted} but already showing or in progress`);
    } else {
      console.log(`🎯 [MILESTONE_CHECK] ✅ Battle ${battlesCompleted} is NOT a milestone - correctly skipping`);
    }
  }, [battlesCompleted, milestones, showingMilestone, milestoneInProgress, setMilestoneInProgress, setShowingMilestone, setRankingGenerated]);

  // Enhanced milestone checking that uses the props milestone array
  const checkAndTriggerMilestone = useCallback((newBattlesCompleted: number) => {
    console.log(`🎯 [MILESTONE_CHECK_CALLBACK] Checking milestone for battle ${newBattlesCompleted}`);
    console.log(`🎯 [MILESTONE_CHECK_CALLBACK] Milestones from props: ${milestones.join(', ')}`);
    
    // Use the milestones array from props
    const isMilestone = milestones.includes(newBattlesCompleted);
    console.log(`🎯 [MILESTONE_CHECK_CALLBACK] Is exactly at milestone? ${isMilestone}`);
    
    if (isMilestone && !showingMilestone && !milestoneInProgress) {
      console.log(`🎯 [MILESTONE_CHECK_CALLBACK] ✅ Triggering valid milestone ${newBattlesCompleted}`);
      setMilestoneInProgress(true);
      setShowingMilestone(true);
      setRankingGenerated(true);
      return true;
    }
    
    if (!isMilestone) {
      console.log(`🎯 [MILESTONE_CHECK_CALLBACK] ✅ Battle ${newBattlesCompleted} is NOT a milestone - correctly skipping`);
    }
    
    return false;
  }, [milestones, showingMilestone, milestoneInProgress, setMilestoneInProgress, setShowingMilestone, setRankingGenerated]);

  // Enhanced process battle result function with props milestone detection
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

    // Use props milestone checking
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
