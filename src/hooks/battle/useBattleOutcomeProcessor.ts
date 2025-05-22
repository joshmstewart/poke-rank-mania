
import { useState, useCallback } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { toast } from "@/hooks/use-toast";

// Type definition for the battle starter object
interface BattleStarter {
  startNewBattle: (battleType: BattleType, forcePriority?: boolean) => Pokemon[];
  // Added new reset method
  resetStateAfterMilestone?: () => void;
}

export const useBattleOutcomeProcessor = (
  setBattleResults: React.Dispatch<React.SetStateAction<any[]>>,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  battleStarter?: BattleStarter | null,
  markSuggestionUsed?: (pokemon: RankedPokemon) => void
) => {
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const [milestoneInProgress, setMilestoneInProgress] = useState(false);
  
  const processBattleResult = useCallback(
    (selectedId: number[], currentBattle: Pokemon[], battleType: BattleType, generation?: number) => {
      console.log("⚙️ Processing battle result:", { selectedId, battlePokemons: currentBattle });
      
      setIsProcessingResult(true);
      
      // For pairs battle
      if (battleType === "pairs") {
        const selectedPokemon = currentBattle.find((p) => p.id === selectedId[0]);
        const otherPokemon = currentBattle.find((p) => p.id !== selectedId[0]);
        
        if (selectedPokemon && otherPokemon) {
          setBattleResults((prev) => [
            ...prev,
            {
              winner: selectedPokemon,
              loser: otherPokemon,
              timestamp: new Date().toISOString(),
              generation: generation || 0,
            },
          ]);
          
          // ✅ Step 2: Explicitly check and mark suggestions as used
          if (markSuggestionUsed) {
            // Check if any of the Pokemon in battle have active suggestions
            const selectedWithSuggestion = (selectedPokemon as RankedPokemon).suggestedAdjustment;
            const otherWithSuggestion = (otherPokemon as RankedPokemon).suggestedAdjustment;
            
            if (selectedWithSuggestion && !selectedWithSuggestion.used) {
              console.log(`🎯 Selected Pokémon #${selectedPokemon.id} has an active suggestion - marking as USED`);
              markSuggestionUsed(selectedPokemon as RankedPokemon);
            }
            
            if (otherWithSuggestion && !otherWithSuggestion.used) {
              console.log(`🎯 Non-selected Pokémon #${otherPokemon.id} has an active suggestion - marking as USED`);
              markSuggestionUsed(otherPokemon as RankedPokemon);
            }
          }
        }
      }
      
      // For triplets battle
      if (battleType === "triplets" && selectedId.length >= 2) {
        const firstSelected = currentBattle.find((p) => p.id === selectedId[0]);
        const secondSelected = currentBattle.find((p) => p.id === selectedId[1]);
        const thirdPokemon = currentBattle.find(
          (p) => p.id !== selectedId[0] && p.id !== selectedId[1]
        );
        
        if (firstSelected && secondSelected && thirdPokemon) {
          // Add two battle results - first vs third and second vs third
          setBattleResults((prev) => [
            ...prev,
            {
              winner: firstSelected,
              loser: thirdPokemon,
              timestamp: new Date().toISOString(),
              generation: generation || 0,
            },
            {
              winner: secondSelected,
              loser: thirdPokemon,
              timestamp: new Date().toISOString(),
              generation: generation || 0,
            },
          ]);
          
          // ✅ Step 2: Explicitly check and mark suggestions as used for triplets
          if (markSuggestionUsed) {
            const pokemonWithSuggestions = [
              firstSelected,
              secondSelected,
              thirdPokemon
            ].filter(p => (p as RankedPokemon).suggestedAdjustment && 
                         !(p as RankedPokemon).suggestedAdjustment.used);
            
            if (pokemonWithSuggestions.length > 0) {
              console.log(`🎯 Found ${pokemonWithSuggestions.length} Pokémon with active suggestions in triplet battle`);
              
              pokemonWithSuggestions.forEach(p => {
                console.log(`🎯 Marking suggestion as USED for Pokémon #${p.id}`);
                markSuggestionUsed(p as RankedPokemon);
              });
            }
          }
        }
      }
      
      // Update battles completed count
      setBattlesCompleted((prev) => prev + 1);
      
      // Start a new battle automatically, with a slight delay
      setTimeout(() => {
        if (battleStarter && !milestoneInProgress) {
          battleStarter.startNewBattle(battleType);
        }
        setIsProcessingResult(false);
      }, 250);
    },
    [setBattleResults, setBattlesCompleted, battleStarter, milestoneInProgress, markSuggestionUsed]
  );
  
  // Reset milestone in progress state
  const resetMilestoneInProgress = useCallback(() => {
    if (milestoneInProgress) {
      console.log("🏁 Resetting milestone in progress state");
      setMilestoneInProgress(false);
      
      // ✅ Step 4: Call battle starter reset method if available
      if (battleStarter?.resetStateAfterMilestone) {
        battleStarter.resetStateAfterMilestone();
        console.log("🚩 Explicitly reset battle starter state after milestone completion");
      }
      
      // Dispatch milestone ended event
      setTimeout(() => {
        console.log("📢 Dispatching milestoneEnded event");
        window.dispatchEvent(new Event("milestoneEnded"));
      }, 100);
    }
  }, [milestoneInProgress, battleStarter]);

  return {
    processBattleResult,
    isProcessingResult,
    milestoneInProgress,
    setMilestoneInProgress,
    resetMilestoneInProgress
  };
};
