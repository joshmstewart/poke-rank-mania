
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

  // Simplified process battle result function - no local rating calculations
  const originalProcessBattleResult = useCallback((
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    selectedGeneration: number
  ) => {
    console.log(`[CENTRALIZED_MILESTONE] Processing battle result - all ratings handled by centralized store`);
    console.log(`[CENTRALIZED_MILESTONE] Selected Pokemon: ${selectedPokemonIds}`);
    console.log(`[CENTRALIZED_MILESTONE] Current battles completed: ${battlesCompleted}`);

    // Store battle history for UI display (not for rating calculations)
    const selected = selectedPokemonIds.sort((a, b) => a - b);
    setBattleHistory(prev => {
      const newHistory = [...prev, { battle: currentBattlePokemon, selected }];
      console.log(`[CENTRALIZED_MILESTONE] Updated battle history length: ${newHistory.length}`);
      return newHistory;
    });

    // Increment battle counter
    const newBattlesCompleted = battlesCompleted + 1;
    console.log(`[CENTRALIZED_MILESTONE] New battles completed: ${newBattlesCompleted}`);
    
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
      console.log(`[CENTRALIZED_MILESTONE] Updated battle results length: ${newResults.length}`);
      return newResults;
    });

    // Check for milestone
    const isAtMilestone = milestones.includes(newBattlesCompleted);
    console.log(`[CENTRALIZED_MILESTONE] Checking milestone for battle ${newBattlesCompleted}: ${isAtMilestone}`);
    
    if (isAtMilestone) {
      console.log(`[CENTRALIZED_MILESTONE] ===== MILESTONE ${newBattlesCompleted} REACHED! =====`);
      console.log(`[CENTRALIZED_MILESTONE] Setting milestone flags and triggering ranking generation from centralized store`);
      
      setMilestoneInProgress(true);
      setShowingMilestone(true);
      setRankingGenerated(true);
      
      // Trigger ranking generation from centralized TrueSkill store
      setTimeout(() => {
        console.log(`[CENTRALIZED_MILESTONE] Generating rankings from centralized TrueSkill store...`);
        const generateRankingsEvent = new CustomEvent('generate-milestone-rankings', {
          detail: { 
            milestone: newBattlesCompleted,
            timestamp: Date.now()
          }
        });
        document.dispatchEvent(generateRankingsEvent);
      }, 100);
    }

    setSelectedPokemon([]);
    console.log(`[CENTRALIZED_MILESTONE] Battle processing complete`);
    return Promise.resolve();
  }, [battlesCompleted, milestones, battleHistory, setMilestoneInProgress, setShowingMilestone, setRankingGenerated, setSelectedPokemon, setBattleHistory, setBattlesCompleted, setBattleResults]);

  return {
    originalProcessBattleResult
  };
};
