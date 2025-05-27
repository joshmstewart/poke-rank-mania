
import { useCallback } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";

export const useBattleProcessorCore = (
  battleResults: SingleBattle[],
  setBattleResults: React.Dispatch<React.SetStateAction<SingleBattle[]>>,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>,
  markSuggestionUsed?: (pokemon: RankedPokemon, fullyUsed?: boolean) => void
) => {
  const processBattleCore = useCallback((
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    processResult: (selectedPokemonIds: number[], battleType: BattleType, currentBattlePokemon: Pokemon[]) => SingleBattle[] | null,
    battleType: BattleType,
    timestamp: string
  ) => {
    console.log(`📝 [${timestamp}] PROCESS BATTLE: Processing battle result with selectedPokemonIds: ${selectedPokemonIds.join(', ')}`);
    const newResults = processResult(selectedPokemonIds, battleType, currentBattlePokemon);

    if (!newResults || newResults.length === 0) {
      console.warn(`📝 [${timestamp}] PROCESS BATTLE: No battle results returned`);
      return null;
    }

    const updatedResults = [...battleResults, ...newResults];
    setBattleResults(updatedResults);
    setSelectedPokemon([]);

    // Handle suggestion marking
    console.log(`[DEBUG useBattleProcessor] Timestamp: ${timestamp}. Iterating currentBattlePokemon for markSuggestionUsed.`);
    currentBattlePokemon.forEach(p => {
      const ranked = p as RankedPokemon;
      const suggestionDetails = ranked.suggestedAdjustment 
        ? `Suggestion Exists - Used: ${ranked.suggestedAdjustment.used}, Direction: ${ranked.suggestedAdjustment.direction}` 
        : 'No Suggestion Present';
      console.log(`[DEBUG useBattleProcessor] Pokemon: ${ranked.name} (${ranked.id}). ${suggestionDetails}`);
    });

    if (markSuggestionUsed) {
      currentBattlePokemon.forEach(p => {
        const ranked = p as RankedPokemon;
        if (ranked.suggestedAdjustment && !ranked.suggestedAdjustment.used) {
          markSuggestionUsed(ranked, false); // Pass false to indicate not fully used yet
          console.log(`📝 [${timestamp}] PROCESS BATTLE: Notified markSuggestionUsed for ${ranked.name} (${ranked.id}). fullyUsed=false`);
        }
      });
    }

    return updatedResults;
  }, [battleResults, setBattleResults, setSelectedPokemon, markSuggestionUsed]);

  return { processBattleCore };
};
