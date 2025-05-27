
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
    
    console.error(`🔥 [CONTINUE_BATTLES_ENHANCED] Battle #${currentBattleCount + 1}: handleContinueBattles called`);
    
    // ENHANCED: Log battles 10-11 specifically
    if (currentBattleCount === 10) {
      console.error(`🔥 [BATTLE_10_11_CONTINUE] CRITICAL: Continue from battle 10 to 11 - THIS IS WHERE FLASHING HAPPENS!`);
    }
    
    if (continueBattlesRef.current) {
      console.error(`🔥 [CONTINUE_BATTLES_ENHANCED] Battle #${currentBattleCount + 1}: Already processing, ignoring`);
      return;
    }
    
    continueBattlesRef.current = true;
    
    console.error(`🔥 [FLASH_FIX_ENHANCED] Battle #${currentBattleCount + 1}: Setting transitioning state and clearing battle immediately`);
    setIsTransitioning(true);
    setCurrentBattle([]);
    setSelectedPokemon([]);
    
    forceDismissMilestone();
    resetMilestoneInProgress();
    
    setTimeout(() => {
      console.error(`🔥 [BATTLE_GENERATION_ENHANCED] Battle #${currentBattleCount + 1}: Generating new battle after delay`);
      const newBattle = enhancedStartNewBattle("pairs");
      if (newBattle && newBattle.length > 0) {
        console.error(`🔥 [BATTLE_SUCCESS_ENHANCED] Battle #${currentBattleCount + 1}: New battle generated successfully: ${newBattle.map(p => p.name).join(' vs ')}`);
        setCurrentBattle(newBattle);
        setIsTransitioning(false);
      } else {
        console.error(`🔥 [BATTLE_FAILURE_ENHANCED] Battle #${currentBattleCount + 1}: Failed to generate new battle`);
        setIsTransitioning(false);
      }
      continueBattlesRef.current = false;
    }, 50);
  }, [forceDismissMilestone, enhancedStartNewBattle, resetMilestoneInProgress, setCurrentBattle, setSelectedPokemon, setIsTransitioning]);

  return {
    goBack,
    handleContinueBattles
  };
};
