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
  const recentlyUsed = new Set<number>();
  const previousMatchups = new Set<string>();

  const selectForcedSuggestion = () => {
    const suggestions = rankedPokemon.filter(p => p.suggestedAdjustment && !p.suggestedAdjustment.used);
    if (suggestions.length === 0) return null;

    const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    suggestion.suggestedAdjustment!.used = true;
    return suggestion;
  };

  const startNewBattle = (): Pokemon[] => {
    let firstPokemon: RankedPokemon | null = null;
    if (forceSuggestionPriority) {
      firstPokemon = selectForcedSuggestion();
      if (firstPokemon) {
        const suggestionIndex = rankedPokemon.findIndex(p => p.id === firstPokemon!.id);
        const opponentIndex = direction === 'up'
          ? Math.max(suggestionIndex - 1, 0)
          : Math.min(suggestionIndex + 1, rankedPokemon.length - 1);
        const opponentPokemon = rankedPokemon[opponentIndex];
        setCurrentBattle([firstPokemon, opponentPokemon]);
        toast({ title: `Forced suggestion battle: ${firstPokemon.name} vs ${opponentPokemon.name}` });
        return [firstPokemon, opponentPokemon];
      }
    }

    const availablePokemon = rankedPokemon.filter(p => !recentlyUsed.has(p.id));
    if (availablePokemon.length < 2) {
      recentlyUsed.clear();
      availablePokemon.push(...rankedPokemon);
    }

    let [a, b] = [0, 0];
    do {
      a = Math.floor(Math.random() * availablePokemon.length);
      b = Math.floor(Math.random() * availablePokemon.length);
    } while (a === b || previousMatchups.has(`${availablePokemon[a].id}-${availablePokemon[b].id}`));

    const selected = [availablePokemon[a], availablePokemon[b]];
    recentlyUsed.add(selected[0].id);
    recentlyUsed.add(selected[1].id);
    previousMatchups.add(`${selected[0].id}-${selected[1].id}`);
    setCurrentBattle(selected);
    return selected;
  };

  return { startNewBattle };
};
