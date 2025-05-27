
import { useCallback, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { toast } from "@/hooks/use-toast";

export const useBattleHandlers = (
  battleHistory: { battle: Pokemon[], selected: number[] }[],
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[], selected: number[] }[]>>,
  battleResults: any[],
  setBattleResults: React.Dispatch<React.SetStateAction<any[]>>,
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  battleType: BattleType,
  stableSetCurrentBattle: (battle: Pokemon[]) => void,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>,
  setShowingMilestone: (show: boolean) => void,
  enhancedStartNewBattle: (battleType: BattleType) => Pokemon[] | undefined,
  forceDismissMilestone: () => void,
  resetMilestoneInProgress: () => void,
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setIsTransitioning: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const continueBattlesRef = useRef(false);

  const goBack = useCallback(() => {
    const currentBattleCount = parseInt(localStorage.getItem('pokemon-battle-count') || '0', 10);
    console.log(`🔄 [BACK_FIX_ENHANCED] Battle #${currentBattleCount}: goBack called`);
    
    if (battleHistory.length === 0) {
      toast({
        title: "No previous battles",
        description: "There are no previous battles to return to."
      });
      return;
    }

    const newHistory = [...battleHistory];
    const lastBattle = newHistory.pop();
    setBattleHistory(newHistory);

    const newResults = [...battleResults];
    let resultsToRemove = 1;
    if (battleType === "triplets" && lastBattle) {
      const selectedCount = lastBattle.selected.length;
      const unselectedCount = lastBattle.battle.length - selectedCount;
      resultsToRemove = selectedCount * unselectedCount;
    }

    newResults.splice(newResults.length - resultsToRemove, resultsToRemove);
    setBattleResults(newResults);
    setBattlesCompleted(prev => Math.max(0, prev - 1));

    if (lastBattle) {
      console.log(`🔄 [BACK_FIX_ENHANCED] Battle #${currentBattleCount}: Restoring previous battle: ${lastBattle.battle.map(p => p.name).join(', ')}`);
      stableSetCurrentBattle(lastBattle.battle);
      setSelectedPokemon([]);
    }

    setShowingMilestone(false);
  }, [battleHistory, battleResults, battleType, setBattleHistory, setBattleResults, setBattlesCompleted, setSelectedPokemon, setShowingMilestone, stableSetCurrentBattle]);

  const handleContinueBattles = useCallback(() => {
    const currentBattleCount = parseInt(localStorage.getItem('pokemon-battle-count') || '0', 10);
    
    console.error(`🔥 [FINAL_FIX] Battle #${currentBattleCount + 1}: handleContinueBattles called`);
    
    if (continueBattlesRef.current) {
      console.error(`🔥 [FINAL_FIX] Battle #${currentBattleCount + 1}: Already processing, ignoring`);
      return;
    }
    
    continueBattlesRef.current = true;
    
    // CRITICAL FIX: Set transitioning FIRST to prevent old battle from showing
    console.error(`🔥 [FINAL_FIX] Battle #${currentBattleCount + 1}: Setting transition state FIRST`);
    setIsTransitioning(true);
    
    // Force a small delay to ensure transition state is set before clearing
    setTimeout(() => {
      // Clear battle and selections
      console.error(`🔥 [FINAL_FIX] Battle #${currentBattleCount + 1}: Clearing battle after transition set`);
      setCurrentBattle([]);
      setSelectedPokemon([]);
      
      // Dismiss milestone
      forceDismissMilestone();
      resetMilestoneInProgress();
      
      // Generate new battle
      console.error(`🔥 [FINAL_FIX] Battle #${currentBattleCount + 1}: Generating new battle`);
      const newBattle = enhancedStartNewBattle("pairs");
      
      if (newBattle && newBattle.length > 0) {
        console.error(`🔥 [FINAL_FIX] Battle #${currentBattleCount + 1}: Setting new battle: ${newBattle.map(p => p.name).join(' vs ')}`);
        setCurrentBattle(newBattle);
      } else {
        console.error(`🔥 [FINAL_FIX] Battle #${currentBattleCount + 1}: Failed to generate new battle`);
      }
      
      // Clear transition state
      setIsTransitioning(false);
      continueBattlesRef.current = false;
    }, 50);
    
  }, [forceDismissMilestone, enhancedStartNewBattle, resetMilestoneInProgress, setCurrentBattle, setSelectedPokemon, setIsTransitioning]);

  return {
    goBack,
    handleContinueBattles
  };
};
