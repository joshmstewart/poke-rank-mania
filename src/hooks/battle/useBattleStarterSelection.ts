
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const useBattleStarterSelection = (
  allPokemon: Pokemon[],
  currentRankings: RankedPokemon[] = []
) => {
  let shouldPrioritizeSuggestions = false;

  const resetSuggestionPriority = () => {
    shouldPrioritizeSuggestions = true;
    console.log("🚨 Battle starter: Suggestion priority reset - will prioritize suggestions");
  };

  const createWeightedCandidates = (
    candidatePokemon: Pokemon[],
    recentlySeenPokemon: Set<number>,
    battleTracking: Record<number, number>
  ) => {
    return candidatePokemon.map(pokemon => {
      let weight = 1.0;
      
      if (recentlySeenPokemon.has(pokemon.id)) {
        weight *= 0.3;
      }
      
      const timesSeenInBattles = battleTracking[pokemon.id] || 0;
      if (timesSeenInBattles === 0) {
        weight *= 1.5;
      } else if (timesSeenInBattles < 3) {
        weight *= 1.2;
      }
      
      return { pokemon, weight };
    });
  };

  const selectWeightedPokemon = (
    weightedCandidates: Array<{ pokemon: Pokemon; weight: number }>,
    battleSize: number
  ): Pokemon[] => {
    const battlePokemon: Pokemon[] = [];
    
    for (let i = 0; i < battleSize; i++) {
      if (weightedCandidates.length === 0) break;
      
      const totalWeight = weightedCandidates.reduce((sum, item) => sum + item.weight, 0);
      let random = Math.random() * totalWeight;
      
      let selectedIndex = 0;
      for (let j = 0; j < weightedCandidates.length; j++) {
        random -= weightedCandidates[j].weight;
        if (random <= 0) {
          selectedIndex = j;
          break;
        }
      }
      
      const selected = weightedCandidates[selectedIndex];
      battlePokemon.push(selected.pokemon);
      weightedCandidates.splice(selectedIndex, 1);
    }
    
    return battlePokemon;
  };

  const selectWithSuggestions = (
    battleSize: number,
    candidatePokemon: Pokemon[],
    onMarkSuggestionUsed?: (pokemonId: number) => void
  ): Pokemon[] => {
    const suggestedPokemon = currentRankings
      .filter(p => p.suggestedAdjustment && !p.suggestedAdjustment.used)
      .filter(p => candidatePokemon.some(cp => cp.id === p.id));

    if (!shouldPrioritizeSuggestions || suggestedPokemon.length < 1) {
      return [];
    }

    console.log(`⭐ Prioritizing suggestions: Found ${suggestedPokemon.length} suggested Pokemon`);
    
    const battlePokemon: Pokemon[] = [];
    const selectedSuggestion = suggestedPokemon[Math.floor(Math.random() * suggestedPokemon.length)];
    battlePokemon.push(selectedSuggestion);
    
    if (onMarkSuggestionUsed) {
      onMarkSuggestionUsed(selectedSuggestion.id);
      console.log(`✅ Marked suggestion as used: ${selectedSuggestion.name}`);
    }
    
    const nonSuggestedCandidates = candidatePokemon.filter(
      p => !suggestedPokemon.some(sp => sp.id === p.id) && 
          !battlePokemon.some(bp => bp.id === p.id)
    );
    
    const remainingSlots = battleSize - 1;
    const shuffled = nonSuggestedCandidates.sort(() => Math.random() - 0.5);
    battlePokemon.push(...shuffled.slice(0, remainingSlots));
    
    shouldPrioritizeSuggestions = false;
    return battlePokemon;
  };

  return {
    resetSuggestionPriority,
    createWeightedCandidates,
    selectWeightedPokemon,
    selectWithSuggestions
  };
};
