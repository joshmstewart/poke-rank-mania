import { useState, useEffect, useRef } from 'react';
import { Pokemon } from '@/services/pokemon';
import { RankedPokemon } from './useRankings';

interface Suggestion {
  pokemonId: number;
  direction: 'up' | 'down';
}

export const useBattleStarter = (
  rankedPokemon: RankedPokemon[],
  allPokemon: Pokemon[],
) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const suggestionIndex = useRef(0);
  const forcedPriorityBattles = useRef(0);

  useEffect(() => {
    // Clearly set all Pokémon with user suggestions
    const activeSuggestions = rankedPokemon
      .filter(p => p.suggestedAdjustment && !p.suggestedAdjustment.used)
      .map(p => ({
        pokemonId: p.id,
        direction: p.suggestedAdjustment!.direction,
      }));

    setSuggestions(activeSuggestions);
    forcedPriorityBattles.current = activeSuggestions.length * 2; // explicit multiple rounds of prioritization
    suggestionIndex.current = 0;
  }, [rankedPokemon]);

  const getBattleWithSuggestion = (): Pokemon[] => {
    if (suggestions.length === 0) return getRandomBattle();

    // Explicitly cycle through all suggestions
    const suggestion = suggestions[suggestionIndex.current % suggestions.length];
    suggestionIndex.current += 1;

    const pokemonWithSuggestion = allPokemon.find(p => p.id === suggestion.pokemonId)!;
    const opponent = allPokemon.find(p => p.id !== suggestion.pokemonId)!;

    return [pokemonWithSuggestion, opponent];
  };

  const getRandomBattle = (): Pokemon[] => {
    return allPokemon.sort(() => Math.random() - 0.5).slice(0, 2);
  };

  const getNextBattle = (): Pokemon[] => {
    if (forcedPriorityBattles.current > 0) {
      forcedPriorityBattles.current -= 1;
      return getBattleWithSuggestion();
    }

    // Even after forced battles, keep cycling through suggestions
    if (suggestions.length > 0 && suggestionIndex.current < suggestions.length * 3) {
      // Continue cycling explicitly multiple times
      return getBattleWithSuggestion();
    }

    return getRandomBattle();
  };

  return {
    getNextBattle,
    suggestions,
  };
};
