
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
    if (!Array.isArray(rankedPokemon) || rankedPokemon.length === 0) {
      console.warn("No ranked Pokémon available for suggestion selection");
      return null;
    }
    
    const unusedSuggestions = rankedPokemon.filter(
      (p) => p.suggestedAdjustment && !p.suggestedAdjustment.used,
    );

    if (unusedSuggestions.length === 0) {
      console.log("No unused suggestions available");
      return null;
    }

    const randomIndex = Math.floor(Math.random() * unusedSuggestions.length);
    const selectedPokemon = unusedSuggestions[randomIndex];

    if (selectedPokemon && selectedPokemon.suggestedAdjustment) {
      selectedPokemon.suggestedAdjustment.used = true;
      lastUsedSuggestion.set(selectedPokemon.id, 0);
      
      console.log(`🎯 Selected suggestion Pokémon #${selectedPokemon.id} (${selectedPokemon.name})`);
      return selectedPokemon;
    }
    
    return null;
  };

  const startNewBattle = (): Pokemon[] => {
    if (!Array.isArray(rankedPokemon) || rankedPokemon.length < 2) {
      console.warn("Not enough ranked Pokémon for a battle, using allPokemon as fallback");
      
      if (!Array.isArray(allPokemon) || allPokemon.length < 2) {
        console.error("No Pokémon data available for battle");
        toast({ 
          title: "Error starting battle", 
          description: "Not enough Pokémon data available",
          variant: "destructive" 
        });
        return [];
      }
      
      // Emergency fallback - use random Pokémon from allPokemon
      const shuffled = [...allPokemon].sort(() => Math.random() - 0.5);
      const newBattle = shuffled.slice(0, 2);
      setCurrentBattle(newBattle);
      return newBattle;
    }
    
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
        // No suggestions available, fall back to regular battle selection
        return startRegularBattle();
      }

      const suggestionIndex = rankedPokemon.findIndex(
        (p) => p.id === suggestionPokemon.id,
      );

      const opponentIndex =
        direction === 'up'
          ? Math.max(suggestionIndex - 1, 0)
          : Math.min(suggestionIndex + 1, rankedPokemon.length - 1);

      const opponentPokemon = rankedPokemon[opponentIndex];

      if (!opponentPokemon) {
        // This shouldn't happen if we have at least 2 ranked Pokémon, but handle it anyway
        return startRegularBattle();
      }

      const newBattle = [suggestionPokemon, opponentPokemon];
      setCurrentBattle(newBattle);
      
      return newBattle;
    }

    return startRegularBattle();
  };
  
  const startRegularBattle = (): Pokemon[] => {
    // Regular battle logic (ensure always returns Pokemon[])
    suggested.clear();
    
    if (Array.isArray(rankedPokemon)) {
      rankedPokemon
        .filter((p) => p.suggestedAdjustment && !p.suggestedAdjustment.used)
        .forEach((p) => suggested.set(p.id, p));
    }

    let availablePokemon = [...rankedPokemon].filter(
      (p) => !recentlyUsed.has(p.id),
    );

    if (availablePokemon.length < 2) {
      recentlyUsed.clear();
      availablePokemon = [...rankedPokemon];
    }

    if (availablePokemon.length < 2) {
      console.warn("Not enough Pokémon for battle after filtering, using all Pokémon");
      
      // Emergency fallback
      const shuffled = [...allPokemon].sort(() => Math.random() - 0.5);
      const newBattle = shuffled.slice(0, 2);
      setCurrentBattle(newBattle);
      return newBattle;
    }

    const firstIndex = Math.floor(Math.random() * availablePokemon.length);
    let secondIndex = Math.floor(Math.random() * availablePokemon.length);
    let attemptCount = 0;
    const MAX_ATTEMPTS = 10;

    while (
      (secondIndex === firstIndex || 
       previousMatchups.has(`${availablePokemon[firstIndex].id}-${availablePokemon[secondIndex].id}`)) &&
      attemptCount < MAX_ATTEMPTS
    ) {
      secondIndex = Math.floor(Math.random() * availablePokemon.length);
      attemptCount++;
    }

    // If we couldn't find a unique battle after max attempts, just use what we have
    const firstPokemon = availablePokemon[firstIndex];
    const secondPokemon = availablePokemon[secondIndex];

    if (!firstPokemon || !secondPokemon) {
      console.error("Failed to select valid Pokémon for battle");
      
      // Emergency fallback
      const shuffled = [...allPokemon].sort(() => Math.random() - 0.5);
      const newBattle = shuffled.slice(0, 2);
      setCurrentBattle(newBattle);
      return newBattle;
    }

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
