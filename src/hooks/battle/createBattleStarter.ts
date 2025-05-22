
import { Pokemon } from '@/services/pokemon';
import { RankedPokemon } from '@/services/pokemon/types';
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

  const selectSuggestedPokemonForced = (): RankedPokemon | null => {
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
    
    console.log(`🎯 Explicitly selected suggestion Pokémon #${selectedPokemon.id} (${selectedPokemon.name})`);
    return selectedPokemon;
  };

  const startNewBattle = (): Pokemon[] => {
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
      if (!suggestionPokemon) {
        return [];
      }

      const suggestionIndex = rankedPokemon.findIndex(
        (p) => p.id === suggestionPokemon.id,
      );

      const opponentIndex =
        direction === 'up'
          ? Math.max(suggestionIndex - 1, 0)
          : Math.min(suggestionIndex + 1, rankedPokemon.length - 1);

      const opponentPokemon = rankedPokemon[opponentIndex];

      const newBattle = [suggestionPokemon, opponentPokemon];
      setCurrentBattle(newBattle);
      toast({
        title: `Forced suggestion battle: ${suggestionPokemon.name} vs ${opponentPokemon.name}`,
      });

      return newBattle;
    }

    // Regular battle logic (ensure always returns Pokemon[])
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

    const newBattle = [firstPokemon, secondPokemon];
    setCurrentBattle(newBattle);

    return newBattle;
  };

  const resetStateAfterMilestone = () => {
    recentlyUsed.clear();
    previousMatchups.clear();
    lastUsedSuggestion.clear();
    console.log("🔄 Cleared recentlyUsed, previousMatchups, lastUsedSuggestion after milestone");
  };

  return { 
    startNewBattle,
    resetStateAfterMilestone
  };
};
