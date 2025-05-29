
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

  // Enhanced process battle result function with milestone handling
  const originalProcessBattleResult = useCallback((
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    selectedGeneration: number
  ) => {
    console.log(`🚨🚨🚨 [CORE_BATTLE_PROCESSING_MEGA_DEBUG] ===== CORE PROCESSING BATTLE RESULT START =====`);
    console.log(`🚨🚨🚨 [CORE_BATTLE_PROCESSING_MEGA_DEBUG] Input data:`);
    console.log(`🚨🚨🚨 [CORE_BATTLE_PROCESSING_MEGA_DEBUG] - selectedPokemonIds:`, selectedPokemonIds);
    console.log(`🚨🚨🚨 [CORE_BATTLE_PROCESSING_MEGA_DEBUG] - currentBattlePokemon:`, currentBattlePokemon.map(p => `${p.name} (${p.id})`));
    console.log(`🚨🚨🚨 [CORE_BATTLE_PROCESSING_MEGA_DEBUG] - battleType: ${battleType}`);
    console.log(`🚨🚨🚨 [CORE_BATTLE_PROCESSING_MEGA_DEBUG] - CURRENT battles completed BEFORE increment: ${battlesCompleted}`);

    const selected = selectedPokemonIds.sort((a, b) => a - b);
    setBattleHistory(prev => {
      const newHistory = [...prev, { battle: currentBattlePokemon, selected }];
      console.log(`🚨🚨🚨 [CORE_BATTLE_PROCESSING_MEGA_DEBUG] Updated battle history length: ${newHistory.length}`);
      return newHistory;
    });

    const newBattlesCompleted = battlesCompleted + 1;
    console.log(`🚨🚨🚨 [CORE_BATTLE_PROCESSING_MEGA_DEBUG] NEW battles completed AFTER increment: ${newBattlesCompleted}`);
    console.log(`🚨🚨🚨 [CORE_BATTLE_PROCESSING_MEGA_DEBUG] Available milestones for checking: ${milestones.join(', ')}`);
    
    setBattlesCompleted(newBattlesCompleted);
    localStorage.setItem('pokemon-battle-count', String(newBattlesCompleted));

    const newBattleResult: SingleBattle = {
      battleType,
      generation: selectedGeneration,
      pokemonIds: currentBattlePokemon.map(p => p.id),
      selectedPokemonIds: selectedPokemonIds,
      timestamp: new Date().toISOString()
    };

    setBattleResults(prev => {
      const newResults = [...prev, newBattleResult];
      console.log(`🚨🚨🚨 [CORE_BATTLE_PROCESSING_MEGA_DEBUG] Updated battle results length: ${newResults.length}`);
      return newResults;
    });

    // Enhanced milestone checking with actual ranking generation
    const isAtMilestone = milestones.includes(newBattlesCompleted);
    console.log(`🚨🚨🚨 [CORE_MILESTONE_CHECK_MEGA_DEBUG] ===== CORE MILESTONE CHECK START =====`);
    console.log(`🚨🚨🚨 [CORE_MILESTONE_CHECK_MEGA_DEBUG] Battle ${newBattlesCompleted} completed`);
    console.log(`🚨🚨🚨 [CORE_MILESTONE_CHECK_MEGA_DEBUG] Available milestones array:`, milestones);
    console.log(`🚨🚨🚨 [CORE_MILESTONE_CHECK_MEGA_DEBUG] Checking if ${newBattlesCompleted} is in milestones array...`);
    console.log(`🚨🚨🚨 [CORE_MILESTONE_CHECK_MEGA_DEBUG] milestones.includes(${newBattlesCompleted}) = ${isAtMilestone}`);
    
    if (isAtMilestone) {
      console.log(`🚨🚨🚨 [CORE_MILESTONE_HIT_MEGA_DEBUG] ===== CORE MILESTONE ${newBattlesCompleted} REACHED! =====`);
      console.log(`🚨🚨🚨 [CORE_MILESTONE_HIT_MEGA_DEBUG] About to set milestone flags AND generate rankings...`);
      console.log(`🚨🚨🚨 [CORE_MILESTONE_HIT_MEGA_DEBUG] BEFORE: milestoneInProgress=${milestoneInProgress}, showingMilestone=${showingMilestone}, rankingGenerated=${rankingGenerated}`);
      
      setMilestoneInProgress(true);
      setShowingMilestone(true);
      setRankingGenerated(true);
      
      // Generate ranking event for milestone
      console.log(`🚨🚨🚨 [CORE_MILESTONE_HIT_MEGA_DEBUG] 🔥 CALLING GENERATE RANKINGS FOR MILESTONE 🔥`);
      console.log(`🚨🚨🚨 [CORE_MILESTONE_HIT_MEGA_DEBUG] Current battle history length: ${battleHistory.length + 1}`);
      
      setTimeout(() => {
        console.log(`🚨🚨🚨 [CORE_MILESTONE_GENERATION] Generating rankings with updated battle history...`);
        const generateRankingsEvent = new CustomEvent('generate-milestone-rankings', {
          detail: { 
            milestone: newBattlesCompleted,
            timestamp: Date.now()
          }
        });
        document.dispatchEvent(generateRankingsEvent);
      }, 100);
      
      console.log(`🚨🚨🚨 [CORE_MILESTONE_HIT_MEGA_DEBUG] AFTER setting flags - these should be true in the next render`);
      console.log(`🚨🚨🚨 [CORE_MILESTONE_HIT_MEGA_DEBUG] Current finalRankings length: ${finalRankings.length}`);
      
    } else {
      console.log(`🚨🚨🚨 [CORE_MILESTONE_CHECK_MEGA_DEBUG] No milestone hit for battle ${newBattlesCompleted}`);
    }
    
    console.log(`🚨🚨🚨 [CORE_MILESTONE_CHECK_MEGA_DEBUG] ===== CORE MILESTONE CHECK END =====`);

    setSelectedPokemon([]);
    console.log(`🚨🚨🚨 [CORE_BATTLE_PROCESSING_MEGA_DEBUG] ===== CORE PROCESSING BATTLE RESULT END =====`);
    return Promise.resolve();
  }, [battlesCompleted, milestones, finalRankings, milestoneInProgress, showingMilestone, rankingGenerated, battleHistory, setBattleHistory, setBattlesCompleted, setBattleResults, setSelectedPokemon, setMilestoneInProgress, setShowingMilestone, setRankingGenerated]);

  return {
    originalProcessBattleResult
  };
};
