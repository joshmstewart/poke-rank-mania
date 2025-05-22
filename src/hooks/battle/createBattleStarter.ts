
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
    
    // Find ALL Pokemon with unused suggestions
    const unusedSuggestions = rankedPokemon.filter(
      (p) => p.suggestedAdjustment && !p.suggestedAdjustment.used,
    );

    if (unusedSuggestions.length === 0) {
      console.log("No unused suggestions available");
      return null;
    }

    // Log the available suggestions to debug
    console.log(`🎯 Found ${unusedSuggestions.length} Pokemon with unused suggestions to choose from`);
    unusedSuggestions.forEach((p, i) => {
      console.log(`🎯 Suggestion #${i+1}: ${p.name} (${p.id}) - Direction: ${p.suggestedAdjustment?.direction}`);
    });

    const randomIndex = Math.floor(Math.random() * unusedSuggestions.length);
    const selectedPokemon = unusedSuggestions[randomIndex];

    if (selectedPokemon && selectedPokemon.suggestedAdjustment) {
      // We don't mark it as used here - that happens after battle completion
      lastUsedSuggestion.set(selectedPokemon.id, Date.now());
      
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
    
    // Always check for suggestions before each battle
    const suggestedPokemon = rankedPokemon.filter(p => p.suggestedAdjustment && !p.suggestedAdjustment.used);
    const hasSuggestions = suggestedPokemon.length > 0;
    
    // Explicitly log whether we're forcing suggestion priority
    console.log(`🔍 Starting new battle: forceSuggestionPriority=${forceSuggestionPriority}, hasSuggestions=${hasSuggestions}`);
    
    if (hasSuggestions) {
      // Always log available suggestions for debugging
      console.log(`🎯 Found ${suggestedPokemon.length} Pokemon with unused suggestions:`);
      suggestedPokemon.slice(0, 5).forEach((p, i) => {
        console.log(`🎯 Suggestion #${i+1}: ${p.name} (${p.id}) - Direction: ${p.suggestedAdjustment?.direction}`);
      });
    }
    
    if ((forceSuggestionPriority || Math.random() < 0.8) && hasSuggestions) {
      console.log(`🚨 Using FORCED suggestion prioritization or random chance triggered`);
      
      // Use suggestion priority logic - more aggressive selection
      const suggestionPokemon = selectSuggestedPokemonForced();
      if (!suggestionPokemon) {
        // No suggestions available, fall back to regular battle selection
        console.log(`⚠️ No suggestion Pokemon available, falling back to regular selection`);
        return startRegularBattle();
      }

      const suggestionIndex = rankedPokemon.findIndex(
        (p) => p.id === suggestionPokemon.id,
      );

      // Find appropriate opponent based on direction
      const opponentIndex =
        direction === 'up'
          ? Math.max(suggestionIndex - 1 - Math.floor(Math.random() * 3), 0)
          : Math.min(suggestionIndex + 1 + Math.floor(Math.random() * 3), rankedPokemon.length - 1);

      const opponentPokemon = rankedPokemon[opponentIndex];

      if (!opponentPokemon) {
        // This shouldn't happen if we have at least 2 ranked Pokémon, but handle it anyway
        console.warn(`⚠️ Failed to find opponent for suggestion battle, using regular selection`);
        return startRegularBattle();
      }

      // Log the final battle setup with suggestion
      console.log(`🎮 Creating suggestion battle: ${suggestionPokemon.name} (#${suggestionPokemon.id}) vs ${opponentPokemon.name} (#${opponentPokemon.id})`);
      console.log(`🎯 Suggestion battle direction: ${suggestionPokemon.suggestedAdjustment?.direction}`);
      
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

    // Log if we have any suggestions during regular battle selection
    if (suggested.size > 0) {
      console.log(`ℹ️ Regular battle selection with ${suggested.size} suggestions available`);
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
