
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
  const selectedSuggestionIdsThisSession = new Set<number>();

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

    // First, try to select suggestions we haven't used yet in this session
    const freshSuggestions = unusedSuggestions.filter(p => !selectedSuggestionIdsThisSession.has(p.id));
    
    if (freshSuggestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * freshSuggestions.length);
      const selectedPokemon = freshSuggestions[randomIndex];
      
      if (selectedPokemon) {
        console.log(`🎯 Selected FRESH suggestion Pokémon #${selectedPokemon.id} (${selectedPokemon.name})`);
        selectedSuggestionIdsThisSession.add(selectedPokemon.id);
        return selectedPokemon;
      }
    }
    
    // If we've used all suggestions at least once this session, pick randomly from all
    const randomIndex = Math.floor(Math.random() * unusedSuggestions.length);
    const selectedPokemon = unusedSuggestions[randomIndex];

    if (selectedPokemon && selectedPokemon.suggestedAdjustment) {
      // We don't mark it as used here - that happens after battle completion
      lastUsedSuggestion.set(selectedPokemon.id, Date.now());
      selectedSuggestionIdsThisSession.add(selectedPokemon.id);
      
      console.log(`🎯 Selected repeated suggestion Pokémon #${selectedPokemon.id} (${selectedPokemon.name})`);
      return selectedPokemon;
    }
    
    return null;
  };

  const startNewBattle = (): Pokemon[] => {
    // Major debugging output at the start of each battle
    console.log(`[createBattleStarter] startNewBattle called. Received forceSuggestionPriority: ${forceSuggestionPriority}, selectedSuggestionsCount: ${selectedSuggestionIdsThisSession.size}`);

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
    console.log(`🔍 [createBattleStarter] Starting new battle: forceSuggestionPriority=${forceSuggestionPriority}, hasSuggestions=${hasSuggestions}`);
    
    if (hasSuggestions) {
      // Always log available suggestions for debugging
      console.log(`🎯 Found ${suggestedPokemon.length} Pokemon with unused suggestions:`);
      suggestedPokemon.slice(0, 5).forEach((p, i) => {
        console.log(`🎯 Suggestion #${i+1}: ${p.name} (${p.id}) - Direction: ${p.suggestedAdjustment?.direction}`);
      });
    }
    
    // CRITICAL: Updated logic for using suggestions
    // Now always prioritize suggestions when forceSuggestionPriority is true
    let didPickSuggestedPokemon = false;
    
    if (forceSuggestionPriority && hasSuggestions) {
      console.log(`🚨 Using FORCED suggestion prioritization`);
      
      // Use suggestion priority logic - more aggressive selection
      const suggestionPokemon = selectSuggestedPokemonForced();
      if (!suggestionPokemon) {
        // No suggestions available, fall back to regular battle selection
        console.log(`⚠️ No suggestion Pokemon available, falling back to regular selection`);
        return startRegularBattle();
      }
      
      didPickSuggestedPokemon = true;
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
    } else {
      if (forceSuggestionPriority && !hasSuggestions) {
        console.warn('[createBattleStarter] Suggestion priority was forced, but NO suggested Pokémon was picked. Reason: No unused suggestions available');
      } else if (!forceSuggestionPriority && hasSuggestions) {
        console.log('[createBattleStarter] Unused suggestions exist, but priority mode is not active');
      }
      
      return startRegularBattle();
    }
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
    // Do NOT clear selectedSuggestionIdsThisSession here, that tracks across milestones
    console.log("🔄 Cleared recentlyUsed, previousMatchups, lastUsedSuggestion after milestone");
  };
  
  // Add a cleanup method that's called when prioritization ends
  const resetSuggestionTracking = () => {
    selectedSuggestionIdsThisSession.clear();
    console.log("🧹 Cleared suggestion tracking data");
  };

  return { 
    startNewBattle,
    resetStateAfterMilestone,
    resetSuggestionTracking
  };
};
