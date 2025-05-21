
import { useState, useCallback, useRef } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { useBattleProgression } from "./useBattleProgression";
import { useNextBattleHandler } from "./useNextBattleHandler";
import { useBattleResultProcessor } from "./useBattleResultProcessor";
import { saveRankings } from "@/services/pokemon";

export const useBattleProcessor = (
  battleResults: SingleBattle[],
  setBattleResults: React.Dispatch<React.SetStateAction<SingleBattle[]>>,
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  allPokemon: Pokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  milestones: number[],
  generateRankings: (results: SingleBattle[]) => void,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>,
  activeTier?: TopNOption,
  freezePokemonForTier?: (pokemonId: number, tier: TopNOption) => void,
  battleStarter?: any, // Accept the battle starter to access trackLowerTierLoss
  markSuggestionUsed?: (pokemon: RankedPokemon) => void // New parameter
) => {
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const processedMilestonesRef = useRef<Set<number>>(new Set());
  const milestoneInProgressRef = useRef(false);

  const { incrementBattlesCompleted } = useBattleProgression(
    battlesCompleted,
    setBattlesCompleted,
    setShowingMilestone,
    milestones,
    generateRankings
  );

  const { setupNextBattle } = useNextBattleHandler(
    allPokemon,
    (battleType: BattleType) => {
      const shuffled = [...allPokemon].sort(() => Math.random() - 0.5);
      const battleSize = battleType === "triplets" ? 3 : 2;
      setCurrentBattle(shuffled.slice(0, battleSize));
      setSelectedPokemon([]);
    },
    setSelectedPokemon
  );

  const { processResult } = useBattleResultProcessor(
    battleResults, 
    setBattleResults,
    activeTier,
    freezePokemonForTier,
    battleStarter?.trackLowerTierLoss // Pass the function if available
  );

  const processBattle = useCallback(async (
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    currentSelectedGeneration: number = 0
  ) => {
    if (isProcessingResult || milestoneInProgressRef.current) {
      console.log("Already processing a battle or milestone, ignoring");
      return;
    }
    
    console.log(`Processing battle with selected IDs: ${selectedPokemonIds.join(", ")}`);
    setIsProcessingResult(true);

    try {
      const newResults = processResult(selectedPokemonIds, battleType, currentBattlePokemon);
      
      if (newResults && newResults.length > 0) {
        const cumulativeResults = [...battleResults, ...newResults];
        setBattleResults(cumulativeResults);
        
        // Check if any of the Pokemon in the battle had active suggestions
        // and mark them as used
        if (markSuggestionUsed) {
          currentBattlePokemon.forEach(pokemon => {
            if ((pokemon as RankedPokemon).suggestedAdjustment && 
                !(pokemon as RankedPokemon).suggestedAdjustment?.used) {
              markSuggestionUsed(pokemon as RankedPokemon);
            }
          });
        }
        
        console.log("🟡 useBattleProcessor: incremented battles completed");
        incrementBattlesCompleted(cumulativeResults);

        // Calculate updated count directly to prevent race conditions
        const updatedCount = battlesCompleted + 1;
        
        // Check for milestone and handle UI accordingly
        if (milestones.includes(updatedCount) && !processedMilestonesRef.current.has(updatedCount)) {
          // Flag that we're processing a milestone to prevent duplicate processing
          milestoneInProgressRef.current = true;
          processedMilestonesRef.current.add(updatedCount);
          console.log(`🎉 Milestone reached: ${updatedCount} battles`);
          
          // Save the rankings
          saveRankings(
            Array.from(new Map(cumulativeResults.map(result => [result.winner.id, result.winner])).values()),
            currentSelectedGeneration,
            "battle"
          );
          
          // Generate rankings for the milestone
          generateRankings(cumulativeResults);
          
          // Show milestone view
          setShowingMilestone(true);
          
          // Return early as we're showing milestone view
          setIsProcessingResult(false);
          return;
        }

        // Only setup next battle if we're not showing a milestone
        if (!milestoneInProgressRef.current) {
          // Add small delay for UI to update
          setTimeout(async () => {
            await setupNextBattle(battleType);
            setIsProcessingResult(false);
          }, 300);
        }
      } else {
        console.error("Failed to process battle result properly");
        setIsProcessingResult(false);
      }
    } catch (error) {
      console.error("Error processing battle:", error);
      setIsProcessingResult(false);
    }
  }, [
    isProcessingResult, 
    processResult, 
    battleResults, 
    setBattleResults, 
    incrementBattlesCompleted, 
    battlesCompleted, 
    milestones, 
    setupNextBattle,
    generateRankings,
    setShowingMilestone,
    markSuggestionUsed // Add this new dependency
  ]);

  return { 
    processBattleResult: processBattle, 
    isProcessingResult,
    resetMilestoneInProgress: () => {
      milestoneInProgressRef.current = false;
    }
  };
};
