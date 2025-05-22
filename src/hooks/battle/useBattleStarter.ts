import { useRef } from 'react';
import { Pokemon } from '@/services/pokemon';
import { RankedPokemon } from './useRankings';

interface SuggestedPokemon {
  pokemonId: number;
  direction: 'up' | 'down';
  usedCount: number;
  maxUses: number;
}

export const useBattleStarter = (
  setCurrentBattle: (pokemon: Pokemon[]) => void,
  pokemonList: RankedPokemon[],
  allPokemonForGeneration: Pokemon[],
  currentFinalRankings: RankedPokemon[],
) => {
  const suggestionsRef = useRef<SuggestedPokemon[]>([]);

  const refreshSuggestions = () => {
    suggestionsRef.current = currentFinalRankings
      .filter((p) => p.suggestedAdjustment && !p.suggestedAdjustment.used)
      .map((p) => ({
        pokemonId: p.id,
        direction: p.suggestedAdjustment!.direction,
        usedCount: 0,
        maxUses: 2, // Adjust this if you want more or fewer battles per suggested Pokémon
      }));
  };

  const startNewBattle = () => {
    // Refresh if we ran out of active suggestions
    if (suggestionsRef.current.length === 0 || suggestionsRef.current.every((s) => s.usedCount >= s.maxUses)) {
      refreshSuggestions();
    }

    // Find the next unused suggestion
    const nextSuggestion = suggestionsRef.current.find((s) => s.usedCount < s.maxUses);

    let pokemonPair: Pokemon[] = [];

    if (nextSuggestion) {
      const suggestedPokemon = pokemonList.find((p) => p.id === nextSuggestion.pokemonId)!;

      const suggestedIndex = pokemonList.findIndex((p) => p.id === nextSuggestion.pokemonId);
      const offset = nextSuggestion.direction === 'up' ? -5 : 5; // moderate difference
      let opponentIndex = suggestedIndex + offset;

      // Handle boundaries
      if (opponentIndex < 0) opponentIndex = 0;
      if (opponentIndex >= pokemonList.length) opponentIndex = pokemonList.length - 1;

      const opponentPokemon = pokemonList[opponentIndex];

      pokemonPair = [suggestedPokemon, opponentPokemon];

      nextSuggestion.usedCount += 1;

      // Mark suggestion used completely if used enough times
      if (nextSuggestion.usedCount >= nextSuggestion.maxUses) {
        const finalRankingPokemon = currentFinalRankings.find((p) => p.id === nextSuggestion.pokemonId);
        if (finalRankingPokemon?.suggestedAdjustment) {
          finalRankingPokemon.suggestedAdjustment.used = true;
        }
      }
    } else {
      // Default logic if no suggestions are active
      const randomPokemon = allPokemonForGeneration.sort(() => 0.5 - Math.random()).slice(0, 2);
      pokemonPair = randomPokemon;
    }

    setCurrentBattle(pokemonPair);
  };

  return {
    startNewBattle,
    refreshSuggestions,
  };
};
