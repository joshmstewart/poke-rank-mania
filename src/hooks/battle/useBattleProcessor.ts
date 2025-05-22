
import { useState, useCallback, useRef } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { useBattleProgression } from "./useBattleProgression";
import { useNextBattleHandler } from "./useNextBattleHandler";
import { useBattleResultProcessor } from "./useBattleResultProcessor";
import { saveRankings } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";

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
  battleStarter?: any,
  markSuggestionUsed?: (pokemon: RankedPokemon) => void
) => {
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const milestoneInProgressRef = useRef(false);
  const suggestionFoundInBattleRef = useRef(false);

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
      const newBattle = shuffled.slice(0, battleSize);
      setCurrentBattle(newBattle);
      setSelectedPokemon([]);
    },
    setSelectedPokemon
  );

  const { processResult } = useBattleResultProcessor(
    battleResults,
    setBattleResults,
    activeTier,
    freezePokemonForTier,
    battleStarter?.trackLowerTierLoss
  );

  const processBattle = useCallback(async (
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    currentSelectedGeneration: number = 0
  ) => {
    if (isProcessingResult || milestoneInProgressRef.current) {
      console.log("⏳ Skipping processBattle (already in progress)");
      return;
    }

    setIsProcessingResult(true);
    suggestionFoundInBattleRef.current = false;
    
    try {
      // Check for suggestions in this battle and handle them first
      const pokemonWithSuggestions = currentBattlePokemon.filter(p => {
        const ranked = p as RankedPokemon;
        return ranked.suggestedAdjustment && !ranked.suggestedAdjustment.used;
      });
      
      if (pokemonWithSuggestions.length > 0) {
        console.log(`🎯 Found ${pokemonWithSuggestions.length} Pokemon with suggestions in current battle`);
        suggestionFoundInBattleRef.current = true;
        
        // If we have suggestion(s) in battle but none were selected, remind the user
        if (selectedPokemonIds.length === 0) {
          toast({
            title: "Suggestion Available",
            description: "Select a Pokemon to refine its ranking",
            duration: 3000
          });
          setIsProcessingResult(false);
          return;
        }
        
        // If the user selected a Pokemon that has no suggestion, remind them
        const selectedWithSuggestion = pokemonWithSuggestions.some(p => selectedPokemonIds.includes(p.id));
        if (!selectedWithSuggestion && pokemonWithSuggestions.length > 0) {
          const suggestedNames = pokemonWithSuggestions.map(p => p.name).join(', ');
          toast({
            title: "Suggestion Available",
            description: `Select ${suggestedNames} to refine rankings`,
            duration: 3000
          });
          setIsProcessingResult(false);
          return;
        }
      }

      const newResults = processResult(selectedPokemonIds, battleType, currentBattlePokemon);

      if (!newResults || newResults.length === 0) {
        console.warn("⚠️ No battle results returned");
        setIsProcessingResult(false);
        return;
      }

      const updatedResults = [...battleResults, ...newResults];
      setBattleResults(updatedResults);
      setSelectedPokemon([]);

      // CRITICAL: Mark suggestions as used AFTER processing results
      if (markSuggestionUsed) {
        // For each selected Pokemon that has a suggestion, mark it as used
        const selectedSuggestedPokemon = currentBattlePokemon.filter(p => {
          const rankedP = p as RankedPokemon;
          return selectedPokemonIds.includes(p.id) && 
                 rankedP.suggestedAdjustment && 
                 !rankedP.suggestedAdjustment.used;
        });
        
        if (selectedSuggestedPokemon.length > 0) {
          console.log(`🎯 Marking ${selectedSuggestedPokemon.length} suggestions as used`);
          selectedSuggestedPokemon.forEach(p => {
            markSuggestionUsed(p as RankedPokemon);
          });
          
          // After using suggestions, check if there are more that need to be prioritized
          setTimeout(() => {
            document.dispatchEvent(new Event('prioritizeSuggestions'));
          }, 1000);
        }
      }

      const milestone = incrementBattlesCompleted(updatedResults);
      if (typeof milestone === "number") {
        milestoneInProgressRef.current = true;
        saveRankings(allPokemon, currentSelectedGeneration, "battle");
        generateRankings(updatedResults);
        
        // Dispatch an event that signals we've ended a milestone
        document.dispatchEvent(new Event('milestoneEnded'));
      }

      await setupNextBattle(battleType);
      setIsProcessingResult(false);
    } catch (e) {
      console.error("🔥 Error in processBattle:", e);
      setIsProcessingResult(false);
    }
  }, [
    battleResults,
    processResult,
    incrementBattlesCompleted,
    generateRankings,
    setupNextBattle,
    setSelectedPokemon,
    allPokemon,
    markSuggestionUsed,
    isProcessingResult
  ]);

  const resetMilestoneInProgress = useCallback(() => {
    milestoneInProgressRef.current = false;
  }, []);

  return {
    processBattleResult: processBattle,
    isProcessingResult,
    resetMilestoneInProgress
  };
};
