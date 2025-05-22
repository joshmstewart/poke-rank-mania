import { Pokemon } from '@/services/pokemon';
import { RankedPokemon } from './useRankings';
import { toast } from '@/hooks/use-toast';

export const createBattleStarter = (
  setCurrentBattle: (battle: Pokemon[]) => void,
  rankedPokemon: RankedPokemon[],
  forceSuggestionPriority: boolean,
  direction: 'up' | 'down',
  allPokemon: Pokemon[],
) => {
  const suggested = new Map<number, RankedPokemon>();
  const recentlyUsed = new Set<number>();
  const previousMatchups = new Set<string>();
  const lastUsedSuggestion = new Map<number, number>();

  const selectSuggestedPokemonForced = () => {
    const unusedSuggestions = rankedPokemon.filter(
      (p) => p.suggestedAdjustment && !p.suggestedAdjustment.used,
    );

    if (unusedSuggestions.length === 0) {
      toast({ title: 'No unused suggestions available' });
      return null;
    }

    const randomIndex = Math.floor(Math.random() * unusedSuggestions.length);
    const selectedPokemon = unusedSuggestions[randomIndex];

    selectedPokemon.suggestedAdjustment!.used = true;
    lastUsedSuggestion.set(selectedPokemon.id, 0);

    return selectedPokemon;
  };

  const startNewBattle = () => {
    if (forceSuggestionPriority) {
      recentlyUsed.clear();
      previousMatchups.clear();
      lastUsedSuggestion.clear();

      rankedPokemon.forEach((p) => {
        if (p.suggestedAdjustment) {
          p.suggestedAdjustment.used = false;
        }
      });

      suggested.clear();
      rankedPokemon
        .filter((p) => p.suggestedAdjustment)
        .forEach((p) => suggested.set(p.id, p));

      console.log('🚨 Fully reset suggestion state for forced prioritization.');

      const suggestionPokemon = selectSuggestedPokemonForced();
      if (!suggestionPokemon) return;

      const suggestionIndex = rankedPokemon.findIndex(
        (p) => p.id === suggestionPokemon.id,
      );

      const opponentIndex =
        direction === 'up'
          ? Math.max(suggestionIndex - 1, 0)
          : Math.min(suggestionIndex + 1, rankedPokemon.length - 1);

      const opponentPokemon = rankedPokemon[opponentIndex];

      setCurrentBattle([suggestionPokemon, opponentPokemon]);
      toast({
        title: `Forced suggestion battle: ${suggestionPokemon.name} vs ${opponentPokemon.name}`,
      });

      return;
    }

    // Regular battle logic
    suggested.clear();
    rankedPokemon
      .filter((p) => p.suggestedAdjustment && !p.suggestedAdjustment.used)
      .forEach((p) => suggested.set(p.id, p));

    const availablePokemon = rankedPokemon.filter(
      (p) => !recentlyUsed.has(p.id),
    );

    if (availablePokemon.length < 2) {
      recentlyUsed.clear();
      availablePokemon.push(...rankedPokemon);
    }

    const firstIndex = Math.floor(Math.random() * availablePokemon.length);
    let secondIndex = Math.floor(Math.random() * availablePokemon.length);

    while (
      secondIndex === firstIndex ||
      previousMatchups.has(
        `${availablePokemon[firstIndex].id}-${availablePokemon[secondIndex].id}`,
      )
    ) {
      secondIndex = Math.floor(Math.random() * availablePokemon.length);
    }

    const firstPokemon = availablePokemon[firstIndex];
    const secondPokemon = availablePokemon[secondIndex];

    recentlyUsed.add(firstPokemon.id);
    recentlyUsed.add(secondPokemon.id);
    previousMatchups.add(`${firstPokemon.id}-${secondPokemon.id}`);

    setCurrentBattle([firstPokemon, secondPokemon]);
  };

  return { startNewBattle };
};
